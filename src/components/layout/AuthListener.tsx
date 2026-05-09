'use client'

import { useEffect } from 'react'
import { supabase, type UserProfile } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'

export function AuthListener({ children }: { children: React.ReactNode }) {
  const setAuth = useAppStore((s) => s.setAuth)
  const setNotifications = useAppStore((s) => s.setNotifications)

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          setAuth(profile as UserProfile)
          const [{ count: notifCount }, { count: alertCount }] = await Promise.all([
            supabase
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', profile.id)
              .eq('is_read', false),
            supabase
              .from('price_alerts')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', profile.id)
              .eq('triggered', true),
          ])

          setNotifications((notifCount ?? 0) + (alertCount ?? 0))
        }
      } else {
        setNotifications(0)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile) {
            setAuth(profile as UserProfile)
            const [{ count: notifCount }, { count: alertCount }] = await Promise.all([
              supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false),
              supabase
                .from('price_alerts')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('triggered', true),
            ])

            setNotifications((notifCount ?? 0) + (alertCount ?? 0))
          }
        } else {
          setAuth(null)
          setNotifications(0)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setAuth, setNotifications])

  return <>{children}</>
}
