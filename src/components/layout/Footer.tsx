'use client'

import React from 'react'
import { Sprout, Heart, Github, Mail, ExternalLink } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sprout className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">
                  Tani<span className="text-primary">Pintar</span>
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Platform digital pertanian Indonesia untuk petani cerdas. Mendukung SDGs Pendidikan Berkualitas dan Pertumbuhan Ekonomi.
            </p>
            <div className="mt-4 flex gap-3">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                SDG 1
              </div>
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                SDG 2
              </div>
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                SDG 4
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Platform</h3>
            <ul className="mt-3 space-y-2">
              {['PasarPintar', 'PasarLangsung', 'AkademiTani', 'TaniBot'].map((item) => (
                <li key={item}>
                  <span className="cursor-default text-sm text-muted-foreground transition-colors hover:text-primary">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Sumber Data</h3>
            <ul className="mt-3 space-y-2">
              {[
                { label: 'Badan Pangan RI', url: 'https://badanpangan.go.id/' },
                { label: 'Bank Indonesia', url: 'https://www.bi.go.id/id/default.aspx' },
                { label: 'BPS Indonesia', url: 'https://www.bps.go.id/id' },
                { label: 'BMKG', url: 'https://www.bmkg.go.id/' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.url} className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
                    {item.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Hubungi Kami</h3>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                tanipintar@gmail.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Github className="h-4 w-4 text-primary" />
                potydev
              </li>
            </ul>
            <div className="mt-4 rounded-lg bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                Dibuat untuk petani Indonesia
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Kompetisi Web Development 2026
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 TaniPintar. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Kebijakan Privasi</span>
            <span>Syarat & Ketentuan</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
