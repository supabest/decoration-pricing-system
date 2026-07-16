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

/** 将 supabase-js 的 session token 同步到 tool.html 期望的 localStorage key */
function syncTokenForTool() {
  try {
    const supabaseKey = 'sb-lnvtykghcpsjpwczbqsm-auth-token'
    const raw = localStorage.getItem(supabaseKey)
    if (!raw) return
    const session = JSON.parse(raw)
    if (session?.access_token) {
      localStorage.setItem('sb-access-token', session.access_token)
    }
    if (session?.refresh_token) {
      localStorage.setItem('sb-refresh-token', session.refresh_token)
    }
    if (session?.user) {
      localStorage.setItem('sb-user', JSON.stringify({
        id: session.user.id,
        email: session.user.email,
      }))
    }
  } catch { /* silently ignore */ }
}

/** 清除 tool.html 的 token */
function clearTokenForTool() {
  localStorage.removeItem('sb-access-token')
  localStorage.removeItem('sb-refresh-token')
  localStorage.removeItem('sb-user')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 监听 Supabase Auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          syncTokenForTool()
          try {
            const profile = await auth.getCurrentProfile()
            setUser(profile)
          } catch {
            setUser(null)
          }
        } else if (event === 'SIGNED_OUT') {
          clearTokenForTool()
          setUser(null)
        }
        setLoading(false)
      }
    )

    // 初始化：检查已有 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncTokenForTool()
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
    syncTokenForTool()
    setUser(result.user)
  }

  const register = async (email: string, password: string, display_name?: string) => {
    const result = await auth.register(email, password, display_name)
    syncTokenForTool()
    setUser(result.user)
  }

  const logout = async () => {
    await auth.logout()
    clearTokenForTool()
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
