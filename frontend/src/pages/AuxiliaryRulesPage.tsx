import React, { useState, useEffect } from 'react'
import { auxiliaryRules, AuxiliaryRule } from '../api'

const methodLabels: Record<string, string> = {
  fixed: '固定金额',
  thickness: '按厚度',
  ratio: '用量系数',
  per_unit: '按件/套',
}

const calcPreview = (rule: AuxiliaryRule): string => {
  const p = rule.params || {}
  const price = Number(rule.unit_price) || 0
  switch (rule.calc_method) {
    case 'fixed':
      return `¥${price.toFixed(2)}/${rule.unit} × 面积 = 辅材费`
    case 'thickness': {
      const t = Number(p.thickness) || 0.02
      const loss = Number(p.loss) || 1.05
      return `${t}m厚 × ${price}元/m³ × ${loss}损耗 = ¥${(t * price * loss).toFixed(2)}/m²`
    }
    case 'ratio': {
      const r = Number(p.ratio) || 0.3
      const loss = Number(p.loss) || 1.1
      return `${r}kg/m² × ${price}元/kg × ${loss}损耗 = ¥${(r * price * loss).toFixed(2)}/m²`
    }
    case 'per_unit': {
      const per = Number(p.per) || 2
      const loss = Number(p.loss) || 1.05
      return `${per}套/m² × ${price}元/套 × ${loss}损耗 = ¥${(per * price * loss).toFixed(2)}/m²`
    }
    default: return ''
  }
}

