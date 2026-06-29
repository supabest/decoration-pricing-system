import React from 'react'
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import BenchmarkPage from './pages/BenchmarkPage'
import RulesPage from './pages/RulesPage'
import ApprovalPage from './pages/ApprovalPage'
import UnpricedItemsPage from './pages/UnpricedItemsPage'
import AuxiliaryRulesPage from './pages/AuxiliaryRulesPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#888' }}>⏳ 加载中...</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', color: '#888' }}>⏳ 加载中...</div>
  }
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: '基准价查询', emoji: '📊' },
    { path: '/rules', label: '基准价说明', emoji: '📄' },
    { path: '/rules', label: '基准价说明', emoji: '📄' },
    { path: '/auxiliary-rules', label: '辅材规则', emoji: '🧱' },
    ...(user?.is_admin ? [
      { path: '/unpriced', label: '补缺清单', emoji: '🧩' },
    ] : []),
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Top Nav */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🏗️</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
              装修成本分析系统
            </span>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 14, fontWeight: location.pathname === item.path ? 600 : 400,
                  color: location.pathname === item.path ? '#0f3460' : '#666',
                  background: location.pathname === item.path ? '#f0f5ff' : 'transparent',
                }}
              >
                {item.emoji} {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#888' }}>
            {user?.display_name || user?.username}
            {user?.is_approved ? (
              <span style={{
                background: '#f6ffed', color: '#389e0d', padding: '1px 6px',
                borderRadius: 4, fontSize: 11, marginLeft: 6,
              }}>
                已认证
              </span>
            ) : (
              <span style={{
                background: '#fff7e6', color: '#d46b08', padding: '1px 6px',
                borderRadius: 4, fontSize: 11, marginLeft: 6,
              }}>
                待审批
              </span>
            )}
          </span>
          <button
            onClick={logout}
            style={{
              padding: '6px 16px', borderRadius: 6, border: '1px solid #d9d9d9',
              background: '#fff', fontSize: 13, cursor: 'pointer', color: '#666',
            }}
          >
            退出
          </button>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/approval" element={<ApprovalPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <BenchmarkPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/rules" element={
        <ProtectedRoute>
          <AppLayout>
            <RulesPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/unpriced" element={
        <ProtectedRoute>
          <AppLayout>
            <UnpricedItemsPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/auxiliary-rules" element={
        <ProtectedRoute>
          <AppLayout>
            <AuxiliaryRulesPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
