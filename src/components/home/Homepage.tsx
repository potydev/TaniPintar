'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendingUp, Users, Shield, Sprout, BarChart3, Zap, Globe, ChevronDown, GraduationCap } from 'lucide-react'
import { mockCommodities } from '@/lib/constants'
import type { PageId } from '@/lib/store'

interface HomepageProps {
  onNavigate: (page: PageId) => void
}

export function Homepage({ onNavigate }: HomepageProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-start"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                <Sprout className="mr-1 h-3 w-3" />
                Mendukung SDGs Indonesia
              </Badge>

              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Petani Cerdas,{' '}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Harga Adil
                </span>
                , Panen Maksimal
              </h1>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                Platform digital pertanian pertama di Indonesia yang menghubungkan petani dengan data harga real-time, 
                marketplace langsung, dan pendidikan pertanian interaktif. Satu aplikasi untuk semua kebutuhan pertanian Anda.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => onNavigate('pasar-pintar')} className="gap-2 bg-primary hover:bg-primary/90">
                  Mulai Sekarang — Gratis
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => onNavigate('akademi-tani')} className="gap-2">
                  Belajar Pertanian
                  <GraduationCap className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  { value: '12.000+', label: 'Petani Terbantu' },
                  { value: 'Rp 2.3M', label: 'Rata-rata Pendapatan Naik' },
                  { value: '34', label: 'Provinsi Terjangkau' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right - Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 blur-2xl" />
                <img
                  src="/hero-bg.png"
                  alt="TaniPintar - Smart Agriculture Indonesia"
                  className="relative rounded-2xl shadow-2xl"
                />
                {/* Floating Stats Card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-6 -left-6 rounded-xl bg-card p-4 shadow-xl ring-1 ring-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Harga Cabai Hari Ini</p>
                      <p className="text-lg font-bold text-green-600">Rp 52.000/kg</p>
                    </div>
                  </div>
                </motion.div>
                {/* Floating Users Card */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-4 top-8 rounded-xl bg-card p-4 shadow-xl ring-1 ring-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Petani Aktif</p>
                      <p className="text-lg font-bold">+6 minggu ini</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex justify-center pb-4">
          <button onClick={() => scrollToSection('features')} className="animate-bounce text-muted-foreground hover:text-primary">
            <ChevronDown className="h-6 w-6" />
          </button>
        </div>
      </section>

      {/* Live Price Ticker */}
      <section className="border-y border-border/40 bg-card/30 py-3">
        <div className="overflow-hidden">
          <div className="animate-ticker flex gap-8 whitespace-nowrap">
            {[...mockCommodities, ...mockCommodities].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="font-semibold">Rp {item.price.toLocaleString('id-ID')}</span>
                <span className={item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                  {item.change > 0 ? '▲' : item.change < 0 ? '▼' : '—'} {item.changePercent > 0 ? '+' : ''}{item.changePercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Badge variant="outline" className="mb-4">
            <Zap className="mr-1 h-3 w-3" />
            Fitur Unggulan
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Semua yang Petani Butuhkan,{' '}
            <span className="text-primary">dalam Satu Platform</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            TaniPintar mengintegrasikan informasi harga, marketplace, pendidikan, dan AI dalam satu ekosistem 
            yang dirancang khusus untuk petani Indonesia.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: 'PasarPintar',
              desc: 'Dashboard harga komoditas real-time dari 34 provinsi Indonesia. Prediksi harga dengan AI dan smart alerts.',
              tag: 'SDG 2',
              color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
              onClick: () => onNavigate('pasar-pintar'),
            },
            {
              icon: Globe,
              title: 'PasarLangsung',
              desc: 'Marketplace petani-ke-pembeli tanpa perantara. Jual hasil panen langsung dengan harga yang lebih adil.',
              tag: 'SDG 2',
              color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
              onClick: () => onNavigate('pasar-langsung'),
            },
            {
              icon: Shield,
              title: 'AkademiTani',
              desc: 'Modul belajar interaktif dengan quiz, gamifikasi, leaderboard, dan sertifikat digital untuk petani.',
              tag: 'SDG 4',
              color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
              onClick: () => onNavigate('akademi-tani'),
            },
            {
              icon: '🤖' as any,
              title: 'TaniBot',
              desc: 'Asisten AI cerdas yang siap membantu diagnosa penyakit tanaman, rekomendasi budidaya, dan konsultasi.',
              tag: 'SDG 1+2',
              color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
              onClick: () => onNavigate('tanibot'),
              isEmoji: true,
            },
            {
              icon: TrendingUp,
              title: 'Margin Gap Calculator',
              desc: 'Hitung selisih harga petani vs konsumen secara transparan. Ketahui margin perantara yang selama ini tersembunyi.',
              tag: 'SDG 2',
              color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
              onClick: () => onNavigate('pasar-pintar'),
            },
            {
              icon: Users,
              title: 'Komunitas Petani',
              desc: 'Terhubung dengan 12.000+ petani dari seluruh Indonesia. Berbagi pengalaman, tips, dan peluang bisnis.',
              tag: 'SDG 1',
              color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20',
              onClick: () => onNavigate('dashboard'),
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={feature.onClick}
              className="group cursor-pointer rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                  {feature.isEmoji ? (
                    <span className="text-2xl">{feature.title === 'TaniBot' ? '🤖' : ''}</span>
                  ) : (
                    <feature.icon className="h-6 w-6" />
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">{feature.tag}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.desc}
              </p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Jelajahi <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SDG Section */}
      <section className="border-y border-border/40 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-8 lg:grid-cols-2 lg:items-center"
          >
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Sustainable Development Goals
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Mendukung SDGs Indonesia
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                TaniPintar berkontribusi aktif pada pencapaian Tujuan Pembangunan Berkelanjutan PBB melalui 
                pemanfaatan teknologi digital untuk pemberdayaan petani dan pertumbuhan ekonomi daerah.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  sdg: 'SDG 1: No Poverty',
                  title: 'Zero Kemiskinan',
                  desc: 'Membantu petani meningkatkan pendapatan rata-rata Rp 2.3 juta per bulan melalui akses pasar langsung dan informasi harga yang adil.',
                  color: 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800',
                  badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                },
                {
                  sdg: 'SDG 2: Zero Hunger',
                  title: 'Zero Kelaparan',
                  desc: 'Mengoptimalkan rantai pasok pangan dengan menghubungkan petani langsung ke pembeli, mengurangi food waste dan meningkatkan ketahanan pangan nasional.',
                  color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800',
                  badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                },
                {
                  sdg: 'SDG 4: Quality Education',
                  title: 'Pendidikan Berkualitas',
                  desc: 'Menyediakan modul pembelajaran pertanian interaktif dengan gamifikasi dan sertifikat digital, memungkinkan petani belajar kapan saja dan di mana saja.',
                  color: 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800',
                  badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                },
              ].map((item) => (
                <div key={item.sdg} className={`rounded-xl border p-4 ${item.color}`}>
                  <div className="flex items-center gap-3">
                    <Badge className={item.badgeColor}>{item.sdg}</Badge>
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground sm:p-16"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">
            Siap Menjadi Petani Lebih Cerdas?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Bergabung dengan 12.000+ petani Indonesia yang sudah menggunakan TaniPintar. 
            Gratis, tanpa biaya tersembunyi. Daftar sekarang dan mulai perjalanan Anda.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => onNavigate('dashboard')} className="gap-2">
              Daftar Gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

function GraduationCapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/>
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>
  )
}
