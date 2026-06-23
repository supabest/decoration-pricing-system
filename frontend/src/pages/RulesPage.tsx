import React, { useState, useEffect } from 'react'
import { benchmark, BenchmarkNote } from '../api'

export default function RulesPage() {
  const [rule, setRule] = useState<BenchmarkNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    benchmark.getRules()
      .then(res => {
        if (res && 'content' in res) setRule(res as BenchmarkNote)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
          基准价说明
        </h1>
        {rule && (
          <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
            版本: {rule.version} / {rule.title}
          </p>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          加载中...
        </div>
      ) : !rule ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          暂无基准价说明
        </div>
      ) : (
        <div style={{
          background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: 32, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: 14, color: '#333',
        }}>
          {rule.content}
        </div>
      )}
    </div>
  )
}
