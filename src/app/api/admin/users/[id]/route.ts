import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const ALLOWED_ROLES = new Set(['user', 'seller', 'admin'])

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const profile = await db.profiles.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if ((profile?.role ?? '').toLowerCase() !== 'admin') return null

  return user
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await ctx.params
    if (!id?.trim()) {
      return NextResponse.json({ error: 'User tidak valid' }, { status: 400 })
    }
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Role akun admin aktif tidak bisa diubah dari sini' },
        { status: 400 },
      )
    }

    const body = (await request.json().catch(() => ({}))) as { role?: unknown }
    const role = typeof body.role === 'string' ? body.role.trim().toLowerCase() : ''
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    const target = await db.profiles.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    await db.profiles.update({
      where: { id },
      data: { role, updated_at: new Date() },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, role })
  } catch (error) {
    console.error('PATCH /api/admin/users/[id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
