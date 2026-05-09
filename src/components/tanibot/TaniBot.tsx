'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  Bot,
  Send,
  Mic,
  MicOff,
  Stethoscope,
  Sprout,
  MessageCircle,
  Sparkles,
  Leaf,
  Bug,
  CloudSun,
  RefreshCw,
  Lightbulb,
  TrendingUp,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FeatureCard {
  title: string
  description: string
  icon: React.ReactNode
  color: string
  borderColor: string
  bgColor: string
  iconBg: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Selamat datang di TaniBot! Saya asisten AI Anda untuk semua pertanyaan seputar pertanian. Silakan tanyakan tentang budidaya, hama & penyakit, harga komoditas, atau tips pertanian.',
  timestamp: new Date(),
}

const SUGGESTED_QUESTIONS: string[] = [
  'Bagaimana cara mengatasi hama wereng pada padi?',
  'Kapan waktu terbaik menanam cabai?',
  'Analisis harga beras minggu ini',
  'Tips meningkatkan hasil panen jagung',
]

const DEFAULT_RESPONSE =
  'Terima kasih atas pertanyaan Anda. Sebagai TaniBot, saya sarankan untuk berkonsultasi dengan penyuluh pertanian lokal di wilayah Anda untuk informasi yang lebih spesifik. Anda juga dapat mengakses modul pembelajaran di AkademiTani untuk mempelajari teknik budidaya terkini.'

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: 'Diagnosa Penyakit',
    description: 'Identifikasi penyakit tanaman dari gejala',
    icon: <Stethoscope className="h-5 w-5" />,
    color: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-900',
    bgColor: 'bg-green-50 dark:bg-green-950/40',
    iconBg: 'bg-green-100 dark:bg-green-900/60',
  },
  {
    title: 'Rekomendasi Budidaya',
    description: 'Saran tanam berdasarkan kondisi lahan Anda',
    icon: <Sprout className="h-5 w-5" />,
    color: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-900',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
  },
  {
    title: 'Konsultasi Harga',
    description: 'Analisis harga dan waktu jual terbaik',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-900',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/60',
  },
]

// ---------------------------------------------------------------------------
// Keyword-based AI response helper
// ---------------------------------------------------------------------------

function generateBotResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase()

  if (msg.includes('wereng') || msg.includes('hama padi') || msg.includes('hama')) {
    return `Hama wereng batang cokelat merupakan salah satu hama utama pada tanaman padi. Berikut beberapa langkah pengendalian:\n\n1. **Pengendalian mekanis** – Gunakan perangkap cahaya (light trap) untuk memantau populasi wereng.\n2. **Pengendalian hayati** – Pelepasan musuh alami seperti predator *Cyrtorhinus lividipennis*.\n3. **Varietas tahan hama** – Gunakan varietas padi tahan wereng seperti Inpari 32, Inpari 42, atau Ciherang.\n4. **Pengendalian kimiawi** – Aplikasi insektisida sesuai rekomendasi jika serangan melampaui ambang kendali (ETL).\n\nPengamatan rutin di sawah sangat penting untuk deteksi dini. Silakan tanyakan lebih lanjut jika membutuhkan informasi detail!`
  }

  if (msg.includes('cabai') || msg.includes('menanam') || msg.includes('waktu')) {
    return `Waktu terbaik menanam cabai bergantung pada kondisi iklim dan dataran:\n\n**Dataran Rendah (0–400 m dpl):**\n- Musim hujan: April – Juni\n- Musim kemarau: Oktober – Desember\n\n**Dataran Tinggi (>400 m dpl):**\n- Sepanjang tahun dengan suhu 24–28°C\n\n**Tips penting:**\n- Persiapkan persemaian 30–35 hari sebelum tanam.\n- Pilih lokasi dengan drainase baik dan pH tanah 5,5–6,5.\n- Gunakan mulsa plastik perak untuk menjaga kelembapan dan menekan gulma.\n\nApakah Anda ingin tahu lebih lanjut tentang teknik budidaya cabai?`
  }

  if (msg.includes('harga') || msg.includes('beras') || msg.includes('jual') || msg.includes('analisis')) {
    return `Berikut analisis harga beras minggu ini berdasarkan data BPS & Tokopedia:\n\n🌾 **Harga Beras Premium:** Rp 14.500 – Rp 16.000/kg\n🌾 **Harga Beras Medium:** Rp 11.000 – Rp 13.000/kg\n\n**Tren:** Harga relatif stabil minggu ini dengan sedikit kenaikan di beberapa daerah akibat musim paceklik.\n\n**Waktu jual terbaik:**\n- Jika panen raya: Tunda penjualan 2–4 minggu saat stok melimpah.\n- Jika musim paceklik: Jual segera saat harga sedang tinggi.\n\n💡 Gunakan fitur **PasarPintar** untuk analisis harga real-time di wilayah Anda!`
  }

  if (msg.includes('jagung') || msg.includes('panen') || msg.includes('hasil') || msg.includes('tips')) {
    return `Berikut tips untuk meningkatkan hasil panen jagung:\n\n1. **Pemilihan varietas unggul** – Pilih hibrida seperti BISI-18, NK-22, atau Pioneer P-21.\n2. **Pengolahan tanah optimal** – Olah tanah sedalam 25–30 cm untuk pengembangan akar maksimal.\n3. **Pemupukan berimbang** – Berikan pupuk NPK sesuai rekomendasi (urea 350 kg/ha, SP-36 100 kg/ha, KCl 100 kg/ha).\n4. **Penanaman jajar legowo** – Jarak tanam 75×25 cm (2:1) untuk peningkatan populasi.\n5. **Pengendalian OPT** – Lakukan pemantauan rutin dan pengendalian terpadu.\n6. **Irigasi cukup** – Jagung membutuhkan air 450–650 mm selama masa pertumbuhan.\n\nDengan menerapkan tips di atas, hasil panen bisa meningkat 20–40% dibanding cara konvensional!`
  }

  if (msg.includes('penyakit') || msg.includes('diagnosa') || msg.includes('gejala') || msg.includes('kuning') || msg.includes('busuk')) {
    return `Untuk mendiagnosa penyakit tanaman, saya perlu mengetahui gejala yang muncul. Berikut beberapa penyakit umum beserta ciri-cirinya:\n\n🟢 **Blast pada padi** – Bercak berlian berbentuk elips pada daun.\n🟢 **Busuk batang** – Batang membusuk dekat pangkal tanaman.\n🟢 **Kerdil virus** – Tanaman kerdil, daun bergaris kuning.\n\nSilakan deskripsikan gejala yang Anda temukan (warna bercak, bagian tanaman yang terdampak, kondisi lingkungan) agar saya bisa membantu identifikasi lebih akurat.\n\nAnda juga bisa menggunakan fitur **Diagnosa Penyakit** di atas untuk analisis lebih detail!`
  }

  if (msg.includes('cuaca') || msg.includes('iklim') || msg.includes('musim')) {
    return `Informasi cuaca sangat penting untuk perencanaan pertanian:\n\n☀️ **Prediksi musim kemarau:** Pertimbangkan tanaman tahan kekeringan (jagung, kedelai, kacang tanah).\n🌧️ **Prediksi musim hujan:** Waktu tepat untuk padi sawah dan sayuran daun.\n\n**Tips menghadapi perubahan iklim:**\n- Gunakan sistem irigasi tetes (drip irrigation) untuk efisiensi air.\n- Terapkan konservasi tanah dengan mulsa dan cover crop.\n- Perhatikan prakiraan BMKG sebelum aktivitas penanaman.\n\nGunakan BMKG atau aplikasi cuaca untuk prakiraan 14 hari ke depan di wilayah Anda.`
  }

  return DEFAULT_RESPONSE
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const messageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
}

