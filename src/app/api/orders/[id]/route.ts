import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function norm(s: string | null | undefined) {
  return (s ?? '').trim().toLowerCase()
}

const ALLOWED: [string, string][] = [
  ['menunggu', 'dibayar'],
  ['dibayar', 'dikirim'],
  ['dikirim', 'diterima'],
]

function canonicalStatus(status: string) {
  // Keep compatibility with old frontend value.
  if (status === 'diproses') return 'dibayar'
  return status
}

function isAllowedTransition(from: string, to: string) {
  return ALLOWED.some(([a, b]) => a === from && b === to)
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice('Bearer '.length).trim()
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: orderId } = await ctx.params
    if (!orderId?.trim()) {
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const raw = body as {
      status?: unknown
      shippingCourier?: unknown
      trackingNumber?: unknown
    }
    const nextStatusRaw =
      typeof raw.status === 'string' ? norm(raw.status) : ''
    const nextStatus = canonicalStatus(nextStatusRaw)
    const shippingCourier =
      typeof raw.shippingCourier === 'string'
        ? raw.shippingCourier.trim().slice(0, 120) || null
        : null
    const trackingNumber =
      typeof raw.trackingNumber === 'string'
        ? raw.trackingNumber.trim().slice(0, 120) || null
        : null

    if (!nextStatus) {
      return NextResponse.json({ error: 'Status wajib diisi' }, { status: 400 })
    }

    const order = await db.orders.findUnique({
      where: { id: orderId },
      select: { id: true, seller_id: true, status: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }
    if (order.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Hanya penjual pemilik pesanan yang dapat memperbarui' },
        { status: 403 },
      )
    }

    const current = norm(order.status)
    if (!isAllowedTransition(current, nextStatus)) {
      return NextResponse.json(
        {
          error: `Tidak dapat mengubah status dari "${current || '—'}" ke "${nextStatus}"`,
        },
        { status: 400 },
      )
    }

    const data: {
      status: string
      updated_at: Date
      shipping_courier?: string | null
      tracking_number?: string | null
    } = {
      status: nextStatus,
      updated_at: new Date(),
    }

    if (nextStatus === 'dikirim') {
      data.shipping_courier = shippingCourier
      data.tracking_number = trackingNumber
    }

    await db.orders.update({
      where: { id: orderId },
      data,
      select: { id: true, status: true },
    })

    return NextResponse.json({ ok: true, status: nextStatus })
  } catch (e) {
    console.error('PATCH /api/orders/[id]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
