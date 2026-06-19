import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function TrialExpiredPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
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
        padding: 48,
        width: 480,
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏰</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>
          试用已结束
        </h1>
        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
          你好 <strong>{user?.display_name || user?.username}</strong>，
          你的 {user?.trial_days || 3} 天免费试用期已到。
          请付费后继续使用本系统。
        </p>

        <div style={{
          background: '#fff7e6', borderRadius: 12, padding: 20,
          marginBottom: 24, border: '1px solid #ffd591', textAlign: 'left', fontSize: 14,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#d46b08' }}>
            💡 如何付费使用？
          </p>
          <p style={{ margin: 0, color: '#666', lineHeight: 1.6 }}>
            请联系系统管理员获取付费方式和续费流程。
            付费后您的账户将被激活，继续访问全部数据。
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px 40px', borderRadius: 8, border: 'none',
            background: '#0f3460', color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          返回登录页
        </button>
      </div>
    </div>
  )
}
