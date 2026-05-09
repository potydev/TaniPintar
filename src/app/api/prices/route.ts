import { NextRequest, NextResponse } from 'next/server'

// Badan Pangan API - Free, no API key needed
const BADAN_PANGAN_BASE = 'https://panelharga.badanpangan.go.id/data/harga-provinsi'

// Commodity IDs (common ones)
const COMMODITY_IDS: Record<string, number> = {
  beras: 27,
  jagung: 29,
  kedelai: 30,
  cabai_merah: 31,
  bawang_merah: 32,
  bawang_putih: 33,
  tomat: 34,
  cabai_rawit: 35,
  kentang: 36,
  gula: 37,
}

// Get today's date in DD-MM-YYYY format
function getTodayDate(): string {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const commodity = searchParams.get('commodity') || 'beras'
    const date = searchParams.get('date') || getTodayDate()
    const level = searchParams.get('level') || '3' // 3 = consumer/retail price

    const commodityId = COMMODITY_IDS[commodity]
    if (!commodityId) {
      return NextResponse.json(
        { error: `Unknown commodity: ${commodity}` },
        { status: 400 }
      )
    }

    // Fetch from Badan Pangan API
    const apiUrl = `${BADAN_PANGAN_BASE}/${date}/${level}/${commodityId}`
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      // Return mock data if API fails
      return NextResponse.json({
        source: 'mock',
        commodity,
        date,
        level,
        message: 'API Badan Pangan tidak tersedia, menggunakan data simulasi',
        data: generateMockData(commodity),
      })
    }

    const data = await response.json()

    return NextResponse.json({
      source: 'badan-pangan',
      commodity,
      date,
      level,
      data: data,
    })
  } catch (error: any) {
    console.error('Prices API error:', error.message)
    
    // Return mock data on error
    const commodity = new URL(request.url).searchParams.get('commodity') || 'beras'
    return NextResponse.json({
      source: 'mock',
      commodity,
      date: getTodayDate(),
      message: 'Menggunakan data simulasi',
      data: generateMockData(commodity),
    })
  }
}

function generateMockData(commodity: string) {
  const basePrices: Record<string, number> = {
    beras: 14500,
    jagung: 6200,
    kedelai: 11500,
    cabai_merah: 52000,
    bawang_merah: 38000,
    bawang_putih: 32000,
    tomat: 12000,
    cabai_rawit: 48000,
    kentang: 15000,
    gula: 16500,
  }

  const basePrice = basePrices[commodity] || 10000
  const provinces = [
    'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi',
    'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Banten', 'DKI Jakarta',
    'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
    'Bali', 'NTB', 'NTT', 'Kalimantan Barat', 'Kalimantan Tengah',
    'Kalimantan Selatan', 'Kalimantan Timur', 'Sulawesi Utara',
    'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
    'Maluku', 'Papua'
  ]

  return provinces.map(province => ({
    province,
    geomean: Math.round(basePrice + (Math.random() - 0.5) * basePrice * 0.15),
  }))
}
