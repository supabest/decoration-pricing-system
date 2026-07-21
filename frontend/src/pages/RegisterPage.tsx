import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getChineseErrorMessage } from '../lib/authErrors'

export default function RegisterPage() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPwd) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    setLoading(true)
    try {
      await register(email, password, displayName || undefined)
      setSuccess(true)
    } catch (err: any) {
      setError(getChineseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    padding: 40,
    width: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️</div>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>
              已提交审核
            </h2>
            <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8, margin: '0 0 20px' }}>
              您的注册申请已提交。<br />
              待管理员审核通过后即可直接登录使用。
            </p>
            <div style={{
              background: '#f6ffed', border: '1px solid #b7eb8f',
              borderRadius: 8, padding: '10px 16px',
              color: '#389e0d', fontSize: 13, marginBottom: 20,
            }}>
              💡 提示：审核通过后即可使用邮箱和密码直接登录，无需等待通知。
            </div>
            <Link
              to="/login"
              style={{
                display: 'inline-block', width: '100%', padding: 12, borderRadius: 8,
                border: 'none', background: '#0f3460', color: '#fff',
                fontSize: 16, fontWeight: 600, textDecoration: 'none', textAlign: 'center',
              }}
            >
              返回登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    }}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏗️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            注册新账户
          </h1>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>创建您的账户</p>
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
              邮箱 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱地址" required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0f3460'}
              onBlur={e => e.target.style.borderColor = '#d9d9d9'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500, fontSize: 14 }}>
              显示名称
            </label>
            <input
              type="text" value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="你的姓名或昵称（可选）"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0f3460'}
              onBlur={e => e.target.style.borderColor = '#d9d9d9'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500, fontSize: 14 }}>
              密码 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少6位" required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0f3460'}
              onBlur={e => e.target.style.borderColor = '#d9d9d9'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500, fontSize: 14 }}>
              确认密码 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="password" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="再次输入密码" required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0f3460'}
              onBlur={e => e.target.style.borderColor = '#d9d9d9'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: '#f6f8fa', borderRadius: 8, padding: '12px 16px',
              fontSize: 14, color: '#555', lineHeight: 1.6, cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                style={{ marginTop: 2, minWidth: 16, width: 16, height: 16, cursor: 'pointer' }}
              />
              <span>
                我已阅读并同意
                <a href="#"
                  onClick={e => { e.preventDefault(); setShowTerms(!showTerms) }}
                  style={{ color: '#0f3460', fontWeight: 500 }}
                >《服务条款》</a>
                ，注册成功后需等待管理员审核通过方可查看数据。
              </span>
            </label>
            {showTerms && (
              <div style={{
                background: '#fafbfc', border: '1px solid #e8e8e8', borderRadius: 8,
                padding: '12px 16px', marginTop: 8, fontSize: 13, color: '#555', lineHeight: 1.8,
              }}>
                <strong>服务条款</strong>
                <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>本系统仅供装修成本分析参考，数据不构成商业报价。</li>
                  <li>注册后需等待管理员审核通过方可查看基准价数据。</li>
                  <li>用户应对自行输入的数据负责。</li>
                </ol>
              </div>
            )}
          </div>

          <button
            type="submit" disabled={loading || !agreedToTerms}
            style={{
              width: '100%', padding: 12, borderRadius: 8,
              border: 'none', background: '#0f3460', color: '#fff',
              fontSize: 16, fontWeight: 600, cursor: (loading || !agreedToTerms) ? 'not-allowed' : 'pointer',
              opacity: (loading || !agreedToTerms) ? 0.6 : 1,
            }}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: '#888', fontSize: 14 }}>已有账户？</span>
          <Link to="/login" style={{ color: '#0f3460', fontSize: 14, fontWeight: 500, marginLeft: 4 }}>
            返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid #d9d9d9', fontSize: 15, boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.2s',
}
