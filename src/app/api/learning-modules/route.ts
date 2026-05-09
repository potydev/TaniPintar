import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

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

    const profile = await db.profiles.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
    const role = (profile?.role ?? '').toLowerCase()
    if (!profile || role !== 'admin') {
      return NextResponse.json(
        { error: 'Hanya admin yang dapat membuat modul' },
        { status: 403 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const raw = body as {
      title?: unknown
      description?: unknown
      category?: unknown
      difficulty?: unknown
      durationHours?: unknown
      lessonsCount?: unknown
      imageUrl?: unknown
      isPublished?: unknown
    }

    const title = typeof raw.title === 'string' ? raw.title.trim() : ''
    const description =
      typeof raw.description === 'string' ? raw.description.trim() || null : null
    const category =
      typeof raw.category === 'string' ? raw.category.trim() || null : null
    const difficulty =
      typeof raw.difficulty === 'string' ? raw.difficulty.trim() || 'pemula' : 'pemula'
    const durationHours =
      typeof raw.durationHours === 'number' && Number.isFinite(raw.durationHours)
        ? Math.max(1, Math.floor(raw.durationHours))
        : 1
    const lessonsCount =
      typeof raw.lessonsCount === 'number' && Number.isFinite(raw.lessonsCount)
        ? Math.max(0, Math.floor(raw.lessonsCount))
        : 0
    const imageUrl =
      typeof raw.imageUrl === 'string' ? raw.imageUrl.trim() || null : null
    const isPublished = Boolean(raw.isPublished)

    if (!title) {
      return NextResponse.json({ error: 'Judul modul wajib diisi' }, { status: 400 })
    }

    const baseSlug = toSlug(title) || 'modul'
    let slug = baseSlug
    let suffix = 1
    // Ensure slug uniqueness
    while (await db.learning_modules.findUnique({ where: { slug }, select: { id: true } })) {
      suffix += 1
      slug = `${baseSlug}-${suffix}`
    }

    const moduleRow = await db.learning_modules.create({
      data: {
        title,
        slug,
        description,
        category,
        difficulty,
        duration_hours: durationHours,
        lessons_count: lessonsCount,
        image_url: imageUrl,
        is_published: isPublished,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        is_published: true,
      },
    })

    return NextResponse.json({ ok: true, module: moduleRow })
  } catch (error) {
    console.error('POST /api/learning-modules', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

