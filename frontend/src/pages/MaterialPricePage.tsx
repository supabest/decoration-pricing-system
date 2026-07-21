import React from 'react'

export default function MaterialPricePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>
        材料信息价管理
      </h2>
      <p style={{ color: '#888', fontSize: 14, margin: '0 0 24px' }}>
        维护辅材市场信息价，支持按月版本化、按材料名检索
      </p>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 60,
        border: '1px solid #e8e8e8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        color: '#bbb', fontSize: 16,
      }}>
        🚧 功能开发中，敬请期待...
      </div>
    </div>
  )
}
