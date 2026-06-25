import React, { useState, useEffect, useCallback } from 'react'
import { projects, UnpricedItem } from '../api'

export default function UnpricedItemsPage() {
  const [items, setItems] = useState<UnpricedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await projects.analyzeUnpriced()
      setItems(result)
    } catch (err: any) {
      setError(err.message || '加载失败，请确认您有管理员权限')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalUnpriced = items.reduce((sum, i) => sum + i.count, 0)
  const filteredItems = searchTerm
    ? items.filter(i =>
        i.normalizedName.includes(searchTerm) ||
        i.examples.some(e => e.includes(searchTerm))
      )
    : items

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* 头部 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            🧩 基准价补缺清单
          </h1>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            分析所有历史方案中因基准价不完善未能套价的清单项，按出现次数排序
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#cf1322' }}>{totalUnpriced}</div>
          <div style={{ fontSize: 12, color: '#888' }}>条待补充</div>
        </div>
      </div>

      {/* 搜索 + 刷新 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="搜索清单项名称..."
          style={{
            flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid #d9d9d9',
            fontSize: 14, outline: 'none', maxWidth: 360,
          }}
        />
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: '#0f3460', color: '#fff', fontSize: 14, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '分析中...' : '🔄 重新分析'}
        </button>
      </div>

      {/* 出错提示 */}
      {error && (
        <div style={{
          background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8,
          padding: '14px 18px', color: '#cf1322', fontSize: 14, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          正在分析所有历史方案中的未套价项目...
        </div>
      )}

      {/* 空数据 */}
      {!loading && !error && filteredItems.length === 0 && (
        <div style={{
          background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 12,
          padding: 40, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 18, color: '#389e0d', margin: '0 0 8px' }}>所有项目都已完整套价！</h2>
          <p style={{ color: '#666', fontSize: 14, margin: 0 }}>没有发现需要补充基准价的项目</p>
        </div>
      )}

      {/* 列表 */}
      {!loading && filteredItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredItems.map((item, idx) => (
            <div
              key={item.normalizedName}
              style={{
                background: '#fff', borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
                overflow: 'hidden',
              }}
            >
              {/* 主行 */}
              <div
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: item.count >= 10 ? '#fff1f0' : '#fff7e6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700,
                  color: item.count >= 10 ? '#cf1322' : '#d46b08',
                  flexShrink: 0,
                }}>
                  {item.count}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: '#1a1a2e',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.normalizedName}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                    {item.examples.length > 0 && (
                      <span>{item.examples[0]}</span>
                    )}
                    {item.examples.length > 1 && (
                      <span style={{ marginLeft: 8, color: '#bbb' }}>
                        等{item.examples.length}种表述
                      </span>
                    )}
                    {item.units.length > 0 && (
                      <span style={{ marginLeft: 8 }}>
                        | 单位: {item.units.join('/')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#bbb', flexShrink: 0 }}>
                  {expandedIdx === idx ? '▲ 收起' : '▼ 展开'}
                </div>
              </div>

              {/* 展开详情 */}
              {expandedIdx === idx && (
                <div style={{
                  borderTop: '1px solid #f0f0f0', padding: '16px 20px',
                  background: '#fafbfc', fontSize: 13,
                }}>
                  {/* 所有原始名称 */}
                  {item.examples.length > 1 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, color: '#555', marginBottom: 6, fontSize: 12 }}>
                        原始名称（{item.examples.length}种表述）
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.examples.map((ex, i) => (
                          <span key={i} style={{
                            background: '#fff', border: '1px solid #e8e8e8',
                            borderRadius: 4, padding: '3px 8px', fontSize: 12, color: '#666',
                          }}>
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 涉及项目 */}
                  {item.projects.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, color: '#555', marginBottom: 6, fontSize: 12 }}>
                        出现于以下项目
                      </div>
                      {item.projects.map((p, i) => (
                        <div key={i} style={{
                          display: 'inline-block',
                          background: '#e6f7ff', border: '1px solid #bae7ff',
                          borderRadius: 4, padding: '3px 10px', margin: '0 4px 4px 0',
                          fontSize: 12, color: '#096dd9',
                        }}>
                          📁 {p.projectName}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 建议操作 */}
                  <div style={{
                    marginTop: 12, padding: '10px 14px', background: '#fff7e6',
                    borderRadius: 6, border: '1px solid #ffd591', fontSize: 12, color: '#d46b08',
                  }}>
                    💡 建议：在基准价库中新增「{item.normalizedName}」条目
                    {item.units.length > 0 && `，单位：${item.units[0]}`}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 分析摘要 */}
      {!loading && items.length > 0 && (
        <div style={{
          marginTop: 24, padding: '16px 20px', background: '#f6f8fa',
          borderRadius: 10, fontSize: 13, color: '#666', display: 'flex', gap: 32,
        }}>
          <span>📊 共分析 <strong>{items.length}</strong> 种待补项</span>
          <span>🔢 合计出现 <strong>{totalUnpriced}</strong> 次</span>
          <span>📁 涉及 {new Set(items.flatMap(i => i.projects.map(p => p.projectId))).size} 个项目</span>
        </div>
      )}
    </div>
  )
}
