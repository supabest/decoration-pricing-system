import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth, UserInfo } from '../api'

interface AuthState {
  user: UserInfo | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, display_name?: string) => Promise<void>
  logout: () => void
  isTrialExpired: boolean
}

const AuthContext = createContext<AuthState>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const isTrialExpired = useCallback((): boolean => {
    if (!user) return false
    if (user.user_type === 'internal') return false
    if (user.is_paid) return false
    if (user.trial_expires_at) {
      return new Date(user.trial_expires_at) < new Date()
    }
    return false
  }, [user])

  // 初始化：检查token是否有效
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    auth.me()
      .then(u => {
        setUser(u)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
        setLoading(false)
      })
  }, [token])

  const login = async (username: string, password: string) => {
    const res = await auth.login(username, password)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setToken(res.access_token)
    setUser(res.user)
  }

  const register = async (username: string, password: string, display_name?: string) => {
    const res = await auth.register(username, password, display_name)
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user', JSON.stringify(res.user))
    setToken(res.access_token)
    setUser(res.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout,
      isTrialExpired: isTrialExpired(),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