export default function AuxiliaryRulesPage() {
  const [rules, setRules] = useState<AuxiliaryRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Partial<AuxiliaryRule>>({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await auxiliaryRules.list()
      setRules(data)
    } catch (err: any) {
      alert('加载失败：' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startEdit = (rule?: AuxiliaryRule) => {
    if (rule) {
      setEditingId(rule.id)
      setForm({ ...rule, params: rule.params ? JSON.stringify(rule.params, null, 2) : '' })
    } else {
      setEditingId(null)
      setForm({ rule_name: '', trade_team: '', work_type: '', keyword_groups: '', exclude_keywords: '', material_name: '', calc_method: 'fixed', unit_price: 0, unit: '元/m²', params: '', sort_order: 0 })
    }
  }

  const save = async () => {
    try {
      let data: any = { ...form }
      if (data.params && typeof data.params === 'string') {
        try { data.params = JSON.parse(data.params) } catch { alert('参数格式错误，请输入有效的JSON'); return }
      } else if (!data.params) {
        data.params = null
      }
      if (editingId) {
        delete data.id
        await auxiliaryRules.update(editingId, data)
      } else {
        await auxiliaryRules.create(data)
      }
      setEditingId(null)
      load()
    } catch (err: any) {
      alert('保存失败：' + err.message)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('确认删除此规则？')) return
    try {
      await auxiliaryRules.delete(id)
      load()
    } catch (err: any) {
      alert('删除失败：' + err.message)
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            🧱 辅材计算规则
          </h1>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            {rules.length} 条规则 | 基准价无固定辅材价时，按多条规则累加计算辅材费
          </p>
        </div>
        <button onClick={() => startEdit()} style={{
          padding: '8px 20px', borderRadius: 8, border: 'none',
          background: '#0f3460', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600,
        }}>
          + 新增规则
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>⏳ 加载中...</div>
      ) : rules.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#bbb', fontSize: 14 }}>
          暂无规则，点击「+ 新增规则」添加
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map(rule => (
            <div key={rule.id} style={{
              background: '#fff', borderRadius: 10, padding: '14px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
            }}>
              {editingId === rule.id ? (
                <EditForm form={form} setForm={setForm} onSave={save} onCancel={() => setEditingId(null)} />
              ) : (
                <RuleCard rule={rule} onEdit={() => startEdit(rule)} onDelete={() => remove(rule.id)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RuleCard({ rule, onEdit, onDelete }: { rule: AuxiliaryRule; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{rule.rule_name}</span>
          <span style={{
            fontSize: 11, padding: '1px 7px', borderRadius: 4,
            background: '#e6f7ff', color: '#0f3460', fontWeight: 600,
          }}>
            {rule.material_name}
          </span>
          <span style={{
            fontSize: 11, padding: '1px 7px', borderRadius: 4,
            background: '#f0f5ff', color: '#555',
          }}>
            {methodLabels[rule.calc_method] || rule.calc_method}
          </span>
        </div>

        <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>
          <span>{rule.trade_team ? `🏷️ ${rule.trade_team}` : '📌 通用'}</span>
          <span style={{ marginLeft: 12 }}>🔍 {rule.keyword_groups}</span>
          {rule.exclude_keywords && <span style={{ marginLeft: 12, color: '#cf1322' }}>🚫 {rule.exclude_keywords}</span>}
          {rule.sort_order > 0 && <span style={{ marginLeft: 12 }}>序号: {rule.sort_order}</span>}
        </div>

        <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>
          ¥{Number(rule.unit_price).toFixed(2)}/{rule.unit}
        </div>

        <div style={{
          fontSize: 12, color: '#0f3460', background: '#f6f8fa',
          padding: '4px 10px', borderRadius: 4, display: 'inline-block', marginTop: 2,
          fontFamily: 'monospace',
        }}>
          {calcPreview(rule)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 2 }}>
        <button onClick={onEdit} style={btnStyle}>✏️ 编辑</button>
        <button onClick={onDelete} style={{ ...btnStyle, color: '#cf1322', borderColor: '#ffa39e' }}>🗑 删除</button>
      </div>
    </div>
  )
}

function EditForm({ form, setForm, onSave, onCancel }: {
  form: Partial<AuxiliaryRule>
  setForm: (f: any) => void
  onSave: () => void
  onCancel: () => void
}) {
  const set = (k: string, v: any) => setForm({ ...form, [k]: v })

  const methodParamHint = (m: string) => {
    switch (m) {
      case 'fixed': return '不需要参数'
      case 'thickness': return '{"thickness":0.02,"loss":1.05}'
      case 'ratio': return '{"ratio":0.3,"loss":1.1}'
      case 'per_unit': return '{"per":2,"loss":1.05}'
      default: return ''
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>规则名称</label>
          <input value={form.rule_name || ''} onChange={e => set('rule_name', e.target.value)} style={inputStyle} placeholder="如：地砖铺贴-水泥砂浆" />
        </div>
        <div>
          <label style={labelStyle}>辅材名称</label>
          <input value={form.material_name || ''} onChange={e => set('material_name', e.target.value)} style={inputStyle} placeholder="如：1:3水泥砂浆" />
        </div>
        <div>
          <label style={labelStyle}>关联班组</label>
          <input value={form.trade_team || ''} onChange={e => set('trade_team', e.target.value)} style={inputStyle} placeholder="留空表示通用" />
        </div>
        <div>
          <label style={labelStyle}>关联工种</label>
          <input value={form.work_type || ''} onChange={e => set('work_type', e.target.value)} style={inputStyle} placeholder="可选" />
        </div>
        <div>
          <label style={labelStyle}>关键词组（分号=AND 逗号=OR）</label>
          <input value={form.keyword_groups || ''} onChange={e => set('keyword_groups', e.target.value)} style={inputStyle} placeholder="地砖,瓷砖;地面,铺贴" />
          <span style={{ fontSize: 11, color: '#999', display: 'block', marginTop: 2 }}>同时命中 (地砖OR瓷砖) AND (地面OR铺贴) 才算匹配</span>
        </div>
        <div>
          <label style={labelStyle}>排除词（命中则跳过）</label>
          <input value={form.exclude_keywords || ''} onChange={e => set('exclude_keywords', e.target.value)} style={inputStyle} placeholder="墙面,墙砖" />
          <span style={{ fontSize: 11, color: '#999', display: 'block', marginTop: 2 }}>项目特征含这些词时跳过此规则</span>
        </div>
        <div>
          <label style={labelStyle}>计算方式</label>
          <select value={form.calc_method || 'fixed'} onChange={e => set('calc_method', e.target.value)} style={inputStyle}>
            <option value="fixed">固定金额 (fixed) — ¥/m²</option>
            <option value="thickness">按厚度 (thickness) — m×m²×单价</option>
            <option value="ratio">用量系数 (ratio) — kg/m²×单价</option>
            <option value="per_unit">按件/套 (per_unit) — 套/m²×单价</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>单价</label>
          <input type="number" value={form.unit_price ?? ''} onChange={e => set('unit_price', parseFloat(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>单价单位</label>
          <input value={form.unit || ''} onChange={e => set('unit', e.target.value)} style={inputStyle} placeholder="元/m², 元/m³, 元/kg..." />
        </div>
        <div>
          <label style={labelStyle}>排序序号（小→大累加）</label>
          <input type="number" value={form.sort_order ?? 0} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            计算参数 JSON
            <span style={{ fontWeight: 400, color: '#999', marginLeft: 8 }}>
              {methodParamHint(form.calc_method || 'fixed')}
            </span>
          </label>
          <textarea
            value={typeof form.params === 'string' ? form.params : JSON.stringify(form.params || {}, null, 2)}
            onChange={e => set('params', e.target.value)}
            style={{ ...inputStyle, minHeight: 60, fontFamily: 'monospace', fontSize: 12 }}
            placeholder={methodParamHint(form.calc_method || 'fixed')}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} style={{ ...btnStyle, background: '#0f3460', color: '#fff', border: 'none' }}>💾 保存</button>
        <button onClick={onCancel} style={btnStyle}>取消</button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #d9d9d9',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}
const btnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6, border: '1px solid #d9d9d9',
  background: '#fff', color: '#666', fontSize: 13, cursor: 'pointer',
}
