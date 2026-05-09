'use client'

import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Homepage } from '@/components/home/Homepage'
import { PasarPintar } from '@/components/pasar-pintar/PasarPintar'
import { PasarLangsung } from '@/components/pasar-langsung/PasarLangsung'
import { AkademiTani } from '@/components/akademi-tani/AkademiTani'
import { TaniBot } from '@/components/tanibot/TaniBot'
import { FarmerDashboard } from '@/components/dashboard/FarmerDashboard'
import { useAppStore, type PageId } from '@/lib/store'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const pageTransition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
}

export default function Home() {
  const { currentPage, setCurrentPage } = useAppStore()

  // Connect current page to URL hash so refresh keeps the same page.
  useEffect(() => {
    const validPages: PageId[] = [
      'home',
      'pasar-pintar',
      'pasar-langsung',
      'akademi-tani',
      'tanibot',
      'dashboard',
    ]

    const initialHash = window.location.hash.replace('#', '') as PageId
    if (initialHash && validPages.includes(initialHash)) {
      setCurrentPage(initialHash)
    }

    const handleHashChange = () => {
      const nextPage = window.location.hash.replace('#', '') as PageId
      if (nextPage && validPages.includes(nextPage)) {
        setCurrentPage(nextPage)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [setCurrentPage])

  useEffect(() => {
    if (window.location.hash.replace('#', '') !== currentPage) {
      window.history.replaceState(null, '', `#${currentPage}`)
    }
  }, [currentPage])

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentPage('home')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setCurrentPage])

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Homepage onNavigate={setCurrentPage} />
      case 'pasar-pintar':
        return <PasarPintar />
      case 'pasar-langsung':
        return <PasarLangsung />
      case 'akademi-tani':
        return <AkademiTani />
      case 'tanibot':
        return <TaniBot />
      case 'dashboard':
        return <FarmerDashboard />
      default:
        return <Homepage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onNavigate={setCurrentPage} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
