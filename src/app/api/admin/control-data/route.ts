import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [products, users, orders] = await Promise.all([
      db.products.findMany({
        orderBy: { created_at: 'desc' },
        take: 30,
        select: {
          id: true,
          name: true,
          status: true,
          stock: true,
          price: true,
          unit: true,
          category: true,
          city: true,
          profiles: {
            select: { id: true, full_name: true, email: true },
          },
        },
      }),
      db.profiles.findMany({
        orderBy: { created_at: 'desc' },
        take: 30,
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          city: true,
          province: true,
          created_at: true,
        },
      }),
      db.orders.findMany({
        orderBy: { created_at: 'desc' },
        take: 30,
        select: {
          id: true,
          status: true,
          grand_total: true,
          created_at: true,
          profiles_orders_buyer_idToprofiles: {
            select: { full_name: true, email: true },
          },
          profiles_orders_seller_idToprofiles: {
            select: { full_name: true, email: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status ?? 'aktif',
        stock: p.stock,
        price: p.price,
        unit: p.unit ?? 'kg',
        category: p.category,
        city: p.city ?? '-',
        sellerName: p.profiles?.full_name || p.profiles?.email || 'Penjual',
      })),
      users: users.map((u) => ({
        id: u.id,
        fullName: u.full_name || u.email,
        email: u.email,
        role: (u.role || 'user').toLowerCase(),
        city: u.city ?? '-',
        province: u.province ?? '-',
        createdAt: u.created_at,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status ?? '',
        grandTotal: o.grand_total,
        createdAt: o.created_at,
        buyerName:
          o.profiles_orders_buyer_idToprofiles?.full_name ||
          o.profiles_orders_buyer_idToprofiles?.email ||
          'Pembeli',
        sellerName:
          o.profiles_orders_seller_idToprofiles?.full_name ||
          o.profiles_orders_seller_idToprofiles?.email ||
          'Penjual',
      })),
    })
  } catch (error) {
    console.error('GET /api/admin/control-data', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
