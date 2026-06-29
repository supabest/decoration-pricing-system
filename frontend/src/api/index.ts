import { supabase } from '../lib/supabaseClient'

// ================================================
// 类型定义
// ================================================

export interface Profile {
  id: string
  username: string
  display_name: string | null
  is_admin: boolean
  is_approved: boolean
  approved_at: string | null
  created_at: string
}

export interface BenchmarkItem {
  id: number
  trade_team: string
  internal_code: string | null
  work_type: string | null
  item_name: string
  spec: string | null
  unit: string
  unit_price: number
  auxiliary_price: number | null
  material_price: number | null
  material_loss_rate: number | null
  remark: string | null
  updated_by: string | null
  version: number
  created_at: string
  updated_at: string
}

export interface BenchmarkList {
  items: BenchmarkItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TradeTeam {
  trade_team: string
  count: number
  min_price: number
  max_price: number
}

export interface WorkTypeInfo {
  work_type: string
  trade_team: string
  count: number
}

export interface BenchmarkNote {
  id: number
  title: string
  content: string
  version: string
  created_at: string
}

// ================================================
// Auth — 通过 Supabase Auth
// ================================================

export const auth = {
  /** 获取当前用户资料 */
  getCurrentProfile: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // not found
      throw error
    }
    return data
  },

  /** 登录 */
  login: async (email: string, password: string): Promise<{ user: Profile }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (!data.user) throw new Error('登录失败')

    const profile = await auth.getCurrentProfile()
    if (!profile) throw new Error('未找到用户信息')
    return { user: profile }
  },

  /** 注册 */
  register: async (
    email: string,
    password: string,
    display_name?: string
  ): Promise<{ user: Profile }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: email,
          display_name: display_name || email.split('@')[0],
        },
      },
    })
    if (error) throw error
    if (!data.user) throw new Error('注册失败')

    // 等待数据库 trigger 创建 profile
    await new Promise(r => setTimeout(r, 1500))
    const profile = await auth.getCurrentProfile()
    if (!profile) throw new Error('未找到用户信息，请联系管理员')
    return { user: profile }
  },

  /** 退出 */
  logout: async (): Promise<void> => {
    await supabase.auth.signOut()
  },
}

// ================================================
// Benchmark Prices — 通过 Supabase 查询
// ================================================

