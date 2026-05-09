### Build stage
FROM oven/bun:1.3.13-alpine AS builder

WORKDIR /app

# Build-time env (needed for Next.js public env embedding)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG GEMINI_MODEL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV GEMINI_MODEL=$GEMINI_MODEL

# Faster installs with cached deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Prisma client (recommended for container builds)
RUN bun run db:generate

# Build Next standalone (your script also copies static/public)
RUN bun run build


### Runtime stage
FROM oven/bun:1.3.13-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy standalone output (includes server.js and minimal node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER app

EXPOSE 3000

CMD ["bun", "server.js"]

