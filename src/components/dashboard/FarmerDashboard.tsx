'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import {
  LayoutDashboard,
  User,
  Bell,
  BookOpen,
  Package,
  DollarSign,
  MapPin,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Star,
  Edit,
  Eye,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  BarChart3,
  ShieldCheck,
  ShoppingBag,
  ClipboardList,
  Users,
  Heart,
  Truck,
} from 'lucide-react'

// ── Inline mock data ──────────────────────────────────────────────

type DashboardNotification = {
  id: string
  type: string
  title: string
  message: string
  time: string
  createdAt: string
  read: boolean
}

type DashboardProduct = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  city: string | null
  province?: string | null
  description?: string | null
  image_url?: string[] | null
}

type DashboardModule = {
  id: string
  title: string
  category: string
  level: string
  duration: number
  lessonsCount: number
  progress: number
}

type DashboardOrderItem = {
  productName: string
  quantity: number
  price: number
  unit: string
}

type DashboardOrder = {
  id: string
  status: string
  grandTotal: number
  createdAt: string
  rated: boolean
  buyerName?: string
  buyerPhone?: string
  buyerAddress?: string
  notes?: string | null
  paymentMethod?: string | null
  shippingCourier?: string | null
  trackingNumber?: string | null
  items?: DashboardOrderItem[]
}

type SavedProduct = {
  id: string
  name: string
  price: number
  unit: string
  city: string
  province: string
}

type MonthlyEarning = {
  month: string
  amount: number
}

type AdminManagedProduct = {
  id: string
  name: string
  status: string
  stock: number
  price: number
  unit: string
  category: string
  city: string
  sellerName: string
}

type AdminManagedUser = {
  id: string
  fullName: string
  email: string
  role: string
  city: string
  province: string
  createdAt: string
}

type AdminManagedOrder = {
  id: string
  status: string
  grandTotal: number
  createdAt: string
  buyerName: string
  sellerName: string
}

const PRODUCT_IMAGE_BUCKET = 'product-images'

// ── Helpers ───────────────────────────────────────────────────────

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const formatCompactRupiah = (value: number) => {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
  return formatRupiah(value)
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function canRateBuyerOrder(order: DashboardOrder) {
  const s = order.status || ''
  return (s === 'diterima' || s === 'selesai') && !order.rated
}

function orderStatusLabel(status: string) {
  const s = (status || '').toLowerCase()
  const labels: Record<string, string> = {
    menunggu: 'Menunggu konfirmasi penjual',
    dibayar: 'Sedang diproses',
    diproses: 'Sedang diproses',
    dikirim: 'Dalam pengiriman',
    diterima: 'Diterima',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
  }
  return labels[s] || status || '—'
}

function sellerOrderSortKey(status: string) {
  const s = (status || '').toLowerCase()
  if (s === 'menunggu') return 0
  if (s === 'dibayar') return 1
  if (s === 'dikirim') return 2
  return 3
}

function roleLabel(role: string) {
  const r = (role || '').toLowerCase()
  if (r === 'admin') return 'Admin'
  if (r === 'seller') return 'Penjual'
  return 'Pembeli'
}

// Learning progress overrides — the module data has progress: 0 by default,
// so we apply realistic progress for the dashboard view.
const moduleProgressMap: Record<string, number> = {
  '1': 75,
  '2': 100,
  '3': 40,
}

// ── Animation variants ────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ── Notification icon helper ──────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'price':
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20">
          <TrendingUp className="h-4 w-4" />
        </div>
      )
    case 'alert':
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4" />
        </div>
      )
    case 'system':
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
          <Info className="h-4 w-4" />
        </div>
      )
    default:
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Bell className="h-4 w-4" />
        </div>
      )
  }
}

