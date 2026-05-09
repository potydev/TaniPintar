import { create } from 'zustand'
import { supabase, type UserProfile } from './supabase'

export type PageId = 'home' | 'pasar-pintar' | 'pasar-langsung' | 'akademi-tani' | 'tanibot' | 'dashboard'

interface AppState {
  currentPage: PageId
  setCurrentPage: (page: PageId) => void
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  notifications: number
  setNotifications: (count: number) => void

  // Auth state
  isLoggedIn: boolean
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
  userProfile: UserProfile | null
  userRole: 'user' | 'seller' | 'admin' | null
  setAuth: (user: UserProfile | null) => void
  logout: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page, isMobileMenuOpen: false }),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  notifications: 0,
  setNotifications: (count) => set({ notifications: count }),

  // Auth
  isLoggedIn: false,
  showLoginModal: false,
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  userProfile: null,
  userRole: null,
  setAuth: (user) =>
    set({
      isLoggedIn: !!user,
      userProfile: user,
      userRole: user?.role || null,
      showLoginModal: false,
    }),
  logout: async () => {
    await supabase.auth.signOut()
    set({
      isLoggedIn: false,
      userProfile: null,
      userRole: null,
      notifications: 0,
      showLoginModal: false,
    })
  },
}))
