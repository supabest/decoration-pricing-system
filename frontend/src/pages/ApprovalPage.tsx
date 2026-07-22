import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase as _sb } from '../lib/supabaseClient'
const supabase = _sb as any

interface PendingUser {
  id: string
  username: string
  display_name: string | null
  is_approved: boolean
  is_admin: boolean
  created_at: string
}

export default function ApprovalPage() {
  const { user } = useAuth()
  const [pending, setPending] = useState<PendingUser[]>([])
  const [approved, setApproved] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      const all = (data || []) as PendingUser[]
      setPending(all.filter(u => !u.is_approved && !u.is_admin))
      setApproved(all.filter(u => u.is_approved && !u.is_admin))
    } catch {
      setActionMsg('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const approve = async (id: string) => {
    setActionMsg('')
    try {
      const { error } = await supabase.from('profiles').update({ is_approved: true, approved_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setActionMsg('✅ 已批准')
      loadUsers()
    } catch {
      setActionMsg('批准失败，请重试')
    }
  }

  const rejectUser = async (id: string, username: string) => {
    if (!confirm(`确定要拒绝用户 ${username} 的注册申请？该操作不可恢复。`)) return
    setActionMsg('')
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      setActionMsg('✅ 已拒绝该用户申请')
      loadUsers()
    } catch {
      setActionMsg('拒绝失败，请重试')
    }
  }

  const setAdmin = async (id: string) => {
    setActionMsg('')
    try {
      const { error } = await supabase.from('profiles').update({ is_admin: true, is_approved: true }).eq('id', id)
      if (error) throw error
      setActionMsg('✅ 已设为管理员')
      loadUsers()
    } catch {
      setActionMsg('设置失败')
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
        👥 用户审批管理
      </h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 20px' }}>
        你好，{user?.display_name || user?.username}（管理员）
      </p>

      {actionMsg && (
        <div style={{
          background: actionMsg.includes('✅') ? '#f6ffed' : '#fff2f0',
          border: `1px solid ${actionMsg.includes('✅') ? '#b7eb8f' : '#ffccc7'}`,
          borderRadius: 8, padding: '10px 16px', color: actionMsg.includes('✅') ? '#389e0d' : '#cf1322',
          fontSize: 14, marginBottom: 16,
        }}>
          {actionMsg}
        </div>
      )}

      {/* 待审批 */}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: '0 0 12px' }}>
        ⏳ 待审批用户
        <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginLeft: 6 }}>
          {pending.length} 人
        </span>
      </h3>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>⏳ 加载中...</div>
      ) : pending.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#bbb', fontSize: 14 }}>
          ✅ 没有待审批的用户
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {pending.map(u => (
            <div key={u.id} style={{
              background: '#fff', borderRadius: 10, padding: '14px 18px',
              border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                  {u.display_name || u.username}
                </div>
                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                  {u.username}
                </div>
                <div style={{ color: '#bbb', fontSize: 11, marginTop: 1 }}>
                  注册于 {new Date(u.created_at).toLocaleDateString('zh-CN')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => approve(u.id)} style={{
                  padding: '6px 16px', borderRadius: 6, border: '1px solid #389e0d',
                  background: '#f6ffed', color: '#389e0d', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  ✅ 批准
                </button>
                <button onClick={() => rejectUser(u.id, u.username)} style={{
                  padding: '6px 16px', borderRadius: 6, border: '1px solid #cf1322',
                  background: '#fff2f0', color: '#cf1322', fontSize: 13,
                  cursor: 'pointer',
                }}>
                  ✕ 拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已批准用户 */}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: '0 0 12px' }}>
        ✅ 已批准用户
        <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginLeft: 6 }}>
          {approved.length} 人
        </span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {approved.map(u => (
          <div key={u.id} style={{
            background: '#fafafa', borderRadius: 8, padding: '10px 16px',
            border: '1px solid #eee', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
          }}>
            <div>
              <span style={{ fontWeight: 500, fontSize: 13 }}>{u.display_name || u.username}</span>
              <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>{u.username}</span>
            </div>
            <button onClick={() => setAdmin(u.id)} style={{
              padding: '4px 12px', borderRadius: 5, border: '1px solid #0f3460',
              background: '#f0f5ff', color: '#0f3460', fontSize: 12, cursor: 'pointer',
            }}>
              设为管理员
            </button>
          </div>
        ))}
        {approved.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: 'center', color: '#ccc', fontSize: 13 }}>
            暂无已批准用户
          </div>
        )}
      </div>
    </div>
  )
}
