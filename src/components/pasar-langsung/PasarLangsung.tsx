'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import {
  Store,
  Search,
  Star,
  MapPin,
  Package,
  MessageCircle,
  Heart,
  Truck,
  Shield,
} from 'lucide-react'
type MarketplaceProduct = {
  id: string
  sellerId: string
  name: string
  description: string
  price: number
  unit: string
  stock: number
  category: string
  province: string
  city: string
  image: string
  status: string
  farmerName: string
  farmerAvatar: string
}

/* ------------------------------------------------------------------ */
/*  Collective package data (Paket Kolektif)                          */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Category helpers                                                  */
/* ------------------------------------------------------------------ */
const categoryEmoji: Record<string, string> = {
  Semua: '🌾',
  Beras: '🌾',
  Sayuran: '🥬',
  Bumbu: '🧄',
  Kopi: '☕',
  Pangan: '🌽',
}

/* ------------------------------------------------------------------ */
/*  Price formatter                                                   */
/* ------------------------------------------------------------------ */
const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

/* ------------------------------------------------------------------ */
/*  Product card image placeholder (gradient based on category)       */
/* ------------------------------------------------------------------ */
const categoryGradients: Record<string, string> = {
  Beras: 'from-amber-100 to-yellow-200 dark:from-amber-900/40 dark:to-yellow-900/30',
  Sayuran: 'from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/30',
  Bumbu: 'from-orange-100 to-red-200 dark:from-orange-900/40 dark:to-red-900/30',
  Kopi: 'from-amber-200 to-stone-300 dark:from-amber-900/40 dark:to-stone-800/30',
  Pangan: 'from-lime-100 to-green-200 dark:from-lime-900/40 dark:to-green-900/30',
}

