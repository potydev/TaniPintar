import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const ALLOWED_STATUS = new Set(['aktif', 'tidak_aktif', 'habis'])

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
      return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as { status?: unknown }
    const status =
      typeof body.status === 'string' ? body.status.trim().toLowerCase() : ''
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json({ error: 'Status produk tidak valid' }, { status: 400 })
    }

    const product = await db.products.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    await db.products.update({
      where: { id },
      data: { status, updated_at: new Date() },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, status })
  } catch (error) {
    console.error('PATCH /api/admin/products/[id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
