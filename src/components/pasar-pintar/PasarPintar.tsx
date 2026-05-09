'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import {
  TrendingUp, TrendingDown, Minus, Search, MapPin, Calculator, Bell, Lightbulb,
  ArrowUpRight, ArrowDownRight, BarChart3, AlertTriangle, CheckCircle, Info,
  Wheat, Leaf, Droplets, Sun, RefreshCw
} from 'lucide-react'
import {
  mockCommodities, generatePriceHistory, mockRecommendations
} from '@/lib/constants'

type SubTab = 'dashboard' | 'heatmap' | 'tren' | 'calculator' | 'alerts' | 'rekomendasi'

type DashboardCommodity = {
  id: number
  name: string
  price: number
  change: number
  changePercent: number
  unit: string
  category: string
}

type PricePoint = {
  date: string
  price: number
  volume: number
}

type HeatmapPrice = {
  province: string
  price: number
  change: number
}

export function PasarPintar() {
  const userProfile = useAppStore((s) => s.userProfile)
  const notificationCount = useAppStore((s) => s.notifications)
  const setNotifications = useAppStore((s) => s.setNotifications)
  const [activeTab, setActiveTab] = useState<SubTab>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [dashboardCommodities, setDashboardCommodities] = useState<DashboardCommodity[]>([])
  const [selectedCommodity, setSelectedCommodity] = useState<DashboardCommodity | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>(() => generatePriceHistory(14500))
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [heatmapPrices, setHeatmapPrices] = useState<HeatmapPrice[]>([])
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false)
  const [farmerPrice, setFarmerPrice] = useState('')
  const [consumerPrice, setConsumerPrice] = useState('')
  const [alertCommodity, setAlertCommodity] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above')
  const [isCreatingAlert, setIsCreatingAlert] = useState(false)
  const [alertError, setAlertError] = useState('')
  const [alertSuccess, setAlertSuccess] = useState('')

  const filteredCommodities = useMemo(() => {
    if (!searchQuery) return dashboardCommodities
    return dashboardCommodities.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, dashboardCommodities])

  const fetchPriceHistory = async (commodityId: number, fallbackPrice: number) => {
    const { data: historyRows } = await supabase
      .from('commodity_prices')
      .select('price,date')
      .eq('commodity_id', commodityId)
      .order('date', { ascending: true })
      .limit(31)

    if (!historyRows || historyRows.length === 0) {
      setPriceHistory(generatePriceHistory(fallbackPrice))
      return
    }

    setPriceHistory(
      historyRows.map((row) => ({
        date: new Date(row.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        price: row.price,
        volume: Math.round(Math.random() * 1000 + 500),
      }))
    )
  }

  const handleSelectCommodity = (commodity: DashboardCommodity) => {
    setSelectedCommodity(commodity)
    fetchPriceHistory(commodity.id, commodity.price)
  }

  const refreshData = async () => {
    await loadDashboardData()
  }

  const loadDashboardData = async () => {
    setIsLoadingDashboard(true)

    const { data: commodityRows } = await supabase
      .from('commodities')
      .select('id,name,category,unit,base_price,is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })

    const ids = (commodityRows ?? []).map((row) => row.id)
    const latestPrices = new Map<number, { price: number; changePercent: number }>()

    if (ids.length) {
      const { data: priceRows } = await supabase
        .from('commodity_prices')
        .select('commodity_id,price,change_percent,date,created_at')
        .in('commodity_id', ids)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      ;(priceRows ?? []).forEach((row) => {
        if (!latestPrices.has(row.commodity_id)) {
          latestPrices.set(row.commodity_id, {
            price: row.price,
            changePercent: Number(row.change_percent ?? 0),
          })
        }
      })
    }

    const mapped = (commodityRows ?? []).map((row) => {
      const latest = latestPrices.get(row.id)
      const price = latest?.price ?? row.base_price
      const changePercent = latest?.changePercent ?? 0
      const change = Math.round((price * changePercent) / 100)
      return {
        id: row.id,
        name: row.name,
        price,
        change,
        changePercent,
        unit: row.unit || 'kg',
        category: row.category || 'Umum',
      }
    })

    setDashboardCommodities(mapped)

    if (mapped.length) {
      const current = selectedCommodity && mapped.find((c) => c.id === selectedCommodity.id)
      const next = current ?? mapped[0]
      setSelectedCommodity(next)
      await fetchPriceHistory(next.id, next.price)
    }

    setIsLoadingDashboard(false)
  }

  const loadHeatmapData = async () => {
    setIsLoadingHeatmap(true)

    const { data: commodityRow } = await supabase
      .from('commodities')
      .select('id')
      .eq('slug', 'beras-premium')
      .limit(1)
      .maybeSingle()

    const commodityId = commodityRow?.id
    if (!commodityId) {
      setHeatmapPrices([])
      setIsLoadingHeatmap(false)
      return
    }

    const { data: priceRows } = await supabase
      .from('commodity_prices')
      .select('province,price,change_percent,date,created_at')
      .eq('commodity_id', commodityId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    const latestByProvince = new Map<string, HeatmapPrice>()
    ;(priceRows ?? []).forEach((row) => {
      if (!latestByProvince.has(row.province)) {
        const change = Math.round((row.price * Number(row.change_percent ?? 0)) / 100)
        latestByProvince.set(row.province, {
          province: row.province,
          price: row.price,
          change,
        })
      }
    })

    setHeatmapPrices(Array.from(latestByProvince.values()))
    setIsLoadingHeatmap(false)
  }

  React.useEffect(() => {
    loadDashboardData()
    loadHeatmapData()
  }, [])

  const handleCreateAlert = async () => {
    setAlertError('')
    setAlertSuccess('')

    if (!userProfile) {
      setAlertError('Silakan login untuk membuat alert.')
      return
    }

    if (!alertCommodity || !alertPrice) {
      setAlertError('Komoditas dan target harga wajib diisi.')
      return
    }

    const targetPrice = Number(alertPrice)
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setAlertError('Target harga tidak valid.')
      return
    }

    const commodity = mockCommodities.find((item) => item.name === alertCommodity)
    if (!commodity) {
      setAlertError('Komoditas tidak ditemukan.')
      return
    }

    setIsCreatingAlert(true)

    const { error } = await supabase.from('price_alerts').insert({
      user_id: userProfile.id,
      commodity_id: commodity.id,
      target_price: targetPrice,
      condition: alertCondition,
    })

    if (error) {
      setAlertError(error.message)
    } else {
      setAlertSuccess('Alert berhasil dibuat.')
      setAlertCommodity('')
      setAlertPrice('')
      setAlertCondition('above')
      setNotifications(notificationCount + 1)
    }

    setIsCreatingAlert(false)
  }

  const marginGap = useMemo(() => {
    if (!farmerPrice || !consumerPrice) return null
    const fp = parseFloat(farmerPrice)
    const cp = parseFloat(consumerPrice)
    if (isNaN(fp) || isNaN(cp)) return null
    return {
      farmerPrice: fp,
      consumerPrice: cp,
      gap: cp - fp,
      gapPercent: ((cp - fp) / cp * 100).toFixed(1),
    }
  }, [farmerPrice, consumerPrice])

  const priceStats = useMemo(() => {
    const prices = priceHistory.map(p => p.price)
    if (!prices.length) return { avg: 0, max: 0, min: 0 }
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length
    const max = Math.max(...prices)
    const min = Math.min(...prices)
    return { avg: Math.round(avg), max, min }
  }, [priceHistory])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">PasarPintar</h1>
            <p className="text-sm text-muted-foreground">Dashboard Harga Komoditas Real-Time Indonesia</p>
          </div>
        </div>
        <Badge variant="outline" className="mt-2">SDG 2: Zero Hunger</Badge>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SubTab)} className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm"><BarChart3 className="h-3.5 w-3.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5 text-xs sm:text-sm"><MapPin className="h-3.5 w-3.5" />Heat Map</TabsTrigger>
          <TabsTrigger value="tren" className="gap-1.5 text-xs sm:text-sm"><TrendingUp className="h-3.5 w-3.5" />Tren</TabsTrigger>
          <TabsTrigger value="calculator" className="gap-1.5 text-xs sm:text-sm"><Calculator className="h-3.5 w-3.5" />Margin Gap</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5 text-xs sm:text-sm"><Bell className="h-3.5 w-3.5" />Smart Alerts</TabsTrigger>
          <TabsTrigger value="rekomendasi" className="gap-1.5 text-xs sm:text-sm"><Lightbulb className="h-3.5 w-3.5" />Rekomendasi</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari komoditas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={refreshData} className="gap-2" disabled={isLoadingDashboard}>
              <RefreshCw className="h-3.5 w-3.5" />
              {isLoadingDashboard ? 'Memuat...' : 'Refresh Data'}
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Naik', value: dashboardCommodities.filter(c => c.change > 0).length, icon: ArrowUpRight, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
              { label: 'Turun', value: dashboardCommodities.filter(c => c.change < 0).length, icon: ArrowDownRight, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
              { label: 'Stabil', value: dashboardCommodities.filter(c => c.change === 0).length, icon: Minus, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Total Komoditas', value: dashboardCommodities.length, icon: Wheat, color: 'text-primary bg-primary/10' },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Commodity List */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daftar Komoditas</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto p-0">
                <div className="divide-y divide-border/50">
                  {filteredCommodities.map((commodity) => (
                    <button
                      key={commodity.id}
                      onClick={() => handleSelectCommodity(commodity)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent ${
                        selectedCommodity?.id === commodity.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{commodity.name}</p>
                        <p className="text-xs text-muted-foreground">{commodity.category}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-semibold">Rp {commodity.price.toLocaleString('id-ID')}</p>
                        <p className={`text-xs ${commodity.change > 0 ? 'text-green-600' : commodity.change < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {commodity.change > 0 ? '+' : ''}{commodity.changePercent}%
                        </p>
                      </div>
                    </button>
                  ))}
                  {!filteredCommodities.length && !isLoadingDashboard && (
                    <div className="px-4 py-6 text-sm text-muted-foreground">
                      Data komoditas belum tersedia.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Tren Harga - {selectedCommodity?.name ?? 'Komoditas'}
                  </CardTitle>
                  {selectedCommodity && (
                    <Badge variant={selectedCommodity.change > 0 ? 'default' : selectedCommodity.change < 0 ? 'destructive' : 'secondary'}>
                      {selectedCommodity.change > 0 ? 'Naik' : selectedCommodity.change < 0 ? 'Turun' : 'Stabil'}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* SVG Chart */}
                <div className="h-64 sm:h-72">
                  <svg viewBox="0 0 700 280" className="h-full w-full">
                    <defs>
                      <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'rgb(22,163,74)', stopOpacity: 0.15 }} />
                        <stop offset="100%" style={{ stopColor: 'rgb(22,163,74)', stopOpacity: 0.01 }} />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    {Array.from({ length: 5 }).map((_, i) => {
                      const y = 30 + i * 50
                      return (
                        <g key={i}>
                          <line x1="50" y1={y} x2="680" y2={y} stroke="currentColor" strokeWidth="0.5" className="text-border" />
                          <text x="45" y={y + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
                            {Math.round(priceStats.max - (i * (priceStats.max - priceStats.min) / 4)).toLocaleString('id-ID')}
                          </text>
                        </g>
                      )
                    })}
                    {/* Area */}
                    {(() => {
                      const points = priceHistory.map((p, i) => {
                        const x = 50 + (i / (priceHistory.length - 1)) * 630
                        const y = 30 + ((priceStats.max - p.price) / (priceStats.max - priceStats.min || 1)) * 200
                        return `${x},${y}`
                      })
                      return <polygon points={`50,230 ${points.join(' ')} 680,230`} fill="url(#priceGradient)" />
                    })()}
                    {/* Line */}
                    <polyline
                      fill="none"
                      stroke="rgb(22,163,74)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={priceHistory.map((p, i) => {
                        const x = 50 + (i / (priceHistory.length - 1)) * 630
                        const y = 30 + ((priceStats.max - p.price) / (priceStats.max - priceStats.min || 1)) * 200
                        return `${x},${y}`
                      }).join(' ')}
                    />
                    {/* Current Price Dot */}
                    {priceHistory.length > 0 && (
                      <circle
                        cx={680}
                        cy={30 + ((priceStats.max - priceHistory[priceHistory.length - 1].price) / (priceStats.max - priceStats.min || 1)) * 200}
                        r="4"
                        fill="rgb(22,163,74)"
                        className="animate-pulse-green"
                      />
                    )}
                    {/* X-axis labels */}
                    {[0, 7, 14, 21, 30].map((i) => (
                      <text
                        key={i}
                        x={50 + (i / 30) * 630}
                        y={265}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px]"
                      >
                        {priceHistory[i]?.date || ''}
                      </text>
                    ))}
                  </svg>
                </div>
                {/* Price Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Rata-rata</p>
                    <p className="text-sm font-semibold">Rp {priceStats.avg.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Tertinggi</p>
                    <p className="text-sm font-semibold text-green-600">Rp {priceStats.max.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Terendah</p>
                    <p className="text-sm font-semibold text-red-500">Rp {priceStats.min.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Heat Map Tab */}
        <TabsContent value="heatmap">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Heat Map Harga Beras per Provinsi
              </CardTitle>
              <p className="text-sm text-muted-foreground">Harga eceran per kilogram di setiap provinsi Indonesia</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {heatmapPrices.map((prov) => {
                  const maxPrice = Math.max(...heatmapPrices.map(p => p.price))
                  const minPrice = Math.min(...heatmapPrices.map(p => p.price))
                  const intensity = (prov.price - minPrice) / (maxPrice - minPrice || 1)
                  return (
                    <motion.div
                      key={prov.province}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between rounded-lg border p-3 transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: `rgba(22, 163, 74, ${0.05 + intensity * 0.2})`,
                        borderColor: `rgba(22, 163, 74, ${0.1 + intensity * 0.3})`,
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">{prov.province}</p>
                        <p className={`text-xs ${prov.change > 0 ? 'text-green-600' : prov.change < 0 ? 'text-red-500' : ''}`}>
                          {prov.change > 0 ? '+' : ''}{prov.change.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">Rp {prov.price.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-muted-foreground">per kg</p>
                      </div>
                    </motion.div>
                  )
                })}
                {!heatmapPrices.length && !isLoadingHeatmap && (
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                    Data heat map belum tersedia.
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Murah</span>
                <div className="flex h-3 flex-1 rounded-full" style={{
                  background: 'linear-gradient(to right, rgba(22,163,74,0.05), rgba(22,163,74,0.25))'
                }} />
                <span>Mahal</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tren Tab */}
        <TabsContent value="tren">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tren & Prediksi Harga
              </CardTitle>
              <p className="text-sm text-muted-foreground">Analisis tren harga 30 hari terakhir dengan prediksi 7 hari ke depan</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockCommodities.slice(0, 4).map((commodity, idx) => {
                const history: PricePoint[] = generatePriceHistory(commodity.price)
                const predicted: { date: string; price: number }[] = Array.from({ length: 7 }).map((_, i) => ({
                  date: `+${i + 1}`,
                  price: Math.round(commodity.price + (Math.random() - 0.45) * commodity.price * 0.05),
                }))
                return (
                  <div key={commodity.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {idx === 0 ? <Wheat className="h-4 w-4 text-amber-500" /> :
                         idx === 1 ? <Leaf className="h-4 w-4 text-green-500" /> :
                         idx === 2 ? <Droplets className="h-4 w-4 text-blue-500" /> :
                         <Sun className="h-4 w-4 text-orange-500" />}
                        <span className="font-medium text-sm">{commodity.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Rp {commodity.price.toLocaleString('id-ID')}/{commodity.unit}</span>
                        <span className={`text-xs ${commodity.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {commodity.change > 0 ? '+' : ''}{commodity.changePercent}%
                        </span>
                      </div>
                    </div>
                    <div className="h-20">
                      <svg viewBox="0 0 400 80" className="h-full w-full">
                        <polyline
                          fill="none"
                          stroke="rgb(22,163,74)"
                          strokeWidth="1.5"
                          points={history.map((p, i) => `${(i / history.length) * 350 + 25},${10 + (1 - (p.price - Math.min(...history.map(h => h.price))) / (Math.max(...history.map(h => h.price)) - Math.min(...history.map(h => h.price)) || 1)) * 55}`).join(' ')}
                        />
                        <polyline
                          fill="none"
                          stroke="rgb(245,158,11)"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                          points={predicted.map((p, i) => `${350 + (i / 6) * 25},${10 + (1 - (p.price - Math.min(...history.map(h => h.price))) / (Math.max(...history.map(h => h.price)) - Math.min(...history.map(h => h.price)) || 1)) * 55}`).join(' ')}
                        />
                        <line x1="375" y1="5" x2="375" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-border" strokeDasharray="2 2" />
                      </svg>
                    </div>
                    <div className="flex gap-4 text-[10px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><div className="h-0.5 w-3 bg-green-600 rounded" />Aktual 30 hari</span>
                      <span className="flex items-center gap-1"><div className="h-0.5 w-3 bg-amber-500 rounded" style={{ borderTop: '1px dashed' }} />Prediksi 7 hari</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margin Gap Calculator Tab */}
        <TabsContent value="calculator">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4 text-primary" />
                Margin Gap Calculator
              </CardTitle>
              <p className="text-sm text-muted-foreground">Hitung selisih harga petani vs konsumen. Ketahui berapa banyak margin perantara.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Harga Jual Petani (per kg)</label>
                    <Input
                      type="number"
                      placeholder="Contoh: 8000"
                      value={farmerPrice}
                      onChange={(e) => setFarmerPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Harga Beli Konsumen (per kg)</label>
                    <Input
                      type="number"
                      placeholder="Contoh: 14500"
                      value={consumerPrice}
                      onChange={(e) => setConsumerPrice(e.target.value)}
                    />
                  </div>
                </div>

                {marginGap && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-4">Hasil Analisis</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Harga Petani</span>
                          <span className="font-bold text-primary">Rp {marginGap.farmerPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Harga Konsumen</span>
                          <span className="font-bold">Rp {marginGap.consumerPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="border-t border-border pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Margin Perantara</span>
                            <span className="text-lg font-bold text-destructive">
                              Rp {marginGap.gap.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-right text-xs text-destructive mt-0.5">
                            Margin {marginGap.gapPercent}% dari harga konsumen
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/50 dark:bg-black/20 p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                              Jika Anda menjual langsung ke konsumen melalui TaniPintar, 
                              potensi penghematan pembeli adalah <strong>Rp {marginGap.gap.toLocaleString('id-ID')}/kg</strong> 
                              dan pendapatan Anda bisa naik <strong>{marginGap.gapPercent}%</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Alerts Tab */}
        <TabsContent value="alerts">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-primary" />
                Smart Alerts
              </CardTitle>
              <p className="text-sm text-muted-foreground">Atur notifikasi harga untuk komoditas pilihan Anda</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alert Form */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-4">
                <h3 className="text-sm font-medium">Buat Alert Baru</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Komoditas</label>
                    <select
                      value={alertCommodity}
                      onChange={(e) => setAlertCommodity(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Pilih komoditas</option>
                      {mockCommodities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Target Harga (Rp/kg)</label>
                    <Input
                      type="number"
                      placeholder="Contoh: 50000"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Kondisi</label>
                    <select
                      value={alertCondition}
                      onChange={(e) => setAlertCondition(e.target.value as 'above' | 'below')}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="above">Harga naik di atas</option>
                      <option value="below">Harga turun di bawah</option>
                    </select>
                  </div>
                </div>
                {alertError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {alertError}
                  </div>
                )}
                {alertSuccess && (
                  <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                    {alertSuccess}
                  </div>
                )}
                <Button size="sm" className="gap-2" onClick={handleCreateAlert} disabled={isCreatingAlert}>
                  <Bell className="h-3.5 w-3.5" />
                  {isCreatingAlert ? 'Menyimpan...' : 'Buat Alert'}
                </Button>
              </div>

              {/* Active Alerts */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Alert Aktif</h3>
                {[
                  { commodity: 'Cabai Merah', target: 50000, condition: 'above', current: 52000, triggered: true },
                  { commodity: 'Bawang Merah', target: 30000, condition: 'below', current: 38000, triggered: false },
                  { commodity: 'Beras Premium', target: 15000, condition: 'above', current: 14500, triggered: false },
                ].map((alert, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      {alert.triggered ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Bell className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{alert.commodity}</p>
                        <p className="text-xs text-muted-foreground">
                          Harga {alert.condition === 'above' ? 'naik di atas' : 'turun di bawah'} Rp {alert.target.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Rp {alert.current.toLocaleString('id-ID')}</p>
                      {alert.triggered ? (
                        <Badge className="bg-green-100 text-green-700 text-[10px] dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="mr-0.5 h-2.5 w-2.5" /> Terpicu
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Menunggu</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rekomendasi Tab */}
        <TabsContent value="rekomendasi">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                RekomendasiTanam
              </CardTitle>
              <p className="text-sm text-muted-foreground">Tanam apa yang paling menguntungkan? Berdasarkan analisis data harga & tren pasar.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecommendations.map((rec) => (
                  <motion.div
                    key={rec.crop}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                      #{rec.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{rec.crop}</h4>
                        <Badge variant="outline" className="text-[10px]">{rec.season}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{rec.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Margin Profit: <span className="font-semibold text-primary">{rec.profitMargin}%</span>
                        {' '}&middot;{' '}
                        Estimasi: <span className="font-medium">{rec.expectedReturn}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`flex items-center gap-1 text-sm font-medium ${rec.trend === 'up' ? 'text-green-600' : 'text-amber-500'}`}>
                        {rec.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        {rec.trend === 'up' ? 'Tren Naik' : 'Stabil'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 p-3 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-amber-700 dark:text-amber-400">Disclaimer:</strong> Rekomendasi berdasarkan analisis data historis harga komoditas. 
                  Hasil aktual dapat berbeda tergantung kondisi lokal, cuaca, dan faktor lainnya. Selalu lakukan riset lokal sebelum menanam.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
