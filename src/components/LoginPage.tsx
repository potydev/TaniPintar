'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Sprout, Mail, Lock, User, Phone, MapPin, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import type { UserProfile } from '@/lib/supabase'

export function LoginPage() {
  const { showLoginModal, setShowLoginModal, setAuth } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regRole, setRegRole] = useState<'user' | 'seller'>('user')

  const resetForms = () => {
    setError('')
    setSuccess('')
    setLoginEmail('')
    setLoginPassword('')
    setRegEmail('')
    setRegPassword('')
    setRegConfirmPassword('')
    setRegFullName('')
    setRegPhone('')
    setRegRole('user')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      })

      if (authError) throw authError

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profile) {
          setAuth(profile as UserProfile)
        } else {
          setError('Profil pengguna tidak ditemukan. Silakan hubungi admin.')
        }
      }
    } catch (err: any) {
      const normalizedMessage = err.message?.toLowerCase?.() || ''
      const needsVerification =
        normalizedMessage.includes('confirm') ||
        normalizedMessage.includes('verification') ||
        normalizedMessage.includes('not confirmed') ||
        normalizedMessage.includes('not verified')

      if (needsVerification) {
        setError('Silakan verifikasi akun Anda terlebih dahulu. Cek email yang dikirimkan saat pendaftaran.')
      } else if (normalizedMessage === 'invalid login credentials') {
        const loginEmailNormalized = loginEmail.trim().toLowerCase()
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', loginEmailNormalized)
          .maybeSingle()

        if (profile) {
          setError('Silakan verifikasi akun Anda terlebih dahulu. Cek email yang dikirimkan saat pendaftaran.')
        } else {
          setError('Email atau password salah. Silakan coba lagi.')
        }
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const emailToReset = loginEmail.trim().toLowerCase()
      if (!emailToReset) {
        setError('Silakan masukkan email Anda terlebih dahulu.')
        return
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        emailToReset,
      )

      if (error) throw error

      setSuccess(
        'Permintaan reset password telah dikirim. Silakan cek email Anda untuk instruksi selanjutnya.',
      )
    } catch (err: any) {
      setError(err.message.includes('invalid email')
        ? 'Email tidak ditemukan. Periksa kembali alamat email Anda.'
        : err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (regPassword !== regConfirmPassword) {
      setError('Password dan konfirmasi password tidak sama.')
      return
    }

    if (regPassword.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setIsLoading(true)

    const verificationMessage =
      'Akun berhasil dibuat. Silakan cek email untuk verifikasi. Setelah konfirmasi, silakan masuk kembali.'

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
      })

      if (authError) throw authError

      if (data.user) {
        const profileData = {
          id: data.user.id,
          email: regEmail.trim().toLowerCase(),
          full_name: regFullName,
          phone: regPhone || null,
          province: null,
          city: null,
          role: regRole,
          avatar_url: null,
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)

        if (profileError) {
          if (profileError.message.includes('row-level security')) {
            setSuccess(verificationMessage)
            return
          }
          throw profileError
        }

        if (data.session) {
          setAuth(profileData as UserProfile)
        }
        setSuccess(verificationMessage)
      }
    } catch (err: any) {
      if (err.message.includes('row-level security')) {
        setSuccess(verificationMessage)
      } else {
        setError(err.message.includes('already registered')
          ? 'Email sudah terdaftar. Silakan login atau gunakan email lain.'
          : err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={showLoginModal} onOpenChange={(open) => { if (!open) resetForms(); setShowLoginModal(open) }}>
      <DialogContent className="sm:max-w-md mx-4 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Masuk atau Daftar</DialogTitle>
          <DialogDescription>Form autentikasi untuk pengguna TaniPintar.</DialogDescription>
        </DialogHeader>
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 pt-8 pb-12 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
          >
            <Sprout className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold">TaniPintar</h2>
          <p className="mt-1 text-emerald-100 text-sm">Platform Pertanian Digital Indonesia</p>
        </div>

        <Tabs
          defaultValue="login"
          className="relative -mt-6"
        >
          <div className="rounded-t-none bg-background border border-t-0">
            <div className="flex border-b">
              <TabsList className="flex-1 h-12 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="login"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium transition-colors"
                >
                  Masuk
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium transition-colors"
                >
                  Daftar
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Login Form */}
          <TabsContent value="login" className="p-6 pt-4 mt-0">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  'Masuk'
                )}
              </Button>

              <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="underline-offset-2 underline hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault()
                    handleForgotPassword()
                  }}
                >
                  Lupa password?
                </button>               
              </div>
            </form>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register" className="p-6 pt-4 mt-0">
            <form onSubmit={handleRegister} className="space-y-3">
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {success}
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Daftar Sebagai</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('user')}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                      regRole === 'user'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-border hover:border-emerald-300 text-muted-foreground'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Pembeli
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('seller')}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                      regRole === 'seller'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-border hover:border-emerald-300 text-muted-foreground'
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    Penjual
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-sm font-medium">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Nama lengkap Anda"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-phone" className="text-sm font-medium">No. Telepon (opsional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="08xx-xxxx-xxxx"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm" className="text-sm font-medium">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ulangi password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mendaftar...
                  </span>
                ) : (
                  'Daftar Sekarang'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
