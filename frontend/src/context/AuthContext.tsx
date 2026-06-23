import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { auth, Profile } from '../api'

interface AuthState {
  user: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, display_name?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 监听 Supabase Auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // 获取 profile
          try {
            const profile = await auth.getCurrentProfile()
            setUser(profile)
          } catch {
            setUser(null)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        setLoading(false)
      }
    )

    // 初始化：检查已有 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        auth.getCurrentProfile().then(profile => {
          setUser(profile)
          setLoading(false)
        }).catch(() => {
          setUser(null)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const result = await auth.login(email, password)
    setUser(result.user)
  }

  const register = async (email: string, password: string, display_name?: string) => {
    const result = await auth.register(email, password, display_name)
    setUser(result.user)
  }

  const logout = async () => {
    await auth.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
