import React, { useState, useEffect } from 'react'
import { auxiliaryRules, AuxiliaryRule } from '../api'

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
      setForm({ ...rule })
    } else {
      setEditingId(null)
      setForm({ rule_name: '', keywords: '', material_name: '', calc_method: 'thickness', unit_price: 0, unit: '元/m³', priority: 1 })
    }
  }

  const save = async () => {
    try {
      if (editingId) {
        await auxiliaryRules.update(editingId, form)
      } else {
        await auxiliaryRules.create(form)
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

  const methodLabel: Record<string, string> = {
    thickness: '按厚度',
    area_ratio: '面积系数',
    fixed_coeff: '固定系数',
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            🧱 辅材计算规则
          </h1>
          <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
            共 {rules.length} 条规则 | 基准价无固定辅材价时，按关键词匹配规则计算
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>
                      {rule.rule_name}
                      <span style={{
                        marginLeft: 8, fontSize: 11, padding: '1px 6px', borderRadius: 4,
                        background: '#f0f5ff', color: '#0f3460',
                      }}>
                        {rule.material_name}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>
                      关键词: {rule.keywords} | 方式: {methodLabel[rule.calc_method] || rule.calc_method}
                      {rule.benchmark_codes ? ` | 关联: ${rule.benchmark_codes}` : ''}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                      单价: ¥{Number(rule.unit_price).toFixed(2)}/{rule.unit}
                      {rule.default_params && ` | 参数: ${JSON.stringify(rule.default_params)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => startEdit(rule)} style={btnStyle}>✏️ 编辑</button>
                    <button onClick={() => remove(rule.id)} style={{ ...btnStyle, color: '#cf1322', borderColor: '#ffa39e' }}>🗑 删除</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>规则名称</label>
          <input value={form.rule_name || ''} onChange={e => set('rule_name', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>辅材名称</label>
          <input value={form.material_name || ''} onChange={e => set('material_name', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>适用关键词（逗号分隔）</label>
          <input value={form.keywords || ''} onChange={e => set('keywords', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>关联基准价编号</label>
          <input value={form.benchmark_codes || ''} onChange={e => set('benchmark_codes', e.target.value)} style={inputStyle} placeholder="如 NS-08~NS-014" />
        </div>
        <div>
          <label style={labelStyle}>计算方式</label>
          <select value={form.calc_method || 'thickness'} onChange={e => set('calc_method', e.target.value)} style={inputStyle}>
            <option value="thickness">按厚度 (thickness)</option>
            <option value="area_ratio">面积系数 (area_ratio)</option>
            <option value="fixed_coeff">固定系数 (fixed_coeff)</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>单价</label>
            <input type="number" value={form.unit_price || ''} onChange={e => set('unit_price', parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>单价单位</label>
            <input value={form.unit || '元/m³'} onChange={e => set('unit', e.target.value)} style={inputStyle} />
          </div>
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
