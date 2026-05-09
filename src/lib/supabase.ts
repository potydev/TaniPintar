import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
