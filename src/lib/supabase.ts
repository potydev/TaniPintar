import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// During Docker/CI builds, NEXT_PUBLIC env vars may not be injected.
// Avoid crashing the build by falling back to a dummy client.
// At runtime (Dokploy), you MUST provide the real env vars.
const safeUrl =
  typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http')
    ? supabaseUrl
    : 'http://localhost:54321'
const safeAnonKey =
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0
    ? supabaseAnonKey
    : 'public-anon-key'

export const supabase = createClient(safeUrl, safeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  province: string | null
  city: string | null
  role: 'user' | 'seller' | 'admin'
  avatar_url: string | null
  created_at: string
}
