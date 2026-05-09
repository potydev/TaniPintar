import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const RATEABLE_STATUSES = new Set(['diterima', 'selesai'])

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
      orderId?: string
      rating?: unknown
      comment?: unknown
    }
    const orderId = raw.orderId
    const rating = raw.rating
    const comment =
      typeof raw.comment === 'string' ? raw.comment.trim() || null : null

    if (
      !orderId ||
      typeof orderId !== 'string' ||
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const order = await db.orders.findUnique({
      where: { id: orderId },
      select: {
        buyer_id: true,
        seller_id: true,
        status: true,
        rated: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.buyer_id !== buyerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!order.status || !RATEABLE_STATUSES.has(order.status)) {
      return NextResponse.json(
        { error: 'Order not ready for rating' },
        { status: 400 },
      )
    }
    if (order.rated === true) {
      return NextResponse.json({ error: 'Already rated' }, { status: 400 })
    }

    const items = await db.order_items.findMany({
      where: { order_id: orderId },
      select: { product_id: true },
    })
    const productIds = [
      ...new Set(
        items
          .map((i) => i.product_id)
          .filter((id): id is string => id != null && id.length > 0),
      ),
    ]
    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'No products to rate in this order' },
        { status: 400 },
      )
    }

    await db.$transaction(async (tx) => {
      await tx.reviews.createMany({
        data: productIds.map((productId) => ({
          product_id: productId,
          buyer_id: buyerId,
          order_id: orderId,
          rating,
          comment,
          image_url: [],
        })),
      })

      await tx.orders.update({
        where: { id: orderId },
        data: { rated: true },
      })

      const agg = await tx.reviews.aggregate({
        _avg: { rating: true },
        _count: { _all: true },
        where: {
          products: { seller_id: order.seller_id },
        },
      })

      const avg = agg._avg.rating
      const ratingAvg =
        avg != null
          ? new Prisma.Decimal(Number(avg).toFixed(2))
          : new Prisma.Decimal('0.00')

      await tx.profiles.update({
        where: { id: order.seller_id },
        data: {
          rating_avg: ratingAvg,
          total_reviews: agg._count._all,
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/reviews', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
