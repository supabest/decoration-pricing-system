import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 40,
        width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            装修成本分析系统
          </h1>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>登录您的账户</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fff2f0', border: '1px solid #ffccc7',
              borderRadius: 8, padding: '10px 16px', color: '#cf1322',
              fontSize: 14, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500, fontSize: 14 }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入注册邮箱"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid #d9d9d9', fontSize: 15, boxSizing: 'border-box',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#0f3460'}
              onBlur={e => e.target.style.borderColor = '#d9d9d9'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500, fontSize: 14 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid #d9d9d9', fontSize: 15, boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#0f3460'}
              onBlur={e => e.target.style.borderColor = '#d9d9d9'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 8,
              border: 'none', background: '#0f3460', color: '#fff',
              fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: '#888', fontSize: 14 }}>还没有账户？</span>
          <Link to="/register" style={{ color: '#0f3460', fontSize: 14, fontWeight: 500, marginLeft: 4 }}>
            注册新账户
          </Link>
        </div>
      </div>
    </div>
  )
}
