import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const MAX_LESSONS = 100
const MAX_TITLE_LEN = 500
const MAX_BODY_LEN = 80_000

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const profile = await db.profiles.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  const role = (profile?.role ?? '').toLowerCase()
  if (!profile || role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Hanya admin yang dapat mengubah modul' },
        { status: 403 },
      ),
    }
  }

  return { userId: user.id }
}

function normalizeContentPayload(
  raw: unknown,
): { ok: true; content: { title: string; body: string }[] } | { ok: false; message: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, message: 'Content harus berupa array' }
  }
  if (raw.length > MAX_LESSONS) {
    return { ok: false, message: `Maksimal ${MAX_LESSONS} bagian` }
  }

  const content: { title: string; body: string }[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== 'object') {
      return { ok: false, message: `Item ${i + 1} tidak valid` }
    }
    const o = item as Record<string, unknown>
    const titleIn = typeof o.title === 'string' ? o.title : ''
    const bodyIn = typeof o.body === 'string' ? o.body : ''
    const title = titleIn.trim().slice(0, MAX_TITLE_LEN)
    const body = bodyIn.slice(0, MAX_BODY_LEN)
    if (!title && !body) continue
    content.push({
      title: title || 'Bagian',
      body,
    })
  }

  return { ok: true, content }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(request)
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    if (!id?.trim()) {
      return NextResponse.json({ error: 'ID modul tidak valid' }, { status: 400 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const raw = body as { content?: unknown }
    if (!('content' in raw)) {
      return NextResponse.json({ error: 'Field content wajib ada' }, { status: 400 })
    }

    const normalized = normalizeContentPayload(raw.content)
    if (!normalized.ok) {
      return NextResponse.json({ error: normalized.message }, { status: 400 })
    }

    const exists = await db.learning_modules.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: 'Modul tidak ditemukan' }, { status: 404 })
    }

    const updated = await db.learning_modules.update({
      where: { id },
      data: {
        content: normalized.content as Prisma.InputJsonValue,
        lessons_count: normalized.content.length,
        updated_at: new Date(),
      },
      select: {
        id: true,
        content: true,
        lessons_count: true,
      },
    })

    return NextResponse.json({ ok: true, module: updated })
  } catch (error) {
    console.error('PATCH /api/learning-modules/[id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
