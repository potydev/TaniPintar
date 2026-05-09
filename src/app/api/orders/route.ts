import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
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
    const buyerId = user.id

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const raw = body as {
      productId?: string
      quantity?: unknown
      buyerAddress?: unknown
      buyerPhone?: unknown
      notes?: unknown
      paymentMethod?: unknown
    }

    const productId = raw.productId
    const quantity = raw.quantity
    const buyerAddress =
      typeof raw.buyerAddress === 'string' ? raw.buyerAddress.trim() : ''
    const buyerPhone = typeof raw.buyerPhone === 'string' ? raw.buyerPhone.trim() : ''
    const notes = typeof raw.notes === 'string' ? raw.notes.trim() || null : null
    const paymentMethod =
      typeof raw.paymentMethod === 'string' ? raw.paymentMethod.trim() || null : null

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 1_000_000
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    if (!buyerAddress || buyerAddress.length < 8) {
      return NextResponse.json(
        { error: 'Alamat pembeli wajib diisi' },
        { status: 400 },
      )
    }
    if (!buyerPhone || buyerPhone.length < 8) {
      return NextResponse.json(
        { error: 'Nomor HP pembeli wajib diisi' },
        { status: 400 },
      )
    }

    const result = await db.$transaction(async (tx) => {
      const product = await tx.products.findUnique({
        where: { id: productId },
        select: {
          id: true,
          seller_id: true,
          name: true,
          price: true,
          unit: true,
          stock: true,
          status: true,
        },
      })

      if (!product) {
        return { error: 'Produk tidak ditemukan', status: 404 as const }
      }
      if ((product.status ?? 'aktif') !== 'aktif') {
        return { error: 'Produk tidak tersedia', status: 400 as const }
      }
      if (product.seller_id === buyerId) {
        return { error: 'Tidak bisa membeli produk sendiri', status: 400 as const }
      }
      if ((product.stock ?? 0) < quantity) {
        return { error: 'Stok tidak mencukupi', status: 400 as const }
      }

      const totalAmount = product.price * quantity
      const shippingCost = 0

      const order = await tx.orders.create({
        data: {
          buyer_id: buyerId,
          seller_id: product.seller_id,
          status: 'menunggu',
          total_amount: totalAmount,
          shipping_cost: shippingCost,
          buyer_address: buyerAddress,
          buyer_phone: buyerPhone,
          notes,
          payment_method: paymentMethod,
          rated: false,
        },
        select: { id: true },
      })

      await tx.order_items.create({
        data: {
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          quantity,
          unit: product.unit ?? 'kg',
        },
      })

      await tx.products.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } },
      })

      return { orderId: order.id }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ ok: true, orderId: result.orderId })
  } catch (e) {
    console.error('POST /api/orders', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