export const benchmark = {
  /** 获取班组列表（含统计） */
  teams: async (): Promise<TradeTeam[]> => {
    const { data, error } = await supabase
      .from('benchmark_items')
      .select('trade_team, unit_price')
      .not('trade_team', 'is', null)

    if (error) throw error

    // JS 端聚合统计
    const teamMap = new Map<string, { count: number; min: number; max: number }>()
    const rows = (data || []) as { trade_team: string; unit_price: number }[]
    rows.forEach(item => {
      const existing = teamMap.get(item.trade_team)
      if (existing) {
        existing.count++
        existing.min = Math.min(existing.min, item.unit_price)
        existing.max = Math.max(existing.max, item.unit_price)
      } else {
        teamMap.set(item.trade_team, {
          count: 1,
          min: item.unit_price,
          max: item.unit_price,
        })
      }
    })

    return Array.from(teamMap.entries()).map(([trade_team, stats]) => ({
      trade_team,
      count: stats.count,
      min_price: stats.min,
      max_price: stats.max,
    }))
  },

  /** 获取工种列表 */
  workTypes: async (trade_team?: string): Promise<WorkTypeInfo[]> => {
    let query = supabase
      .from('benchmark_items')
      .select('work_type, trade_team')
      .not('work_type', 'is', null)

    if (trade_team) {
      query = query.eq('trade_team', trade_team)
    }

    const { data, error } = await query
    if (error) throw error

    const wtMap = new Map<string, { trade_team: string; count: number }>()
    const wtRows = (data || []) as { work_type: string; trade_team: string }[]
    wtRows.forEach(item => {
      const key = item.work_type
      const existing = wtMap.get(key)
      if (existing) {
        existing.count++
      } else {
        wtMap.set(key, {
          trade_team: trade_team || item.trade_team,
          count: 1,
        })
      }
    })

    return Array.from(wtMap.entries()).map(([work_type, info]) => ({
      work_type,
      trade_team: info.trade_team,
      count: info.count,
    }))
  },

  /** 分页查询基准价 */
  list: async (params: {
    trade_team?: string
    work_type?: string
    keyword?: string
    page?: number
    page_size?: number
  }): Promise<BenchmarkList> => {
    const { trade_team, work_type, keyword, page = 1, page_size = 30 } = params
    const from = (page - 1) * page_size
    const to = from + page_size - 1

    // 先查总数
    let countQuery = supabase
      .from('benchmark_items')
      .select('*', { count: 'exact', head: true })

    if (trade_team) countQuery = countQuery.eq('trade_team', trade_team)
    if (work_type) countQuery = countQuery.eq('work_type', work_type)
    if (keyword) {
      countQuery = countQuery.or(
        `item_name.ilike.%${keyword}%,spec.ilike.%${keyword}%,internal_code.ilike.%${keyword}%`
      )
    }

    const { count, error: countError } = await countQuery
    if (countError) throw countError

    // 再查数据
    let dataQuery = supabase.from('benchmark_items').select('*')

    if (trade_team) dataQuery = dataQuery.eq('trade_team', trade_team)
    if (work_type) dataQuery = dataQuery.eq('work_type', work_type)
    if (keyword) {
      dataQuery = dataQuery.or(
        `item_name.ilike.%${keyword}%,spec.ilike.%${keyword}%,internal_code.ilike.%${keyword}%`
      )
    }

    const { data, error } = await dataQuery
      .order('id', { ascending: true })
      .range(from, to)

    if (error) throw error

    const total = count || 0
    const total_pages = Math.max(1, Math.ceil(total / page_size))

    return {
      items: data || [],
      total,
      page,
      page_size,
      total_pages,
    }
  },

  /** 获取单个基准价 */
  getItem: async (id: number): Promise<BenchmarkItem | null> => {
    const { data, error } = await supabase
      .from('benchmark_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  /** 获取当前基准价说明 */
  getRules: async (): Promise<BenchmarkNote | null> => {
    const { data, error } = await supabase
      .from('benchmark_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },
}

// ================================================
// Projects — 历史方案（管理员查看）
// ================================================

export interface ProjectInfo {
  id: number
  user_id: string
  name: string
  global_coef: number
  proj_team: string | null
  proj_date: string | null
  hourly_rate: number
  groups_json: any
  row_count: number
  priced_count: number
  is_shared: boolean
  created_at: string
  updated_at: string
}

export interface UnpricedItem {
  /** 归一化后的名称（模糊匹配用） */
  normalizedName: string
  /** 出现的次数 */
  count: number
  /** 原始名称示例列表 */
  examples: string[]
  /** 涉及的项目 */
  projects: { projectId: number; projectName: string; rowName: string }[]
  /** 可能的单位 */
  units: string[]
}

export const projects = {
  /** 获取所有历史方案（仅管理员可用，通过 RLS 控制） */
  listAll: async (): Promise<ProjectInfo[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /** 分析所有项目中的未套价清单项 */
  analyzeUnpriced: async (): Promise<UnpricedItem[]> => {
    const allProjects = await projects.listAll()
    const nameMap = new Map<string, {
      normalizedName: string
      count: number
      examples: Set<string>
      projects: { projectId: number; projectName: string; rowName: string }[]
      units: Set<string>
    }>()

    for (const proj of allProjects) {
      const groups = proj.groups_json
      if (!Array.isArray(groups)) continue

      for (const group of groups) {
        const sections = group.sections || []
        for (const section of sections) {
          const rows = section.rows || []
          for (const row of rows) {
            // 未套价 = subs 为空数组或不存在
            const subs = row.subs || []
            if (subs.length > 0) continue
            const name = row.name?.trim()
            if (!name) continue

            const normalized = normalizeItemName(name)
            const key = normalized

            if (!nameMap.has(key)) {
              nameMap.set(key, {
                normalizedName: normalized,
                count: 0,
                examples: new Set(),
                projects: [],
                units: new Set(),
              })
            }
            const entry = nameMap.get(key)!
            entry.count++
            entry.examples.add(name)
            if (row.unit) entry.units.add(row.unit)
            // 只保留最近 3 个项目引用
            if (entry.projects.length < 3) {
              entry.projects.push({
                projectId: proj.id,
                projectName: proj.name,
                rowName: name,
              })
            }
          }
        }
      }
    }

    // 转为数组并按 count 降序排序
    const result = Array.from(nameMap.values()).map(entry => ({
      normalizedName: entry.normalizedName,
      count: entry.count,
      examples: Array.from(entry.examples).slice(0, 5), // 最多5个示例
      projects: entry.projects,
      units: Array.from(entry.units),
    }))

    result.sort((a, b) => b.count - a.count)
    return result
  },
}

/**
 * 归一化清单项名称，用于模糊匹配
 * - 转小写、去空格、统一标点
 * - 去除常见前缀编号
 * - 提取核心关键词
 */
// ================================================
// Auxiliary Rules — 辅材计算规则
// ================================================

export interface AuxiliaryRule {
  id: number
  rule_name: string
  benchmark_codes: string
  keywords: string
  material_name: string
  calc_method: string
  calc_formula: string
  default_params: any
  unit_price: number
  unit: string
  priority: number
  remark: string
  created_at: string
}

export const auxiliaryRules = {
  list: async (): Promise<AuxiliaryRule[]> => {
    const { data, error } = await (supabase.from('auxiliary_rules') as any)
      .select('*')
      .order('priority', { ascending: true })

    if (error) throw error
    return data || []
  },

  getItem: async (id: number): Promise<AuxiliaryRule | null> => {
    const { data, error } = await (supabase.from('auxiliary_rules') as any)
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  /** 根据基准价编号和关键词匹配辅材规则 */
  matchByKeywords: async (keywords: string, benchmarkCode?: string): Promise<AuxiliaryRule[]> => {
    let query = (supabase.from('auxiliary_rules') as any).select('*')

    if (keywords) {
      // 用 OR 匹配多个关键词
      const terms = keywords.split(/[,，、\s]+/).filter(Boolean)
      if (terms.length > 0) {
        const conditions = terms.map((t: string) => `keywords.ilike.%${t}%`)
        query = query.or(conditions.join(','))
      }
    }

    const { data, error } = await query.order('priority', { ascending: true })
    if (error) throw error
    return data || []
  },

  create: async (rule: Partial<AuxiliaryRule>): Promise<void> => {
    const { error } = await (supabase.from('auxiliary_rules') as any)
      .insert(rule)
    if (error) throw error
  },

  update: async (id: number, rule: Partial<AuxiliaryRule>): Promise<void> => {
    const { error } = await (supabase.from('auxiliary_rules') as any)
      .update(rule)
      .eq('id', id)
    if (error) throw error
  },

  delete: async (id: number): Promise<void> => {
    const { error } = await (supabase.from('auxiliary_rules') as any)
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

function normalizeItemName(name: string): string {
  let s = name
    .replace(/[\s\n\r\t]+/g, '')    // 去空白
    .replace(/[（）【】]/g, '')       // 去中文括号
    .replace(/[()\[\]]/g, '')        // 去英文括号
    .replace(/[：:、,，;；]/g, '')   // 去标点
    .replace(/^[\d]+[、.．-]/, '')   // 去开头编号
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '')
    .trim()
  // 提取核心：去掉常见修饰词
  s = s
    .replace(/^含/g, '')
    .replace(/综合考虑.*$/g, '')
    .trim()
  return s || name.trim()
}