const formatJoinDate = (value: string | null | undefined) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatNotificationTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatAlertMessage = (
  name: string,
  condition: string,
  targetPrice: number,
  currentPrice?: number,
  triggered?: boolean,
) => {
  const direction = condition === 'above' ? 'di atas' : 'di bawah'
  const currentInfo =
    typeof currentPrice === 'number'
      ? ` Harga terkini Rp ${currentPrice.toLocaleString('id-ID')}.`
      : ''
  const status =
    typeof triggered === 'boolean'
      ? triggered
        ? ' Status: terpicu.'
        : ' Status: belum terpicu.'
      : ''
  return `Harga ${name} ${direction} Rp ${targetPrice.toLocaleString('id-ID')} sesuai Smart Alerts.${currentInfo}${status}`
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const buildMonthlyEarnings = (rows: { grand_total?: number; created_at: string }[]) => {
  const now = new Date()
  const months: MonthlyEarning[] = []
  const totals = new Map<string, number>()

  rows.forEach((row) => {
    const date = new Date(row.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    totals.set(key, (totals.get(key) ?? 0) + (row.grand_total ?? 0))
  })

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    months.push({
      month: d.toLocaleDateString('id-ID', { month: 'short' }),
      amount: totals.get(key) ?? 0,
    })
  }

  return months
}

// ── SVG Income Chart ──────────────────────────────────────────────

function IncomeChart({ data }: { data: MonthlyEarning[] }) {
  const amounts = data.map((e) => e.amount)
  const maxAmount = Math.max(...amounts)
  const minAmount = Math.min(...amounts)
  const range = maxAmount - minAmount || 1

  // Chart area coordinates
  const chartLeft = 65
  const chartRight = 680
  const chartTop = 30
  const chartBottom = 230
  const chartWidth = chartRight - chartLeft
  const chartHeight = chartBottom - chartTop

  const toX = (i: number) => chartLeft + (i / (data.length - 1)) * chartWidth
  const toY = (amount: number) => chartTop + ((maxAmount - amount) / range) * chartHeight

  const linePoints = data
    .map((e, i) => `${toX(i)},${toY(e.amount)}`)
    .join(' ')

  const areaPoints = ` ${chartLeft},${chartBottom} ${linePoints} ${chartRight},${chartBottom}`

  return (
    <svg viewBox="0 0 720 270" className="h-full w-full">
      <defs>
        <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'rgb(22,163,74)', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: 'rgb(22,163,74)', stopOpacity: 0.01 }} />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines + Y labels */}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = chartTop + (i / 4) * chartHeight
        const value = maxAmount - (i / 4) * range
        return (
          <g key={i}>
            <line
              x1={chartLeft}
              y1={y}
              x2={chartRight}
              y2={y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border"
            />
            <text
              x={chartLeft - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {formatCompactRupiah(Math.round(value))}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#incomeGradient)" />

      {/* Line */}
      <polyline
        fill="none"
        stroke="rgb(22,163,74)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
      />

      {/* Data points + labels */}
      {data.map((e, i) => {
        const cx = toX(i)
        const cy = toY(e.amount)
        return (
          <g key={e.month}>
            {/* X-axis label */}
            <text
              x={cx}
              y={chartBottom + 20}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {e.month}
            </text>
            {/* Dot */}
            <circle cx={cx} cy={cy} r="4.5" fill="white" stroke="rgb(22,163,74)" strokeWidth="2" />
            {/* Value tooltip */}
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              className="fill-foreground text-[9px] font-semibold"
            >
              {formatCompactRupiah(e.amount)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────

export function FarmerDashboard() {
  const { toast } = useToast()
  const userProfile = useAppStore((s) => s.userProfile)
  const userRole = useAppStore((s) => s.userRole)
  const setAuth = useAppStore((s) => s.setAuth)
  const [notifications, setNotifications] = React.useState<DashboardNotification[]>([])
  const [activeProducts, setActiveProducts] = React.useState<DashboardProduct[]>([])
  const [learningModules, setLearningModules] = React.useState<DashboardModule[]>([])
  const [orders, setOrders] = React.useState<DashboardOrder[]>([])
  const [savedProducts, setSavedProducts] = React.useState<SavedProduct[]>([])
  const [monthlyEarnings, setMonthlyEarnings] = React.useState<MonthlyEarning[]>([])
  const [totalOrderValue, setTotalOrderValue] = React.useState(0)
  const [adminStats, setAdminStats] = React.useState({ users: 0, products: 0, orders: 0, revenue: 0 })
  const [showAddProduct, setShowAddProduct] = React.useState(false)
  const [showEditProfile, setShowEditProfile] = React.useState(false)
  const [showEditProduct, setShowEditProduct] = React.useState(false)
  const [editingProduct, setEditingProduct] = React.useState<DashboardProduct | null>(null)
  const [profileForm, setProfileForm] = React.useState({
    full_name: '',
    phone: '',
    province: '',
    city: '',
  })
  const [profileError, setProfileError] = React.useState('')
  const [profileSuccess, setProfileSuccess] = React.useState('')
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [productForm, setProductForm] = React.useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    unit: 'kg',
    province: '',
    city: '',
    description: '',
  })
  const [productImageFile, setProductImageFile] = React.useState<File | null>(null)
  const [productImageName, setProductImageName] = React.useState('')
  const [editProductImageFile, setEditProductImageFile] = React.useState<File | null>(null)
  const [editProductImageName, setEditProductImageName] = React.useState('')
  const [isSavingProduct, setIsSavingProduct] = React.useState(false)
  const [productError, setProductError] = React.useState('')
  const [productSuccess, setProductSuccess] = React.useState('')
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>([])
  const [sellerReviewStats, setSellerReviewStats] = React.useState({
    ratingAvg: 0,
    totalReviews: 0,
  })
  const [ratingDialogOrder, setRatingDialogOrder] =
    React.useState<DashboardOrder | null>(null)
  const [ratingValue, setRatingValue] = React.useState(5)
  const [ratingComment, setRatingComment] = React.useState('')
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false)
  const [sellerShipOrder, setSellerShipOrder] = React.useState<DashboardOrder | null>(null)
  const [shipCourier, setShipCourier] = React.useState('')
  const [shipTracking, setShipTracking] = React.useState('')
  const [sellerUpdatingOrderId, setSellerUpdatingOrderId] = React.useState<string | null>(null)
  const [showAdminProducts, setShowAdminProducts] = React.useState(false)
  const [showAdminOrders, setShowAdminOrders] = React.useState(false)
  const [showAdminUsers, setShowAdminUsers] = React.useState(false)
  const [adminProducts, setAdminProducts] = React.useState<AdminManagedProduct[]>([])
  const [adminUsers, setAdminUsers] = React.useState<AdminManagedUser[]>([])
  const [adminOrders, setAdminOrders] = React.useState<AdminManagedOrder[]>([])
  const [isLoadingAdminControl, setIsLoadingAdminControl] = React.useState(false)
  const [adminControlLoaded, setAdminControlLoaded] = React.useState(false)
  const [adminActionKey, setAdminActionKey] = React.useState<string | null>(null)

  const loadDashboardData = React.useCallback(async () => {
    if (!userProfile) return

      const resolvedRole = (userRole ?? userProfile.role ?? 'user').toLowerCase()
      const role = resolvedRole === 'admin' || resolvedRole === 'seller' ? resolvedRole : 'user'
      const [
        { data: notifRows },
        { data: alertRows },
        { data: productRows },
        { data: moduleRows },
        { data: orderRows },
        { data: savedRows },
        { data: categoryRows },
        { count: userCount },
        { count: productCount },
      ] = await Promise.all([
        supabase
          .from('notifications')
          .select('id,type,title,message,is_read,created_at')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('price_alerts')
          .select('id,commodity_id,condition,target_price,is_active,triggered,created_at,commodities(name)')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('products')
          .select('id,name,category,price,stock,unit,city,province,description,image_url')
          .eq('seller_id', userProfile.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('learning_modules')
          .select('id,title,category,difficulty,duration_hours,lessons_count')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3),
        role === 'seller'
          ? supabase
              .from('orders')
              .select(
                `id,status,grand_total,created_at,rated,buyer_id,buyer_address,buyer_phone,notes,payment_method,shipping_courier,tracking_number,
                order_items ( product_name, quantity, price, unit )`,
              )
              .eq('seller_id', userProfile.id)
              .order('created_at', { ascending: false })
              .limit(25)
          : role === 'admin'
            ? supabase
                .from('orders')
                .select(
                  'id,status,grand_total,created_at,rated,shipping_courier,tracking_number',
                )
                .order('created_at', { ascending: false })
                .limit(6)
            : supabase
                .from('orders')
                .select(
                  'id,status,grand_total,created_at,rated,shipping_courier,tracking_number',
                )
                .eq('buyer_id', userProfile.id)
                .order('created_at', { ascending: false })
                .limit(6),
        role === 'user'
          ? supabase
              .from('saved_products')
              .select('id,products(id,name,price,unit,city,province)')
              .eq('user_id', userProfile.id)
              .order('created_at', { ascending: false })
              .limit(6)
          : supabase
              .from('saved_products')
              .select('id')
              .eq('user_id', userProfile.id)
              .limit(1),
        supabase
          .from('commodities')
          .select('category')
          .eq('is_active', true),
        role === 'admin'
          ? supabase.from('profiles').select('id', { count: 'exact', head: true })
          : supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1),
        role === 'admin'
          ? supabase.from('products').select('id', { count: 'exact', head: true })
          : supabase.from('products').select('id', { count: 'exact', head: true }).limit(1),
      ])

      const baseNotifications = (notifRows ?? []).map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        time: formatNotificationTime(row.created_at),
        createdAt: row.created_at,
        read: row.is_read,
      }))

      const commodityIds = (alertRows ?? [])
        .map((row) => row.commodity_id)
        .filter((id): id is number => typeof id === 'number')

      const latestPrices = new Map<number, number>()
      if (commodityIds.length) {
        const { data: priceRows } = await supabase
          .from('commodity_prices')
          .select('commodity_id,price,created_at')
          .in('commodity_id', commodityIds)
          .order('created_at', { ascending: false })

        ;(priceRows ?? []).forEach((row) => {
          if (!latestPrices.has(row.commodity_id)) {
            latestPrices.set(row.commodity_id, row.price)
          }
        })
      }

      const alertNotifications = (alertRows ?? []).map((row) => {
        const commodityName = row.commodities?.[0]?.name || 'Komoditas'
        const currentPrice =
          typeof row.commodity_id === 'number'
            ? latestPrices.get(row.commodity_id)
            : undefined
        const isTriggered =
          typeof currentPrice === 'number'
            ? row.condition === 'above'
              ? currentPrice >= row.target_price
              : currentPrice <= row.target_price
            : Boolean(row.triggered)

        return {
          id: `alert-${row.id}`,
          type: 'alert',
          title: `Smart Alert: ${commodityName}`,
          message: formatAlertMessage(
            commodityName,
            row.condition,
            row.target_price,
            currentPrice,
            isTriggered,
          ),
          time: formatNotificationTime(row.created_at),
          createdAt: row.created_at,
          read: Boolean(isTriggered),
        }
      })

      const mergedNotifications = [...alertNotifications, ...baseNotifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)

      setNotifications(mergedNotifications)

      setActiveProducts(
        (productRows ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          price: row.price,
          stock: row.stock,
          unit: row.unit,
          city: row.city || '-',
          image_url: row.image_url || null,
        }))
      )

      const modules = (moduleRows ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category || 'Umum',
        level: row.difficulty || 'pemula',
        duration: (row.duration_hours ?? 1) * 60,
        lessonsCount: row.lessons_count ?? 0,
        progress: 0,
      }))

      setLearningModules(modules)

      const categories = Array.from(
        new Set((categoryRows ?? []).map((row) => row.category).filter(Boolean)),
      )
      setCategoryOptions(categories as string[])

      const buyerProfileMap = new Map<
        string,
        { full_name: string | null; phone: string | null; email: string }
      >()
      if (role === 'seller' && orderRows && orderRows.length > 0) {
        const buyerIds = [
          ...new Set(
            (orderRows as { buyer_id?: string }[])
              .map((r) => r.buyer_id)
              .filter((id): id is string => Boolean(id)),
          ),
        ]
        if (buyerIds.length > 0) {
          const { data: buyerProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, phone, email')
            .in('id', buyerIds)
          for (const p of buyerProfiles ?? []) {
            buyerProfileMap.set(p.id, {
              full_name: p.full_name,
              phone: p.phone,
              email: p.email,
            })
          }
        }
      }

      setOrders(
        (orderRows ?? []).map((row) => {
          const r0 = row as {
            id: string
            status?: string | null
            grand_total: number
            created_at: string
            rated?: boolean | null
            shipping_courier?: string | null
            tracking_number?: string | null
            buyer_id?: string
            buyer_address?: string | null
            buyer_phone?: string | null
            notes?: string | null
            payment_method?: string | null
            order_items?: Array<{
              product_name: string
              quantity: number
              price: number
              unit?: string | null
            }>
          }
          const base: DashboardOrder = {
            id: r0.id,
            status: r0.status ?? '',
            grandTotal: r0.grand_total,
            createdAt: r0.created_at,
            rated: Boolean(r0.rated),
            shippingCourier: r0.shipping_courier ?? null,
            trackingNumber: r0.tracking_number ?? null,
          }
          if (role !== 'seller') return base

          const r = r0
          const prof = r.buyer_id ? buyerProfileMap.get(r.buyer_id) : undefined
          const buyerName =
            prof?.full_name?.trim() ||
            prof?.email ||
            'Pembeli'

          return {
            ...base,
            buyerName,
            buyerPhone: r.buyer_phone || prof?.phone || '',
            buyerAddress: r.buyer_address || '',
            notes: r.notes ?? null,
            paymentMethod: r.payment_method ?? null,
            shippingCourier: r.shipping_courier ?? null,
            trackingNumber: r.tracking_number ?? null,
            items: Array.isArray(r.order_items)
              ? r.order_items.map((it) => ({
                  productName: it.product_name,
                  quantity: it.quantity,
                  price: it.price,
                  unit: it.unit ?? 'kg',
                }))
              : [],
          }
        }),
      )

      if (role === 'seller') {
        const { data: sellerProf } = await supabase
          .from('profiles')
          .select('rating_avg, total_reviews')
          .eq('id', userProfile.id)
          .single()
        setSellerReviewStats({
          ratingAvg:
            sellerProf?.rating_avg != null
              ? Number(sellerProf.rating_avg)
              : 0,
          totalReviews: sellerProf?.total_reviews ?? 0,
        })
      } else {
        setSellerReviewStats({ ratingAvg: 0, totalReviews: 0 })
      }

      if (role === 'user') {
        setSavedProducts(
          (savedRows ?? []).map((row: any) => ({
            id: row.products?.id ?? row.id,
            name: row.products?.name ?? 'Produk',
            price: row.products?.price ?? 0,
            unit: row.products?.unit ?? 'kg',
            city: row.products?.city ?? '-',
            province: row.products?.province ?? '-',
          }))
        )
      } else {
        setSavedProducts([])
      }

      if (role === 'admin') {
        const { data: revenueRows } = await supabase
          .from('orders')
          .select('grand_total,created_at')
          .order('created_at', { ascending: false })
          .limit(200)

        const revenue = (revenueRows ?? []).reduce(
          (sum, row) => sum + (row.grand_total ?? 0),
          0,
        )

        setAdminStats({
          users: userCount ?? 0,
          products: productCount ?? 0,
          orders: (revenueRows ?? []).length,
          revenue,
        })
      }

      const orderForChart = role === 'admin'
        ? await supabase
            .from('orders')
            .select('grand_total,created_at')
            .order('created_at', { ascending: false })
            .limit(200)
        : role === 'seller'
          ? await supabase
              .from('orders')
              .select('grand_total,created_at')
              .eq('seller_id', userProfile.id)
              .order('created_at', { ascending: false })
              .limit(200)
          : await supabase
              .from('orders')
              .select('grand_total,created_at')
              .eq('buyer_id', userProfile.id)
              .order('created_at', { ascending: false })
              .limit(200)

      const chartRows = orderForChart.data ?? []
      const earnings = buildMonthlyEarnings(chartRows)
      setMonthlyEarnings(earnings)
      setTotalOrderValue(
        chartRows.reduce((sum, row) => sum + (row.grand_total ?? 0), 0)
      )
  }, [userProfile, userRole])

  React.useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleSubmitOrderRating = async () => {
    if (!ratingDialogOrder) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Sesi habis',
        description: 'Silakan login lagi untuk memberi penilaian.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingRating(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          orderId: ratingDialogOrder.id,
          rating: ratingValue,
          comment: ratingComment.trim() || undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast({
          title: 'Gagal menyimpan',
          description: data.error || 'Coba lagi nanti.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Terima kasih',
        description: 'Penilaian Anda telah disimpan.',
      })
      setRatingDialogOrder(null)
      setRatingComment('')
      await loadDashboardData()
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const updateSellerOrderStatus = async (
    order: DashboardOrder,
    status: string,
    extra?: { shippingCourier?: string; trackingNumber?: string },
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Sesi habis',
        description: 'Silakan login lagi.',
        variant: 'destructive',
      })
      return
    }

    setSellerUpdatingOrderId(order.id)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status,
          shippingCourier: extra?.shippingCourier,
          trackingNumber: extra?.trackingNumber,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast({
          title: 'Gagal memperbarui pesanan',
          description: json.error || 'Coba lagi.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Pesanan diperbarui',
        description:
          status === 'dibayar'
            ? 'Lanjutkan dengan mengirim produk ke pembeli.'
            : status === 'dikirim'
              ? 'Info pengiriman tersimpan.'
              : 'Pesanan selesai. Pembeli dapat memberi penilaian.',
      })
      setSellerShipOrder(null)
      await loadDashboardData()
    } finally {
      setSellerUpdatingOrderId(null)
    }
  }

  const loadAdminControlData = async (force = false) => {
    if (!force && adminControlLoaded) return
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Sesi habis',
        description: 'Silakan login ulang sebagai admin.',
        variant: 'destructive',
      })
      return
    }

    setIsLoadingAdminControl(true)
    try {
      const res = await fetch('/api/admin/control-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        products?: AdminManagedProduct[]
        users?: AdminManagedUser[]
        orders?: AdminManagedOrder[]
      }
      if (!res.ok) {
        toast({
          title: 'Gagal memuat data admin',
          description: json.error || 'Coba lagi nanti.',
          variant: 'destructive',
        })
        return
      }
      setAdminProducts(json.products ?? [])
      setAdminUsers(json.users ?? [])
      setAdminOrders(json.orders ?? [])
      setAdminControlLoaded(true)
    } finally {
      setIsLoadingAdminControl(false)
    }
  }

  const updateAdminProductStatus = async (productId: string, status: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Sesi habis',
        description: 'Silakan login ulang sebagai admin.',
        variant: 'destructive',
      })
      return
    }
    const key = `product:${productId}`
    setAdminActionKey(key)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast({
          title: 'Gagal update produk',
          description: json.error || 'Coba lagi nanti.',
          variant: 'destructive',
        })
        return
      }
      setAdminProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status } : p)),
      )
      setAdminControlLoaded(false)
      await loadDashboardData()
      toast({
        title: 'Produk diperbarui',
        description: `Status produk menjadi ${status}.`,
      })
    } finally {
      setAdminActionKey(null)
    }
  }

  const updateAdminUserRole = async (targetUserId: string, role: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Sesi habis',
        description: 'Silakan login ulang sebagai admin.',
        variant: 'destructive',
      })
      return
    }
    const key = `user:${targetUserId}`
    setAdminActionKey(key)
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ role }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast({
          title: 'Gagal update role',
          description: json.error || 'Coba lagi nanti.',
          variant: 'destructive',
        })
        return
      }
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role } : u)),
      )
      setAdminControlLoaded(false)
      await loadDashboardData()
      toast({
        title: 'Role diperbarui',
        description: `Role user diubah menjadi ${roleLabel(role)}.`,
      })
    } finally {
      setAdminActionKey(null)
    }
  }

  const handleCreateProduct = async () => {
    setProductError('')
    setProductSuccess('')

    if (!userProfile) {
      setProductError('Silakan login sebagai penjual terlebih dahulu.')
      return
    }

    // Validasi nama dan kategori
    if (!productForm.name.trim()) {
      setProductError('Nama produk wajib diisi.')
      return
    }

    if (!productForm.category.trim()) {
      setProductError('Kategori wajib dipilih.')
      return
    }

    // Validasi harga
    const price = Number(productForm.price)
    if (!Number.isFinite(price) || price <= 0) {
      setProductError('Harga harus lebih dari 0.')
      return
    }

    // Validasi stok
    const stock = Number(productForm.stock)
    if (!Number.isFinite(stock) || stock < 0) {
      setProductError('Stok tidak valid.')
      return
    }

    // Validasi ukuran file gambar
    if (productImageFile) {
      const maxSizeMB = 5
      if (productImageFile.size > maxSizeMB * 1024 * 1024) {
        setProductError(`Ukuran gambar tidak boleh lebih dari ${maxSizeMB}MB.`)
        return
      }

      // Validasi tipe file
      if (!productImageFile.type.startsWith('image/')) {
        setProductError('File harus berupa gambar (jpg, png, dll).')
        return
      }
    }

    setIsSavingProduct(true)

    try {
      let imageUrl: string | null = null

      // Upload gambar jika ada
      if (productImageFile) {
        const fileExt = productImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const timestamp = Date.now()
        const random = Math.random().toString(36).slice(2, 8)
        const filePath = `products/${userProfile.id}/${timestamp}-${random}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(filePath, productImageFile)

        if (uploadError) {
          setProductError(`Gagal upload gambar: ${uploadError.message}`)
          setIsSavingProduct(false)
          return
        }

        const { data: publicUrl } = supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .getPublicUrl(filePath)

        if (!publicUrl?.publicUrl) {
          setProductError('Gagal menghasilkan URL gambar.')
          setIsSavingProduct(false)
          return
        }

        imageUrl = publicUrl.publicUrl
      }

      // Buat slug unik
      const baseSlug = slugify(productForm.name)
      const slugSuffix = Math.random().toString(36).slice(2, 6)
      const slug = `${baseSlug}-${slugSuffix}`

      // Simpan produk ke Supabase
      const { data: insertedProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          seller_id: userProfile.id,
          name: productForm.name.trim(),
          slug,
          category: productForm.category.trim(),
          description: productForm.description.trim() || null,
          price,
          stock,
          unit: productForm.unit.trim() || 'kg',
          province: productForm.province.trim() || null,
          city: productForm.city.trim() || null,
          status: 'aktif',
          image_url: imageUrl ? [imageUrl] : [],
        })
        .select()

      if (insertError) {
        setProductError(`Gagal menyimpan produk: ${insertError.message}`)
        setIsSavingProduct(false)
        return
      }

      // Reset form dan tampilkan pesan sukses
      setProductForm({
        name: '',
        category: '',
        price: '',
        stock: '',
        unit: 'kg',
        province: '',
        city: '',
        description: '',
      })
      setProductImageFile(null)
      setProductImageName('')

      // Tambah produk baru ke list secara instant
      if (insertedProduct && insertedProduct.length > 0) {
        const newProduct = insertedProduct[0]
        setActiveProducts((prev) => [
          {
            id: newProduct.id,
            name: newProduct.name,
            category: newProduct.category,
            price: newProduct.price,
            stock: newProduct.stock,
            unit: newProduct.unit,
            city: newProduct.city || '-',
            province: newProduct.province || null,
            description: newProduct.description || null,
            image_url: newProduct.image_url || null,
          },
          ...prev,
        ])
      }

      setProductSuccess('Produk berhasil disimpan! Produk Anda sekarang tersedia di PasarLangsung.')

      // Tutup dialog setelah 2 detik
      setTimeout(() => {
        setShowAddProduct(false)
        setProductSuccess('')
      }, 2000)

      // Refresh data dari Supabase
      await loadDashboardData()
    } catch (error) {
      console.error('Error creating product:', error)
      setProductError('Terjadi kesalahan saat menyimpan produk. Silakan coba lagi.')
    } finally {
      setIsSavingProduct(false)
    }
  }

  const handleOpenEditProfile = () => {
    if (!userProfile) return
    setProfileForm({
      full_name: userProfile.full_name || '',
      phone: userProfile.phone || '',
      province: userProfile.province || '',
      city: userProfile.city || '',
    })
    setProfileError('')
    setProfileSuccess('')
    setShowEditProfile(true)
  }

  const handleSaveProfile = async () => {
    if (!userProfile) return
    setProfileError('')
    setProfileSuccess('')

    if (!profileForm.full_name.trim()) {
      setProfileError('Nama lengkap wajib diisi.')
      return
    }

    setIsSavingProfile(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || null,
        province: profileForm.province.trim() || null,
        city: profileForm.city.trim() || null,
      })
      .eq('id', userProfile.id)

    if (error) {
      setProfileError(`Gagal memperbarui profil: ${error.message}`)
      setIsSavingProfile(false)
      return
    }

    setAuth({
      ...userProfile,
      full_name: profileForm.full_name.trim(),
      phone: profileForm.phone.trim() || null,
      province: profileForm.province.trim() || null,
      city: profileForm.city.trim() || null,
    })

    setProfileSuccess('Profil berhasil diperbarui.')
    setTimeout(() => {
      setShowEditProfile(false)
      setProfileSuccess('')
    }, 1500)
    setIsSavingProfile(false)
  }

  const handleOpenEditProduct = (product: DashboardProduct) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      category: product.category || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      unit: product.unit || 'kg',
      province: product.province || '',
      city: product.city || '',
      description: product.description || '',
    })
    setEditProductImageFile(null)
    setEditProductImageName('')
    setProductError('')
    setProductSuccess('')
    setShowEditProduct(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct || !userProfile) return
    setProductError('')
    setProductSuccess('')

    if (!productForm.name.trim()) {
      setProductError('Nama produk wajib diisi.')
      return
    }

    if (!productForm.category.trim()) {
      setProductError('Kategori wajib dipilih.')
      return
    }

    const price = Number(productForm.price)
    if (!Number.isFinite(price) || price <= 0) {
      setProductError('Harga harus lebih dari 0.')
      return
    }

    const stock = Number(productForm.stock)
    if (!Number.isFinite(stock) || stock < 0) {
      setProductError('Stok tidak valid.')
      return
    }

    if (editProductImageFile) {
      const maxSizeMB = 5
      if (editProductImageFile.size > maxSizeMB * 1024 * 1024) {
        setProductError(`Ukuran gambar tidak boleh lebih dari ${maxSizeMB}MB.`)
        return
      }

      if (!editProductImageFile.type.startsWith('image/')) {
        setProductError('File harus berupa gambar (jpg, png, dll).')
        return
      }
    }

    setIsSavingProduct(true)

    try {
      let imageUrl = editingProduct.image_url?.[0] || null

      if (editProductImageFile) {
        const fileExt = editProductImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const timestamp = Date.now()
        const random = Math.random().toString(36).slice(2, 8)
        const filePath = `products/${userProfile.id}/${timestamp}-${random}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(filePath, editProductImageFile)

        if (uploadError) {
          setProductError(`Gagal upload gambar: ${uploadError.message}`)
          setIsSavingProduct(false)
          return
        }

        const { data: publicUrl } = supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .getPublicUrl(filePath)

        if (!publicUrl?.publicUrl) {
          setProductError('Gagal menghasilkan URL gambar.')
          setIsSavingProduct(false)
          return
        }

        imageUrl = publicUrl.publicUrl
      }

      const baseSlug = slugify(productForm.name)
      const slugSuffix = Math.random().toString(36).slice(2, 6)
      const slug = `${baseSlug}-${slugSuffix}`

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: productForm.name.trim(),
          slug,
          category: productForm.category.trim(),
          description: productForm.description.trim() || null,
          price,
          stock,
          unit: productForm.unit.trim() || 'kg',
          province: productForm.province.trim() || null,
          city: productForm.city.trim() || null,
          image_url: imageUrl ? [imageUrl] : [],
        })
        .eq('id', editingProduct.id)
        .eq('seller_id', userProfile.id)

      if (updateError) {
        setProductError(`Gagal memperbarui produk: ${updateError.message}`)
        setIsSavingProduct(false)
        return
      }

      setProductSuccess('Produk berhasil diperbarui.')
      await loadDashboardData()

      setTimeout(() => {
        setShowEditProduct(false)
        setProductSuccess('')
      }, 2000)
    } catch (updateError) {
      console.error('Error updating product:', updateError)
      setProductError('Terjadi kesalahan saat memperbarui produk. Silakan coba lagi.')
    } finally {
      setIsSavingProduct(false)
    }
  }

  const resolvedRole = (userRole ?? userProfile?.role ?? 'user').toLowerCase()
  const role = resolvedRole === 'admin' || resolvedRole === 'seller' ? resolvedRole : 'user'

  const profile = {
    name: userProfile?.full_name || userProfile?.email || 'Pengguna',
    email: userProfile?.email || '-',
    phone: userProfile?.phone || '-',
    province: userProfile?.province || '-',
    city: userProfile?.city || '-',
    landSize: 0,
    landUnit: 'hektar',
    joinDate: formatJoinDate(userProfile?.created_at),
    totalEarnings: totalOrderValue,
    activeProducts: activeProducts.length,
    completedModules: 0,
    points: 0,
  }

  // ── Stat cards data ──
  const stats = role === 'admin'
    ? [
        {
          label: 'Total Pengguna',
          value: adminStats.users.toString(),
          icon: Users,
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
          trend: null,
          trendUp: null,
        },
        {
          label: 'Produk Aktif',
          value: adminStats.products.toString(),
          icon: Package,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
          trend: null,
          trendUp: null,
        },
        {
          label: 'Transaksi',
          value: adminStats.orders.toString(),
          icon: ClipboardList,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
          trend: null,
          trendUp: null,
        },
        {
          label: 'Nilai Transaksi',
          value: formatCompactRupiah(adminStats.revenue),
          icon: DollarSign,
          color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
          trend: null,
          trendUp: null,
        },
      ]
    : role === 'seller'
      ? [
          {
            label: 'Total Penjualan',
            value: formatRupiah(profile.totalEarnings),
            icon: DollarSign,
            color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
            trend: null,
            trendUp: null,
          },
          {
            label: 'Produk Aktif',
            value: profile.activeProducts.toString(),
            icon: Package,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
            trend: null,
            trendUp: null,
          },
          {
            label: 'Pesanan',
            value: orders.length.toString(),
            icon: ClipboardList,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
            trend: null,
            trendUp: null,
          },
          {
            label: 'Rating',
            value:
              sellerReviewStats.totalReviews === 0
                ? ''
                : `${sellerReviewStats.ratingAvg.toFixed(1)} · ${sellerReviewStats.totalReviews} ulasan`,
            icon: Star,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
            trend: null,
            trendUp: null,
          },
        ]
      : [
          {
            label: 'Total Belanja',
            value: formatRupiah(profile.totalEarnings),
            icon: ShoppingBag,
            color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
            trend: null,
            trendUp: null,
          },
          {
            label: 'Pesanan',
            value: orders.length.toString(),
            icon: ClipboardList,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
            trend: null,
            trendUp: null,
          },
          {
            label: 'Tersimpan',
            value: savedProducts.length.toString(),
            icon: Heart,
            color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
            trend: null,
            trendUp: null,
          },
          {
            label: 'Modul',
            value: learningModules.length.toString(),
            icon: BookOpen,
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
            trend: null,
            trendUp: null,
          },
        ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {role === 'admin'
                ? 'Dashboard Admin'
                : role === 'seller'
                  ? 'Dashboard Penjual'
                  : 'Dashboard Pembeli'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {role === 'admin'
                ? 'Pantau aktivitas platform dan kontrol data'
                : role === 'seller'
                  ? 'Kelola penjualan hasil tani Anda'
                  : 'Lacak pesanan dan produk favorit Anda'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Pengaturan
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* ── Row 1: Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="border-border/50">
                <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.color}`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold leading-tight sm:text-2xl">
                      {stat.value}
                    </p>
                    {stat.trend && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                          stat.trendUp ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {role === 'seller' && (
          <motion.div variants={itemVariants}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Pesanan masuk
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Konfirmasi, kirim, lalu tandai selesai agar pembeli bisa memberi penilaian.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada pesanan dari pembeli.</p>
                ) : (
                  [...orders]
                    .sort(
                      (a, b) =>
                        sellerOrderSortKey(a.status) - sellerOrderSortKey(b.status) ||
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    )
                    .map((order) => {
                      const st = (order.status || '').toLowerCase()
                      const busy = sellerUpdatingOrderId === order.id
                      return (
                        <div
                          key={order.id}
                          className="rounded-lg border border-border/50 p-4 space-y-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-medium">
                                Pesanan #{order.id.slice(0, 8)} · {order.buyerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString('id-ID')}
                              </p>
                              <Badge variant="secondary" className="text-[10px] w-fit">
                                {orderStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <p className="text-sm font-semibold text-primary">
                                {formatRupiah(order.grandTotal)}
                              </p>
                            </div>
                          </div>

                          {order.items && order.items.length > 0 && (
                            <ul className="text-xs text-muted-foreground space-y-1 border-t border-border/40 pt-2">
                              {order.items.map((it, i) => (
                                <li key={i}>
                                  {it.productName} × {it.quantity} {it.unit} —{' '}
                                  {formatRupiah(it.price * it.quantity)}
                                </li>
                              ))}
                            </ul>
                          )}

                          {(order.buyerAddress || order.buyerPhone) && (
                            <div className="text-xs text-muted-foreground space-y-0.5 border-t border-border/40 pt-2">
                              {order.buyerPhone && (
                                <p>
                                  <span className="font-medium text-foreground/80">HP: </span>
                                  {order.buyerPhone}
                                </p>
                              )}
                              {order.buyerAddress && (
                                <p className="whitespace-pre-wrap">
                                  <span className="font-medium text-foreground/80">Alamat: </span>
                                  {order.buyerAddress}
                                </p>
                              )}
                              {order.paymentMethod && (
                                <p>
                                  <span className="font-medium text-foreground/80">Bayar: </span>
                                  {order.paymentMethod}
                                </p>
                              )}
                              {order.notes && (
                                <p className="whitespace-pre-wrap">
                                  <span className="font-medium text-foreground/80">Catatan: </span>
                                  {order.notes}
                                </p>
                              )}
                            </div>
                          )}

                          {(st === 'dikirim' || st === 'diterima') &&
                            (order.shippingCourier || order.trackingNumber) && (
                              <div className="flex flex-wrap items-center gap-2 text-xs border-t border-border/40 pt-2">
                                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                {order.shippingCourier && (
                                  <span>Kurir: {order.shippingCourier}</span>
                                )}
                                {order.trackingNumber && (
                                  <span>Resi: {order.trackingNumber}</span>
                                )}
                              </div>
                            )}

                          <div className="flex flex-wrap gap-2 pt-1">
                            {st === 'menunggu' && (
                              <Button
                                size="sm"
                                className="gap-1.5"
                                disabled={busy}
                                onClick={() => void updateSellerOrderStatus(order, 'dibayar')}
                              >
                                {busy ? (
                                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                Konfirmasi & proses
                              </Button>
                            )}
                            {st === 'dibayar' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="gap-1.5"
                                disabled={busy}
                                onClick={() => {
                                  setSellerShipOrder(order)
                                  setShipCourier(order.shippingCourier || '')
                                  setShipTracking(order.trackingNumber || '')
                                }}
                              >
                                <Truck className="h-3.5 w-3.5" />
                                Kirim & isi resi
                              </Button>
                            )}
                            {st === 'dikirim' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                disabled={busy}
                                onClick={() => void updateSellerOrderStatus(order, 'diterima')}
                              >
                                {busy ? (
                                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                Tandai diterima pembeli
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Row 2: Profile + Notifications ───────────────────── */}
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Profile Card */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" />
                  Profil User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar + Name */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xl font-bold text-primary-foreground shadow-md">
                    {getInitials(profile.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">
                      {profile.name}
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">
                      {profile.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile.phone}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {profile.city}, {profile.province}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      Lahan: {profile.landSize} {profile.landUnit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0 text-primary" />
                    <span>Bergabung sejak {profile.joinDate}</span>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={handleOpenEditProfile}>
                  <Edit className="h-4 w-4" />
                  Edit Profil
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-primary" />
                    Notifikasi
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {notifications.filter((n) => !n.read).length} baru
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-6 py-4 transition-colors hover:bg-accent/50 ${
                        !notif.read ? 'border-l-4 border-l-primary bg-primary/[0.02]' : ''
                      }`}
                    >
                      <NotificationIcon type={notif.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              !notif.read ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                          {notif.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Row 3: Role-based Sections ─────────────────────── */}
        {role === 'seller' && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Learning Progress */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Progres Belajar
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary">
                      Lihat Semua
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {learningModules.map((mod) => {
                    const progress = moduleProgressMap[mod.id] ?? mod.progress
                    const isComplete = progress === 100
                    return (
                      <div
                        key={mod.id}
                        className="rounded-lg border border-border/50 p-4 transition-colors hover:bg-accent/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">
                              {mod.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] px-1.5">
                                {mod.category}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                {mod.level}
                              </Badge>
                              <span>
                                {mod.lessonsCount} pelajaran &middot; {mod.duration} menit
                              </span>
                            </div>
                          </div>
                          {isComplete ? (
                            <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                          ) : (
                            <span className="shrink-0 text-xs font-semibold text-primary">
                              {progress}%
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <Progress
                            value={progress}
                            className={`h-2 ${isComplete ? '[&>div]:bg-green-600' : ''}`}
                          />
                        </div>
                        {isComplete && (
                          <p className="mt-2 text-xs text-green-600 font-medium">
                            Selesai! Lihat sertifikat Anda.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Product Listings */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4 text-primary" />
                      Produk Aktif
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setShowAddProduct(true)}
                    >
                      + Tambah Produk
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeProducts.length === 0 ? (
                    <div className="rounded-lg border border-border/50 border-dashed p-6 text-center">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Belum ada produk. Klik "Tambah Produk" untuk mulai!
                      </p>
                    </div>
                  ) : (
                    activeProducts.map((product) => {
                      const imageUrl =
                        product.image_url && product.image_url.length > 0
                          ? product.image_url[0]
                          : null

                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/30"
                        >
                          {/* Thumbnail */}
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-tight">
                              {product.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] px-1.5">
                                {product.category}
                              </Badge>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {product.city}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Stok: <span className="font-medium">{product.stock}</span>{' '}
                              {product.unit}
                            </div>
                          </div>

                          {/* Price & Actions */}
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-primary">
                              {formatRupiah(product.price)}
                            </p>
                            <p className="text-[11px] text-muted-foreground mb-2">
                              /{product.unit}
                            </p>
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Lihat detail"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Edit produk"
                                onClick={() => handleOpenEditProduct(product)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>📦 Tambah Produk Hasil Tani</DialogTitle>
                <DialogDescription>
                  Bagikan hasil panen Anda ke pembeli langsung. Data akan tersimpan di database kami.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                {/* Pesan Sukses */}
                {productSuccess && (
                  <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{productSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pesan Error */}
                {productError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{productError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {/* Nama Produk */}
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Nama Produk <span className="text-red-500">*</span>
                    </label>
                    <Input
                      disabled={isSavingProduct}
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      placeholder="Contoh: Beras Organik Premium"
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={isSavingProduct}
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({ ...productForm, category: e.target.value })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- Pilih kategori --</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {categoryOptions.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Kategori masih loading...
                      </p>
                    )}
                  </div>

                  {/* Harga & Stok */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Harga (Rp) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        disabled={isSavingProduct}
                        type="number"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({ ...productForm, price: e.target.value })
                        }
                        placeholder="15000"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Stok <span className="text-red-500">*</span>
                      </label>
                      <Input
                        disabled={isSavingProduct}
                        type="number"
                        value={productForm.stock}
                        onChange={(e) =>
                          setProductForm({ ...productForm, stock: e.target.value })
                        }
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* Satuan & Kota */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Satuan
                      </label>
                      <Input
                        disabled={isSavingProduct}
                        value={productForm.unit}
                        onChange={(e) =>
                          setProductForm({ ...productForm, unit: e.target.value })
                        }
                        placeholder="kg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Kota
                      </label>
                      <Input
                        disabled={isSavingProduct}
                        value={productForm.city}
                        onChange={(e) =>
                          setProductForm({ ...productForm, city: e.target.value })
                        }
                        placeholder="Contoh: Bandung"
                      />
                    </div>
                  </div>

                  {/* Provinsi */}
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Provinsi
                    </label>
                    <Input
                      disabled={isSavingProduct}
                      value={productForm.province}
                      onChange={(e) =>
                        setProductForm({ ...productForm, province: e.target.value })
                      }
                      placeholder="Contoh: Jawa Barat"
                    />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Deskripsi Singkat
                    </label>
                    <Input
                      disabled={isSavingProduct}
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      placeholder="Kualitas premium, organik, dll"
                    />
                  </div>

                  {/* Foto Produk */}
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Foto Produk (PNG/JPG, max 5MB)
                    </label>
                    <Input
                      disabled={isSavingProduct}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setProductImageFile(file)
                        setProductImageName(file?.name ?? '')
                      }}
                    />
                    {productImageName && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        ✓ {productImageName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddProduct(false)
                      setProductError('')
                      setProductSuccess('')
                    }}
                    disabled={isSavingProduct}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleCreateProduct}
                    disabled={isSavingProduct || !productForm.name.trim() || !productForm.category.trim()}
                    className="gap-2"
                  >
                    {isSavingProduct ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Menyimpan...
                      </>
                    ) : (
                      '💾 Simpan Produk'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>✏️ Edit Profil</DialogTitle>
                <DialogDescription>
                  Perbarui informasi kontak dan alamat Anda untuk profil penjual.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                {profileSuccess && (
                  <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-medium">{profileSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}
                {profileError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-medium">{profileError}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground">Nama Lengkap</label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      disabled={isSavingProfile}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">No. Telepon</label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      disabled={isSavingProfile}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Provinsi</label>
                      <Input
                        value={profileForm.province}
                        onChange={(e) => setProfileForm({ ...profileForm, province: e.target.value })}
                        disabled={isSavingProfile}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Kota</label>
                      <Input
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        disabled={isSavingProfile}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditProfile(false)}
                    disabled={isSavingProfile}
                  >
                    Batal
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-2">
                    {isSavingProfile ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      'Simpan Profil'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>✏️ Edit Produk</DialogTitle>
                <DialogDescription>
                  Ubah detail produk dan unggah foto baru jika diperlukan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                {productSuccess && (
                  <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-medium">{productSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}
                {productError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-medium">{productError}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Nama Produk <span className="text-red-500">*</span>
                    </label>
                    <Input
                      disabled={isSavingProduct}
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Contoh: Beras Organik Premium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={isSavingProduct}
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">-- Pilih kategori --</option>
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Harga (Rp) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        disabled={isSavingProduct}
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="15000"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        Stok <span className="text-red-500">*</span>
                      </label>
                      <Input
                        disabled={isSavingProduct}
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Satuan</label>
                      <Input
                        disabled={isSavingProduct}
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        placeholder="kg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Kota</label>
                      <Input
                        disabled={isSavingProduct}
                        value={productForm.city}
                        onChange={(e) => setProductForm({ ...productForm, city: e.target.value })}
                        placeholder="Contoh: Bandung"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Provinsi</label>
                    <Input
                      disabled={isSavingProduct}
                      value={productForm.province}
                      onChange={(e) => setProductForm({ ...productForm, province: e.target.value })}
                      placeholder="Contoh: Jawa Barat"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Deskripsi Singkat</label>
                    <Input
                      disabled={isSavingProduct}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Kualitas premium, organik, dll"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Foto Produk (PNG/JPG, max 5MB)
                    </label>
                    <Input
                      disabled={isSavingProduct}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setEditProductImageFile(file)
                        setEditProductImageName(file?.name ?? '')
                      }}
                    />
                    {editProductImageName && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        ✓ {editProductImageName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditProduct(false)}
                    disabled={isSavingProduct}
                  >
                    Batal
                  </Button>
                  <Button onClick={handleUpdateProduct} disabled={isSavingProduct} className="gap-2">
                    {isSavingProduct ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      'Perbarui Produk'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        <Dialog
          open={!!sellerShipOrder}
          onOpenChange={(open) => {
            if (!open) {
              setSellerShipOrder(null)
              setShipCourier('')
              setShipTracking('')
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kirim ke pembeli</DialogTitle>
              <DialogDescription>
                Pesanan #{sellerShipOrder?.id.slice(0, 8)} — kurir dan resi opsional; pembeli akan
                melihat status &quot;Dalam pengiriman&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ship-courier">Kurir (opsional)</Label>
                <Input
                  id="ship-courier"
                  value={shipCourier}
                  onChange={(e) => setShipCourier(e.target.value)}
                  placeholder="JNE, J&T, ambil di lokasi, dll."
                  disabled={!!sellerUpdatingOrderId}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ship-tracking">Nomor resi (opsional)</Label>
                <Input
                  id="ship-tracking"
                  value={shipTracking}
                  onChange={(e) => setShipTracking(e.target.value)}
                  placeholder="Nomor pelacakan"
                  disabled={!!sellerUpdatingOrderId}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSellerShipOrder(null)
                  setShipCourier('')
                  setShipTracking('')
                }}
                disabled={!!sellerUpdatingOrderId}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!sellerShipOrder) return
                  void updateSellerOrderStatus(sellerShipOrder, 'dikirim', {
                    shippingCourier: shipCourier,
                    trackingNumber: shipTracking,
                  })
                }}
                disabled={!!sellerUpdatingOrderId}
                className="gap-2"
              >
                {sellerUpdatingOrderId === sellerShipOrder?.id ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Simpan & tandai dikirim
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdminProducts} onOpenChange={setShowAdminProducts}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Moderasi Produk</DialogTitle>
              <DialogDescription>
                Ubah visibilitas produk untuk menjaga kualitas marketplace.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {isLoadingAdminControl && (
                <p className="text-sm text-muted-foreground">Memuat data produk...</p>
              )}
              {!isLoadingAdminControl && adminProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada produk.</p>
              )}
              {adminProducts.map((product) => {
                const busy = adminActionKey === `product:${product.id}`
                const status = (product.status || 'aktif').toLowerCase()
                return (
                  <div
                    key={product.id}
                    className="rounded-lg border border-border/50 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sellerName} · {product.category} · {product.city}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatRupiah(product.price)} /{product.unit}
                      </span>
                      <span>Stok: {product.stock}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={status === 'aktif' ? 'secondary' : 'outline'}
                        disabled={busy || status === 'aktif'}
                        onClick={() => void updateAdminProductStatus(product.id, 'aktif')}
                      >
                        Aktifkan
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'tidak_aktif' ? 'secondary' : 'outline'}
                        disabled={busy || status === 'tidak_aktif'}
                        onClick={() => void updateAdminProductStatus(product.id, 'tidak_aktif')}
                      >
                        Nonaktifkan
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdminOrders} onOpenChange={setShowAdminOrders}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Monitoring Transaksi</DialogTitle>
              <DialogDescription>
                Pantau transaksi terbaru antara pembeli dan penjual.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {isLoadingAdminControl && (
                <p className="text-sm text-muted-foreground">Memuat data transaksi...</p>
              )}
              {!isLoadingAdminControl && adminOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
              )}
              {adminOrders.map((order) => (
                <div key={order.id} className="rounded-lg border border-border/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {orderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    <p>Pembeli: {order.buyerName}</p>
                    <p>Penjual: {order.sellerName}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {formatRupiah(order.grandTotal)}
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdminUsers} onOpenChange={setShowAdminUsers}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manajemen Pengguna</DialogTitle>
              <DialogDescription>
                Atur role pengguna untuk akses pembeli, penjual, atau admin.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {isLoadingAdminControl && (
                <p className="text-sm text-muted-foreground">Memuat data pengguna...</p>
              )}
              {!isLoadingAdminControl && adminUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada pengguna.</p>
              )}
              {adminUsers.map((u) => {
                const busy = adminActionKey === `user:${u.id}`
                const role = (u.role || 'user').toLowerCase()
                return (
                  <div key={u.id} className="rounded-lg border border-border/50 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {roleLabel(role)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.city}, {u.province}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={role === 'user' ? 'secondary' : 'outline'}
                        disabled={busy || role === 'user'}
                        onClick={() => void updateAdminUserRole(u.id, 'user')}
                      >
                        Pembeli
                      </Button>
                      <Button
                        size="sm"
                        variant={role === 'seller' ? 'secondary' : 'outline'}
                        disabled={busy || role === 'seller'}
                        onClick={() => void updateAdminUserRole(u.id, 'seller')}
                      >
                        Penjual
                      </Button>
                      <Button
                        size="sm"
                        variant={role === 'admin' ? 'secondary' : 'outline'}
                        disabled={busy || role === 'admin'}
                        onClick={() => void updateAdminUserRole(u.id, 'admin')}
                      >
                        Admin
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>

        {role === 'user' && (
          <>
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Riwayat Pembelian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orders.length === 0 && (
                    <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
                  )}
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">Pesanan #{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('id-ID')}
                        </p>
                        {['dikirim', 'diterima'].includes(
                          (order.status || '').toLowerCase(),
                        ) &&
                          (order.shippingCourier || order.trackingNumber) && (
                            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                              {order.shippingCourier && (
                                <span>Kurir: {order.shippingCourier}</span>
                              )}
                              {order.shippingCourier && order.trackingNumber && (
                                <span> · </span>
                              )}
                              {order.trackingNumber && (
                                <span>Resi: {order.trackingNumber}</span>
                              )}
                            </p>
                          )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">
                            {formatRupiah(order.grandTotal)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {orderStatusLabel(order.status)}
                          </p>
                          {order.rated && (
                            <p className="text-[10px] text-muted-foreground">Sudah dinilai</p>
                          )}
                        </div>
                        {canRateBuyerOrder(order) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="shrink-0 gap-1"
                            onClick={() => {
                              setRatingDialogOrder(order)
                              setRatingValue(5)
                              setRatingComment('')
                            }}
                          >
                            <Star className="h-3.5 w-3.5" />
                            Beri Rating
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4 text-primary" />
                    Produk Tersimpan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground">Belum ada produk disimpan.</p>
                  )}
                  {savedProducts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.city}, {item.province}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{formatRupiah(item.price)}</p>
                        <p className="text-xs text-muted-foreground">/{item.unit}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Dialog
            open={!!ratingDialogOrder}
            onOpenChange={(open) => {
              if (!open) {
                setRatingDialogOrder(null)
                setRatingComment('')
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Beri penilaian</DialogTitle>
                <DialogDescription>
                  Nilai pesanan #{ratingDialogOrder?.id.slice(0, 8)} untuk membantu penjual dan pembeli lain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Rating (1–5)</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRatingValue(n)}
                        className="rounded-md p-1 transition-colors hover:bg-accent"
                        aria-label={`${n} bintang`}
                      >
                        <Star
                          className={`h-8 w-8 ${
                            n <= ratingValue
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating-comment">Komentar (opsional)</Label>
                  <Textarea
                    id="rating-comment"
                    placeholder="Bagaimana pengalaman Anda?"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRatingDialogOrder(null)
                      setRatingComment('')
                    }}
                    disabled={isSubmittingRating}
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSubmitOrderRating()}
                    disabled={isSubmittingRating}
                    className="gap-2"
                  >
                    {isSubmittingRating ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        <Star className="h-4 w-4" />
                        Kirim
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </>
        )}

        {role === 'admin' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Kontrol Admin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                    <div>
                      <p className="text-sm font-medium">Moderasi Produk</p>
                      <p className="text-xs text-muted-foreground">Pantau produk yang masuk</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void loadAdminControlData()
                        setShowAdminProducts(true)
                      }}
                    >
                      Kelola
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                    <div>
                      <p className="text-sm font-medium">Monitoring Transaksi</p>
                      <p className="text-xs text-muted-foreground">Cek transaksi terbaru</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void loadAdminControlData()
                        setShowAdminOrders(true)
                      }}
                    >
                      Lihat
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                    <div>
                      <p className="text-sm font-medium">Manajemen Pengguna</p>
                      <p className="text-xs text-muted-foreground">Atur role dan akses</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void loadAdminControlData()
                        setShowAdminUsers(true)
                      }}
                    >
                      Kelola
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Transaksi Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orders.length === 0 && (
                    <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
                  )}
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                      <div>
                        <p className="text-sm font-medium">Order #{order.id.slice(0, 6)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{formatRupiah(order.grandTotal)}</p>
                        <p className="text-xs text-muted-foreground">
                          {orderStatusLabel(order.status)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* ── Row 4: Income Chart ──────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Ringkasan Bulanan
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Total 6 bulan:</span>
                    <span className="font-bold text-primary">
                      {formatRupiah(
                        monthlyEarnings.reduce((sum, e) => sum + e.amount, 0),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary pills */}
              <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Rata-rata</p>
                  <p className="text-sm font-semibold">
                    {formatCompactRupiah(
                      monthlyEarnings.length
                        ? Math.round(
                            monthlyEarnings.reduce((s, e) => s + e.amount, 0) /
                              monthlyEarnings.length,
                          )
                        : 0,
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Tertinggi</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCompactRupiah(
                      monthlyEarnings.length
                        ? Math.max(...monthlyEarnings.map((e) => e.amount))
                        : 0,
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Terendah</p>
                  <p className="text-sm font-semibold text-red-500">
                    {formatCompactRupiah(
                      monthlyEarnings.length
                        ? Math.min(...monthlyEarnings.map((e) => e.amount))
                        : 0,
                    )}
                  </p>
                </div>
              </div>

              {/* SVG Chart */}
              <div className="h-64 sm:h-72">
                <IncomeChart data={monthlyEarnings.length ? monthlyEarnings : buildMonthlyEarnings([])} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
