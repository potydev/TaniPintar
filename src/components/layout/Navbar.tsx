'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home, TrendingUp, Store, GraduationCap, Bot, LayoutDashboard,
  Menu, X, Bell, Moon, Sun, Sprout, LogIn, LogOut, User, ChevronDown
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAppStore, type PageId } from '@/lib/store'
import { navItems } from '@/lib/constants'

const iconMap: Record<string, React.ElementType> = {
  Home, TrendingUp, Store, GraduationCap, Bot, LayoutDashboard
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  seller: 'Penjual',
  user: 'Pembeli',
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  seller: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
}

interface NavbarProps {
  onNavigate: (page: PageId) => void
}

export function Navbar({ onNavigate }: NavbarProps) {
  const { currentPage, isMobileMenuOpen, setMobileMenuOpen, notifications, isLoggedIn, userProfile, userRole, setShowLoginModal, logout, setNotifications } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    setIsLoggingOut(false)
  }

  // Avatar initials
  const getInitials = (name: string | null) => {
    if (!name) return '?'
    const parts = name.split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-foreground">
                Tani<span className="text-primary">Pintar</span>
              </span>
              <span className="hidden text-[10px] leading-none text-muted-foreground sm:block">
                Petani Cerdas Indonesia
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon] || Home
              const isActive = currentPage === item.id
              // Hide dashboard for non-logged-in users
              if (item.id === 'dashboard' && !isLoggedIn) return null
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-lg border-2 border-primary/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {/* Notifications - only when logged in */}
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNotifications(0)
                  onNavigate('dashboard')
                }}
                className="relative h-9 w-9"
              >
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] text-white">
                    {notifications}
                  </Badge>
                )}
              </Button>
            )}

            {/* Login Button / User Menu */}
            {isLoggedIn && userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 md:px-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {getInitials(userProfile.full_name)}
                    </div>
                    <div className="hidden flex-col items-start md:flex">
                      <span className="text-xs font-medium leading-tight">
                        {userProfile.full_name || userProfile.email}
                      </span>
                      {userRole && (
                        <Badge className={`mt-0.5 px-1.5 py-0 text-[10px] leading-none ${roleColors[userRole]}`}>
                          {roleLabels[userRole]}
                        </Badge>
                      )}
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userProfile.full_name || 'Pengguna'}</p>
                    <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                    {userRole && (
                      <Badge className={`mt-1 ${roleColors[userRole]}`}>
                        {roleLabels[userRole]}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('dashboard')} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('pasar-langsung')} className="cursor-pointer">
                    <Store className="mr-2 h-4 w-4" />
                    PasarLangsung
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? 'Keluar...' : 'Keluar'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setShowLoginModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium h-9"
                size="sm"
              >
                <LogIn className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Masuk</span>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon] || Home
                const isActive = currentPage === item.id
                if (item.id === 'dashboard' && !isLoggedIn) return null
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
              {!isLoggedIn && (
                <button
                  onClick={() => { setMobileMenuOpen(false); setShowLoginModal(true) }}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium bg-emerald-600 text-white mt-2"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Masuk / Daftar</span>
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
