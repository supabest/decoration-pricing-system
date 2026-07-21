import React from 'react'
import { useAuth } from '../context/AuthContext'

const TOOL_URL = './tool.html'

export default function PricingPage() {
  const { user, logout } = useAuth()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部返回栏 */}
      <div style={{
        background: '#1a1a2e', height: 40, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px', flexShrink: 0,
      }}>
        <a href="#/dashboard" style={{
          color: '#ccc', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← 返回工作台
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: '#999', fontSize: 12 }}>
            {user?.display_name || user?.username}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'transparent', border: '1px solid #666', color: '#999',
              fontSize: 12, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
            }}
          >
            退出
          </button>
        </div>
      </div>

      {/* 套价工具 iframe */}
      <iframe
        src={TOOL_URL}
        style={{ flex: 1, border: 'none' }}
        title="套价工具"
      />
    </div>
  )
}
