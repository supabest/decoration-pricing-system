import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase as _sb } from '../lib/supabaseClient'
const supabase = _sb as any

interface QuickAction {
  emoji: string
  label: string
  desc: string
  path: string
  color: string
  external?: boolean
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState({ benchmark: 0, auxRules: 0, matPrices: 0, projects: 0 })
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nickname, setNickname] = useState(user?.display_name || '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadCounts() {
      try {
        const [bmRes, auxRes, mpRes, pjRes] = await Promise.all([
          supabase.from('benchmark_items').select('*', { count: 'exact', head: true }),
          supabase.from('auxiliary_rules').select('*', { count: 'exact', head: true }),
          supabase.from('material_prices').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user?.id || ''),
        ])
        setCounts({
          benchmark: bmRes.count ?? 0,
          auxRules: auxRes.count ?? 0,
          matPrices: mpRes.count ?? 0,
          projects: pjRes.count ?? 0,
        })
      } catch { /* silently fail */ }
      finally { setLoading(false) }
    }
    loadCounts()
  }, [user?.id])

  useEffect(() => {
    if (editingName && inputRef.current) inputRef.current.focus()
  }, [editingName])

  const saveNickname = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ display_name: nickname || null }).eq('id', user.id)
      if (error) throw error
      user.display_name = nickname
      setEditingName(false)
    } catch { /* let user retry */ }
    finally { setSaving(false) }
  }

  const quickActions: QuickAction[] = [
    { emoji: '🧮', label: '套价工具', desc: '导入清单，自动匹配基准价与辅材', path: '/pricing', color: '#0f3460' },
    { emoji: '📊', label: '基准价查询', desc: '浏览 497 条企业基准价数据', path: '/', color: '#1d6fa5' },
    { emoji: '🧱', label: '辅材规则', desc: '管理 21 条辅材计算规则', path: '/auxiliary-rules', color: '#7b4b9a' },
    { emoji: '💰', label: '材料信息价', desc: '维护辅材市场价格', path: '/admin.html#prices', color: '#0b7b50', external: true },
    ...(user?.is_admin ? [
      { emoji: '👥', label: '用户审批', desc: '管理用户注册与审批', path: '/approval', color: '#b07000' },
      { emoji: '📋', label: '基准价管理', desc: '批量导入/更新基准价数据', path: '/admin.html', color: '#1d6fa5', external: true },
    ] : []),
  ]

  const stats = [
    { label: '基准价条目', value: counts.benchmark, emoji: '📋' },
    { label: '辅材规则', value: counts.auxRules, emoji: '🧱' },
    { label: '材料信息价', value: counts.matPrices, emoji: '💰' },
    { label: '我的项目', value: counts.projects, emoji: '📁' },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
            👋 欢迎回来{!editingName && (user?.display_name ? `，${user.display_name}` : '')}
          </h2>
          {editingName ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                ref={inputRef}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') { setNickname(user?.display_name || ''); setEditingName(false); } }}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid #1d6fa5',
                  fontSize: 14, outline: 'none', width: 160,
                }}
                placeholder="输入昵称"
              />
              <button onClick={saveNickname} disabled={saving} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #389e0d',
                background: '#f6ffed', color: '#389e0d', fontSize: 13, cursor: 'pointer',
              }}>
                {saving ? '...' : '保存'}
              </button>
              <button onClick={() => { setNickname(user?.display_name || ''); setEditingName(false) }} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid #d9d9d9',
                background: '#fff', color: '#666', fontSize: 13, cursor: 'pointer',
              }}>
                取消
              </button>
            </div>
          ) : (
            <span
              onClick={() => { setNickname(user?.display_name || ''); setEditingName(true) }}
              title="修改昵称"
              style={{ fontSize: 18, cursor: 'pointer', opacity: 0.4, transition: '0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
            >
              ✏️
            </span>
          )}
        </div>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
          {user?.is_admin ? '管理员模式 — 可管理所有数据和用户' : '认证用户 — 可查询基准价与套价'}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12, padding: '20px 18px',
            border: '1px solid #e8e8e8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.emoji}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e' }}>
              {loading ? '—' : s.value}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 16 }}>⚡ 快捷入口</h3>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14,
      }}>
        {quickActions.map(action => (
          <div
            key={action.path}
            onClick={() => {
              if (action.external) {
                window.location.href = import.meta.env.BASE_URL + action.path.replace(/^\//, '')
              } else {
                navigate(action.path)
              }
            }}
            style={{
              background: '#fff', borderRadius: 12, padding: '20px 22px',
              border: '1px solid #e8e8e8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 16,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = action.color
              e.currentTarget.style.boxShadow = `0 2px 12px ${action.color}20`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e8e8e8'
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${action.color}10`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24,
              flexShrink: 0,
            }}>
              {action.emoji}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>
                {action.label}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                {action.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