const productRatings: Record<string, number> = {
  '1': 4.8,
  '2': 4.6,
  '3': 4.9,
  '4': 4.7,
  '5': 4.5,
  '6': 4.8,
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 20 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

/* ------------------------------------------------------------------ */
/*  Star rating component                                             */
/* ------------------------------------------------------------------ */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(rating)
              ? 'fill-amber-400 text-amber-400'
              : i < rating
                ? 'fill-amber-400/50 text-amber-400'
                : 'fill-muted text-muted'
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export function PasarLangsung() {
  const { toast } = useToast()

  /* ---- state ---- */
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null)
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set())
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [checkoutProduct, setCheckoutProduct] = useState<MarketplaceProduct | null>(null)
  const [checkoutQty, setCheckoutQty] = useState(1)
  const [checkoutAddress, setCheckoutAddress] = useState('')
  const [checkoutPhone, setCheckoutPhone] = useState('')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('transfer')
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  const loadProducts = async () => {
    setIsLoadingProducts(true)

    const { data, error } = await supabase
      .from('products')
      .select('id,name,description,price,unit,stock,category,province,city,status,image_url,seller_id,profiles(full_name,avatar_url)')
      .eq('status', 'aktif')
      .order('created_at', { ascending: false })

    if (!error) {
      const mapped = (data ?? []).map((row: any) => ({
        id: row.id,
        sellerId: row.seller_id,
        name: row.name,
        description: row.description ?? '',
        price: row.price,
        unit: row.unit ?? 'kg',
        stock: row.stock ?? 0,
        category: row.category ?? 'Lainnya',
        province: row.province ?? '-',
        city: row.city ?? '-',
        image: row.image_url?.[0] ?? '',
        status: row.status ?? 'aktif',
        farmerName: row.profiles?.full_name ?? 'Penjual',
        farmerAvatar: row.profiles?.avatar_url ?? '',
      }))

      setProducts(mapped)
    }

    setIsLoadingProducts(false)
  }

  React.useEffect(() => {
    loadProducts()
  }, [])

  /* ---- derived ---- */
  const categoryOptions = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category.trim()))).filter(
      (value) => value && value !== 'Semua',
    )
    return ['Semua', ...list]
  }, [products])

  React.useEffect(() => {
    if (!categoryOptions.includes(activeCategory)) {
      setActiveCategory('Semua')
    }
  }, [activeCategory, categoryOptions])

  const filteredProducts = useMemo(() => {
    let result = products
    if (activeCategory !== 'Semua') {
      result = result.filter((p) => p.category.trim() === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.farmerName.toLowerCase().includes(q) ||
          p.province.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    }
    return result
  }, [activeCategory, searchQuery, products])

  const toggleSave = (id: string) => {
    setSavedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCheckout = (product: MarketplaceProduct) => {
    setCheckoutProduct(product)
    setCheckoutQty(1)
    setCheckoutAddress('')
    setCheckoutPhone('')
    setCheckoutNotes('')
    setCheckoutPaymentMethod('transfer')
  }

  const submitOrder = async () => {
    if (!checkoutProduct) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      toast({
        title: 'Perlu login',
        description: 'Silakan login dulu untuk melakukan pemesanan.',
        variant: 'destructive',
      })
      return
    }

    if (!checkoutAddress.trim()) {
      toast({
        title: 'Alamat wajib',
        description: 'Silakan isi alamat pengiriman.',
        variant: 'destructive',
      })
      return
    }

    if (!checkoutPhone.trim()) {
      toast({
        title: 'Nomor HP wajib',
        description: 'Silakan isi nomor HP penerima.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingOrder(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productId: checkoutProduct.id,
          quantity: checkoutQty,
          buyerAddress: checkoutAddress,
          buyerPhone: checkoutPhone,
          notes: checkoutNotes.trim() || undefined,
          paymentMethod: checkoutPaymentMethod,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        orderId?: string
        error?: string
      }

      if (!res.ok) {
        toast({
          title: 'Gagal membuat pesanan',
          description: data.error || 'Coba lagi nanti.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Pesanan dibuat',
        description: `Order ID: ${data.orderId?.slice(0, 8) ?? '-'}`,
      })

      setCheckoutProduct(null)
      await loadProducts()
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ---- HEADER ---- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">PasarLangsung</h1>
            <p className="text-sm text-muted-foreground">Marketplace Petani-Pembeli Langsung</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline">SDG 2: Zero Hunger</Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">|</span>
          <p className="text-xs text-muted-foreground">
            156 produk aktif &middot; 89 petani terdaftar &middot; Rp 450jt+ transaksi bulanan
          </p>
        </div>
      </motion.div>

      <Separator className="mb-8" />

      {/* ---- SEARCH & FILTER ---- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8 space-y-4"
      >
        {/* Search */}
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk, petani, atau daerah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-card border-border/60 shadow-sm"
          />
        </div>

        {/* Category Tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v)}
        >
          <TabsList className="flex h-auto flex-wrap gap-1 p-1 bg-muted/60 rounded-xl">
            {categoryOptions.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">{categoryEmoji[cat] ?? '🌾'}</span>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* ---- RESULTS COUNT ---- */}

      {/* ---- PRODUCT GRID ---- */}
      {filteredProducts.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={activeCategory + searchQuery}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProducts.map((product) => {
            const rating = productRatings[product.id] ?? 4.5
            const isSaved = savedProducts.has(product.id)
            const gradient = categoryGradients[product.category] ?? 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'

            return (
              <motion.div key={product.id} variants={cardVariants}>
                <Card className="group h-full overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  {/* Image area */}
                  <div
                    className={`relative flex h-44 items-center justify-center overflow-hidden rounded-t-xl ${
                      product.image ? 'bg-slate-200/80 dark:bg-slate-800/70' : `bg-gradient-to-br ${gradient}`
                    } cursor-pointer`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl drop-shadow-sm">
                        {categoryEmoji[product.category] ?? '🌾'}
                      </span>
                    )}

                    {product.image && <div className="absolute inset-0 bg-black/10" />}

                    {/* Status badge */}
                    <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px]">
                      {product.status === 'aktif' ? '● Tersedia' : product.status}
                    </Badge>

                    {/* Save button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm hover:bg-white dark:hover:bg-black/60"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSave(product.id)
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                        }`}
                      />
                    </Button>

                    {/* Stock indicator */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur-sm">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          product.stock > 100
                            ? 'bg-green-400'
                            : product.stock > 20
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                        }`}
                      />
                      <span className="text-[10px] font-medium text-white">
                        Stok {product.stock.toLocaleString('id-ID')} {product.unit}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 space-y-3">
                    {/* Name & Category */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="line-clamp-1 text-sm font-semibold leading-snug cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.name}
                        </h3>
                      </div>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {categoryEmoji[product.category] ?? '🌾'} {product.category}
                      </Badge>
                    </div>

                    {/* Farmer */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {product.farmerName.charAt(0)}
                      </div>
                      <span className="text-xs text-muted-foreground">{product.farmerName}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {product.city}, {product.province}
                      </span>
                    </div>

                    {/* Rating */}
                    <StarRating rating={rating} />

                    {/* Price & Action */}
                    <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/40">
                      <div>
                        <p className="text-lg font-bold text-primary leading-tight">
                          {formatRupiah(product.price)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">per {product.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProduct(product)
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCheckout(product)
                          }}
                          disabled={product.stock <= 0}
                        >
                          <Package className="h-3.5 w-3.5" />
                          Beli
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20"
        >
          <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">
            {isLoadingProducts ? 'Memuat produk...' : 'Produk tidak ditemukan'}
          </p>
          {!isLoadingProducts && (
            <p className="text-sm text-muted-foreground/70 mt-1">
              Coba ubah kata kunci atau pilih kategori lain
            </p>
          )}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/*  PRODUCT DETAIL DIALOG                                        */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedProduct && (
          <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
            <DialogContent className="sm:max-w-lg gap-0 overflow-hidden p-0">
              {/* Dialog image header */}
              <div
                className={`relative flex h-48 items-center justify-center overflow-hidden ${
                  selectedProduct.image
                    ? 'bg-slate-200/80 dark:bg-slate-800/70'
                    : `bg-gradient-to-br ${categoryGradients[selectedProduct.category] ?? 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'}`
                }`}
              >
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-7xl drop-shadow-sm">
                    {categoryEmoji[selectedProduct.category] ?? '🌾'}
                  </span>
                )}
                {selectedProduct.image && <div className="absolute inset-0 bg-black/10" />}
                <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground text-xs">
                  {selectedProduct.status === 'aktif' ? '● Tersedia' : selectedProduct.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm"
                  onClick={() => toggleSave(selectedProduct.id)}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      savedProducts.has(selectedProduct.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              </div>

              <div className="px-6 pt-5 pb-6 space-y-5">
                <DialogHeader className="space-y-2 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <DialogTitle className="text-xl leading-snug">{selectedProduct.name}</DialogTitle>
                      <DialogDescription className="mt-1 line-clamp-3">
                        {selectedProduct.description}
                      </DialogDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {selectedProduct.category}
                    </Badge>
                  </div>
                </DialogHeader>

                {/* Price */}
                <div className="flex items-end gap-3 rounded-xl bg-primary/5 p-4">
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(selectedProduct.price)}
                  </p>
                  <p className="mb-0.5 text-sm text-muted-foreground">per {selectedProduct.unit}</p>
                  <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    Stok: {selectedProduct.stock.toLocaleString('id-ID')} {selectedProduct.unit}
                  </div>
                </div>

                {/* Farmer info */}
                <div className="flex items-center gap-3 rounded-xl border border-border/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {selectedProduct.farmerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{selectedProduct.farmerName}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {selectedProduct.city}, {selectedProduct.province}
                      </span>
                    </div>
                  </div>
                  <StarRating rating={productRatings[selectedProduct.id] ?? 4.5} />
                </div>

                <Separator />

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 gap-2 h-11 rounded-xl font-medium">
                    <MessageCircle className="h-4 w-4" />
                    Hubungi Petani
                  </Button>
                  <Button variant="outline" className="gap-2 h-11 rounded-xl font-medium px-5">
                    <Heart className="h-4 w-4" />
                    Simpan
                  </Button>
                </div>

                {/* Trust indicators in dialog */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-primary/60" /> Transaksi terjamin
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-primary/60" /> Pengiriman dari petani
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-primary/60" /> Rating terverifikasi
                  </span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <Dialog
        open={!!checkoutProduct}
        onOpenChange={(open) => {
          if (!open) setCheckoutProduct(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              {checkoutProduct
                ? `Pesan ${checkoutProduct.name} dari ${checkoutProduct.farmerName}`
                : 'Lengkapi detail pesanan.'}
            </DialogDescription>
          </DialogHeader>

          {checkoutProduct && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{checkoutProduct.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRupiah(checkoutProduct.price)} / {checkoutProduct.unit}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Stok: {checkoutProduct.stock.toLocaleString('id-ID')} {checkoutProduct.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {formatRupiah(checkoutProduct.price * checkoutQty)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Qty: {checkoutQty} {checkoutProduct.unit}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="checkout-qty">Jumlah</Label>
                  <Input
                    id="checkout-qty"
                    type="number"
                    min={1}
                    max={Math.max(1, checkoutProduct.stock)}
                    value={checkoutQty}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      const max = Math.max(1, checkoutProduct.stock)
                      setCheckoutQty(
                        Number.isFinite(n)
                          ? Math.min(Math.max(1, Math.floor(n)), max)
                          : 1,
                      )
                    }}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Metode bayar</Label>
                  <Select
                    value={checkoutPaymentMethod}
                    onValueChange={(v) => setCheckoutPaymentMethod(v)}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="cod">COD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout-address">Alamat pengiriman</Label>
                <Textarea
                  id="checkout-address"
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  placeholder="Tulis alamat lengkap (jalan, RT/RW, kecamatan, kota, provinsi)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout-phone">Nomor HP</Label>
                <Input
                  id="checkout-phone"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout-notes">Catatan (opsional)</Label>
                <Textarea
                  id="checkout-notes"
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Contoh: Tolong kirim pagi hari"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCheckoutProduct(null)}
                  disabled={isSubmittingOrder}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={() => void submitOrder()}
                  disabled={
                    isSubmittingOrder ||
                    checkoutQty < 1 ||
                    checkoutQty > checkoutProduct.stock
                  }
                  className="gap-2"
                >
                  {isSubmittingOrder ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Truck className="h-4 w-4" />
                      Pesan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
