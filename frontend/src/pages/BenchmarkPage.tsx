import React, { useState, useEffect } from 'react'
import { benchmark, BenchmarkItem, TradeTeam, WorkTypeInfo } from '../api'

export default function BenchmarkPage() {
  const [items, setItems] = useState<BenchmarkItem[]>([])
  const [teams, setTeams] = useState<TradeTeam[]>([])
  const [workTypes, setWorkTypes] = useState<WorkTypeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 筛选条件
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedWorkType, setSelectedWorkType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const pageSize = 30

  // 加载班组列表
  useEffect(() => {
    benchmark.teams().then(res => {
      if (res && Array.isArray(res)) setTeams(res)
    }).catch(console.error)
  }, [])

  // 班组变化时加载工种
  useEffect(() => {
    setSelectedWorkType('')
    if (selectedTeam) {
      benchmark.workTypes(selectedTeam).then(res => {
        if (res && Array.isArray(res)) setWorkTypes(res)
      }).catch(console.error)
    } else {
      setWorkTypes([])
    }
  }, [selectedTeam])

  // 加载数据
  useEffect(() => {
    setLoading(true)
    benchmark.list({
      trade_team: selectedTeam || undefined,
      work_type: selectedWorkType || undefined,
      keyword: searchKeyword || undefined,
      page,
      page_size: pageSize,
    }).then(res => {
      setItems(res.items || [])
      setTotal(res.total || 0)
      setTotalPages(res.total_pages || 1)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [selectedTeam, selectedWorkType, searchKeyword, page])

  const handleSearch = () => {
    setPage(1)
    setSearchKeyword(keyword)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
          装修成本基准价
        </h1>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
          共 {total} 条基准价数据
        </p>
      </div>

      {/* 筛选栏 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* 班组筛选 */}
        <select
          value={selectedTeam}
          onChange={e => { setSelectedTeam(e.target.value); setPage(1) }}
          style={selectStyle}
        >
          <option value="">全部班组</option>
          {teams.map(t => (
            <option key={t.trade_team} value={t.trade_team}>
              {t.trade_team} ({t.count})
            </option>
          ))}
        </select>

        {/* 工种筛选 */}
        <select
          value={selectedWorkType}
          onChange={e => { setSelectedWorkType(e.target.value); setPage(1) }}
          style={selectStyle}
          disabled={workTypes.length === 0}
        >
          <option value="">全部工种</option>
          {workTypes.map(w => (
            <option key={w.work_type} value={w.work_type}>
              {w.work_type} ({w.count})
            </option>
          ))}
        </select>

        {/* 搜索框 */}
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索项目名称..."
            style={{
              ...inputStyle, flex: 1,
            }}
          />
          <button onClick={handleSearch} style={searchBtnStyle}>
            搜索
          </button>
        </div>
      </div>

      {/* 数据表格 */}
      <div style={{
        background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            暂无数据
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                  <th style={thStyle}>班组</th>
                  <th style={thStyle}>编号</th>
                  <th style={thStyle}>工种</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>项目名称</th>
                  <th style={{ ...thStyle, width: 70 }}>单位</th>
                  <th style={{ ...thStyle, width: 100, textAlign: 'right' }}>人工费</th>
                  <th style={{ ...thStyle, width: 90, textAlign: 'right' }}>辅材费</th>
                  <th style={{ ...thStyle, width: 90, textAlign: 'right' }}>主材费</th>
                  <th style={{ ...thStyle, width: 70, textAlign: 'center' }}>损耗</th>
                  <th style={{ ...thStyle, width: 100, textAlign: 'right' }}>综合单价</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                    }}
                  >
                    <td style={tdStyle}>
                      <span style={{
                        background: teamColors[item.trade_team] || '#e6f7ff',
                        color: '#333', padding: '2px 8px', borderRadius: 4, fontSize: 12,
                      }}>
                        {item.trade_team}
                      </span>
                    </td>
                    <td style={tdStyle}>{item.internal_code}</td>
                    <td style={tdStyle}>{item.work_type}</td>
                    <td style={tdStyle}>
                      <div title={item.spec || ''}>{item.item_name}</div>
                    </td>
                    <td style={tdStyle}>{item.unit}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#cf1322' }}>
                      ¥{Number(item.unit_price).toFixed(2)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: item.auxiliary_price ? '#d46b08' : '#bbb' }}>
                      {item.auxiliary_price ? `¥${Number(item.auxiliary_price).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: item.material_price ? '#0f3460' : '#bbb' }}>
                      {item.material_price ? `¥${Number(item.material_price).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#666' }}>
                      {item.material_loss_rate ? `${Number(item.material_loss_rate).toFixed(0)}%` : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#1a1a2e' }}>
                      {(() => {
                        const labor = Number(item.unit_price) || 0
                        const aux = Number(item.auxiliary_price) || 0
                        const mat = Number(item.material_price) || 0
                        const loss = (Number(item.material_loss_rate) || 0) / 100
                        const total = labor + aux + mat * (1 + loss)
                        return `¥${total.toFixed(2)}`
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 分页 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderTop: '1px solid #f0f0f0',
            }}>
              <span style={{ color: '#888', fontSize: 13 }}>
                共 {total} 条
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={pageBtnStyle(page > 1)}
                >
                  上一页
                </button>
                <span style={{
                  padding: '6px 12px', fontSize: 13, color: '#666', alignSelf: 'center',
                }}>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={pageBtnStyle(page < totalPages)}
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const teamColors: Record<string, string> = {
  '泥水班组': '#fff7e6',
  '木工班组': '#e6f7ff',
  '油漆班组': '#f6ffed',
  '铁工班组': '#f0f5ff',
  '玻璃班组': '#fff0f6',
  '各专业班组': '#f9f0ff',
  '其他班组': '#fffbe6',
  '幕墙班组': '#e6fffb',
  '机电班组': '#f0f0f0',
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 13, whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  padding: '10px 16px', color: '#333', fontSize: 13,
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #d9d9d9',
  fontSize: 14, background: '#fff', outline: 'none', minWidth: 140,
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #d9d9d9',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const searchBtnStyle: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: 'none',
  background: '#0f3460', color: '#fff', fontSize: 14, cursor: 'pointer',
}

const pageBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: 6, border: '1px solid #d9d9d9',
  background: active ? '#fff' : '#f5f5f5', color: active ? '#333' : '#bbb',
  fontSize: 13, cursor: active ? 'pointer' : 'not-allowed',
})