const typingDotVariants = {
  initial: { opacity: 0.3, y: 0 },
  animate: { opacity: 1, y: -4 },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <motion.div
      className="flex items-start gap-3 max-w-[80%]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-600">
        <Image
          src="/tanibot-avatar.png"
          alt="TaniBot"
          fill
          className="object-cover"
          sizes="32px"
        />
      </div>
      <div className="rounded-2xl rounded-tl-sm border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-2 w-2 rounded-full bg-green-500"
              variants={typingDotVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function FeatureCardSection() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {FEATURE_CARDS.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * idx, duration: 0.4 }}
        >
          <Card
            className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border ${card.borderColor} ${card.bgColor}`}
          >
            <CardContent className="flex items-start gap-3 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.color}`}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${card.color}`}>{card.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function SuggestedQuestionsSection({
  questions,
  onSelect,
}: {
  questions: string[]
  onSelect: (q: string) => void
}) {
  const iconMap = [Bug, CloudSun, TrendingUp, Sparkles]

  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question, idx) => {
        const Icon = iconMap[idx % iconMap.length]
        return (
          <motion.div
            key={question}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + idx * 0.08, duration: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full border-green-200 bg-green-50/50 text-green-800 hover:bg-green-100 hover:text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-900/40 dark:hover:text-green-200"
              onClick={() => onSelect(question)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{question}</span>
              <span className="inline sm:hidden text-xs">
                {question.length > 30 ? question.slice(0, 30) + '...' : question}
              </span>
            </Button>
          </motion.div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TaniBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)

  const scrollEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ---- Auto-scroll to bottom on new messages / typing ----
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ---- Send message handler ----
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isTyping) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputMessage('')
      setIsTyping(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: trimmed }),
        })

        const json = (await res.json().catch(() => ({}))) as {
          message?: string
          error?: string
        }

        if (!res.ok) {
          throw new Error(json.error || 'Gagal mendapatkan respons AI')
        }

        const botResponse: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: json.message || DEFAULT_RESPONSE,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botResponse])
      } catch (error) {
        console.error('TaniBot chat error:', error)
        const fallbackResponse: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: generateBotResponse(trimmed),
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, fallbackResponse])
      } finally {
        setIsTyping(false)
        inputRef.current?.focus()
      }
    },
    [isTyping],
  )

  // ---- Handle form submit ----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  // ---- Handle keyboard shortcut ----
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  // ---- Format timestamp ----
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  // ---- Render message content with markdown-like bold ----
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      return (
        <React.Fragment key={i}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={j} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              )
            }
            return <React.Fragment key={j}>{part}</React.Fragment>
          })}
          {i < content.split('\n').length - 1 && <br />}
        </React.Fragment>
      )
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-10">
      {/* ---- Header ---- */}
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-lg shadow-green-500/20">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-green-800 dark:text-green-300">
                TaniBot
              </h1>
              <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800 text-[10px] px-1.5">
                SDG 1+2
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Asisten AI Pertanian Cerdas
            </p>
          </div>
        </div>
      </motion.div>

      {/* ---- Feature Cards ---- */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <FeatureCardSection />
      </motion.div>

      {/* ---- Chat Card ---- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <Card className="overflow-hidden border-green-200/60 dark:border-green-900/40 shadow-lg">
          {/* Chat header bar */}
          <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 dark:from-green-950/30 dark:to-emerald-950/30">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-600">
                <Image
                  src="/tanibot-avatar.png"
                  alt="TaniBot"
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base text-green-800 dark:text-green-300">
                    TaniBot
                  </CardTitle>
                  <span className="flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                </div>
                <p className="text-xs text-green-700/70 dark:text-green-400/60">
                  Online &bull; Siap membantu pertanyaan Anda
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40"
                  title="Bersihkan chat"
                  onClick={() => setMessages([WELCOME_MESSAGE])}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-0 p-0">
            {/* ---- Messages area ---- */}
            <ScrollArea className="h-[400px] md:h-[480px]">
              <div className="flex flex-col gap-4 px-4 py-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`flex items-start gap-3 max-w-[85%] ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                      variants={messageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      {/* Avatar */}
                      {msg.role === 'assistant' && (
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-600 shadow-sm">
                          <Image
                            src="/tanibot-avatar.png"
                            alt="TaniBot"
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`group relative rounded-2xl px-4 py-3 shadow-sm ${
                          msg.role === 'user'
                            ? 'rounded-tr-sm bg-green-600 text-white'
                            : 'rounded-tl-sm border bg-card text-foreground'
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {renderContent(msg.content)}
                        </div>
                        <p
                          className={`mt-1.5 text-[10px] ${
                            msg.role === 'user'
                              ? 'text-green-200'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && <TypingIndicator />}
                </AnimatePresence>

                <div ref={scrollEndRef} />
              </div>
            </ScrollArea>

            {/* ---- Suggested Questions ---- */}
            {messages.length <= 1 && !isTyping && (
              <motion.div
                className="border-t bg-muted/30 px-4 py-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Pertanyaan populer
                  </span>
                </div>
                <SuggestedQuestionsSection
                  questions={SUGGESTED_QUESTIONS}
                  onSelect={sendMessage}
                />
              </motion.div>
            )}

            {/* ---- Input area ---- */}
            <div className="border-t bg-gradient-to-r from-green-50/50 to-emerald-50/50 px-4 py-3 dark:from-green-950/20 dark:to-emerald-950/20">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                {/* Mic toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 shrink-0 transition-colors ${
                    isMicActive
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400'
                      : 'text-muted-foreground hover:text-green-600 hover:bg-green-100 dark:hover:text-green-400 dark:hover:bg-green-900/40'
                  }`}
                  title={isMicActive ? 'Matikan mikrofon' : 'Aktifkan mikrofon'}
                  onClick={() => setIsMicActive((v) => !v)}
                >
                  {isMicActive ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>

                {/* Text input */}
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Ketik pertanyaan pertanian Anda..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  className="flex-1 border-green-200 bg-background focus-visible:ring-green-500/30 dark:border-green-900 dark:focus-visible:ring-green-500/30"
                />

                {/* Send button */}
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputMessage.trim() || isTyping}
                  className="h-9 w-9 shrink-0 bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:bg-green-600"
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Kirim</span>
                </Button>
              </form>

              <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Leaf className="h-3 w-3 text-green-500" />
                <span>
                  Ditenagai AI &bull; TaniPintar v1.0 &bull;{' '}
                  <MessageCircle className="inline h-3 w-3 text-muted-foreground" />{' '}
                  Gratis untuk petani Indonesia
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
