import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkRateLimit } from '@/lib/rate-limit'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const SYSTEM_PROMPT = `Kamu adalah TaniBot, asisten AI pertanian cerdas untuk petani Indonesia.
Nama platform: TaniPintar.
Bahasa: Indonesia (Bahasa).

Tugasmu:
1. Menjawab pertanyaan seputar pertanian (budidaya, hama, penyakit, harga, cuaca)
2. Memberikan rekomendasi budidaya berdasarkan kondisi
3. Menganalisis tren harga komoditas
4. Memberikan tips praktis untuk petani

Gaya bahasa: Ramah, profesional, mudah dipahami petani.
Gunakan data konkret jika tersedia.
Jika tidak tahu jawabannya, sarankan untuk berkonsultasi dengan penyuluh pertanian lokal.
Selalu respons dalam Bahasa Indonesia.`

function normalizeModelName(name: string) {
  return name.replace(/^models\//, '').trim()
}

async function generateWithLowCostModel(genAI: GoogleGenerativeAI, message: string) {
  // Keep attempts minimal to avoid inflating failed requests/quota metrics.
  const candidates = [
    normalizeModelName(GEMINI_MODEL),
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash',
  ].filter(Boolean)

  let lastError: any = null
  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 700,
        },
        systemInstruction: SYSTEM_PROMPT,
      })
      const result = await model.generateContent(message)
      return result.response.text().trim()
    } catch (error: any) {
      lastError = error
      const messageText = String(error?.message || '')
      const notFound =
        error?.status === 404 ||
        messageText.includes('is not found') ||
        messageText.includes('not supported for generateContent')
      if (!notFound) break
    }
  }

  if (lastError) {
    const e: any = new Error('Gemini request failed')
    e.status = lastError?.status
    e.original = lastError
    throw e
  }

  return ''
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip =
      forwardedFor?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const limiter = checkRateLimit(`chat:${ip}`, 20, 60_000)
    if (!limiter.ok) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message:
            'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limiter.retryAfterSec),
          },
        },
      )
    }

    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY belum diatur',
          message:
            'Konfigurasi Gemini belum tersedia di server. Silakan hubungi admin.',
        },
        { status: 500 },
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    let generated = ''
    try {
      generated = await generateWithLowCostModel(genAI, message)
    } catch (err: any) {
      const status = err?.status
      if (status && status !== 429) {
        throw err?.original || err
      }
    }
    const responseMessage = generated || `Saat ini kuota layanan AI sedang penuh, jadi saya pakai mode hemat sementara.

Untuk pertanyaan "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}", saran awal:
1. Lakukan observasi kondisi lahan/tanaman (gejala, umur tanaman, cuaca 3-7 hari terakhir).
2. Terapkan langkah aman bertahap (sanitasi lahan, pengairan tepat, pemupukan berimbang, dan monitoring hama/penyakit).
3. Jika gejala memburuk atau menyebar cepat, segera konsultasi penyuluh pertanian setempat.

Coba kirim lagi dalam 1-2 menit, nanti saya coba akses Gemini lagi.`

    return NextResponse.json({
      message: responseMessage,
      timestamp: new Date().toISOString(),
      source: generated ? 'gemini' : 'fallback',
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process message',
        message: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi.',
      },
      { status: 500 },
    )
  }
}
