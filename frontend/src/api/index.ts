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
    if (error) {
      // 邮箱未确认：尝试 RPC 自动确认后重试
      if (error.message?.includes('Email not confirmed')) {
        const rpcOk = await supabase.rpc('confirm_my_email').then(() => true, () => false)
        if (rpcOk) {
          const retry = await supabase.auth.signInWithPassword({ email, password })
          if (!retry.error && retry.data.user) {
            return auth._finishLogin(retry.data.user, email)
          }
        }
      }
      throw error
    }
    if (!data.user) throw new Error('登录失败')
    return auth._finishLogin(data.user, email)
  },

  /** 登录辅助：获取/创建 profile */
  _finishLogin: async (supabaseUser: any, email: string): Promise<{ user: Profile }> => {
    let profile = await auth.getCurrentProfile()
    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: supabaseUser.id,
          username: email,
          display_name: supabaseUser.user_metadata?.display_name || email.split('@')[0],
        } as any)
      if (!insertError) {
        profile = await auth.getCurrentProfile()
      }
    }
    if (!profile) throw new Error('未找到用户信息，请联系管理员')
    return { user: profile }
  },


  /** 注册 */
  register: async (
    email: string,
    password: string,
    display_name?: string
  ): Promise<{ user: Profile | null }> => {
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

    // 确保 profile 已创建（有 session 时），然后登出不自动登录
    try {
      if (data.session) {
        // 等待数据库 trigger 创建 profile
        const delays = [500, 1000, 1500, 2000, 2500]
        for (let i = 0; i < delays.length; i++) {
          await new Promise(r => setTimeout(r, delays[i]))
          const profile = await auth.getCurrentProfile()
          if (profile) break
        }
        // trigger 未生效时手动创建 profile（已存在则忽略）
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: email,
            display_name: display_name || email.split('@')[0],
          } as any)
          .then(() => {}, () => {})
        // 注册后不自动登录，等待管理员审批
        await supabase.auth.signOut()
      }
    } catch {
      // 内部流程失败不影响注册成功提示
    }

    // 返回 null，注册页显示"已提交审核"
    return { user: null }
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
// Auxiliary Rules — 辅材计算规则（语言匹配版）
// ================================================

export interface AuxiliaryRule {
  id: number
  rule_name: string
  trade_team: string | null
  work_type: string | null
  keyword_groups: string
  exclude_keywords: string | null
  material_name: string
  calc_method: 'fixed' | 'thickness' | 'ratio' | 'per_unit'
  unit_price: number
  unit: string
  params: any
  sort_order: number
  remark: string
  created_at: string
}

export interface MatchedRule extends AuxiliaryRule {
  /** 匹配得分 */
  score: number
  /** 匹配详情 */
  matchDetail: string
}

/**
 * 对一行项目描述进行语言匹配评分。
 * 返回按得分降序排列的匹配规则列表。
 */
function scoreRule(rule: AuxiliaryRule, tradeTeam: string, itemName: string, spec: string): MatchedRule | null {
  let score = 0
  const details: string[] = []

  // ---- 1. 班组匹配 ----
  if (rule.trade_team && rule.trade_team === tradeTeam) {
    score += 30
    details.push('班组精确匹配+30')
  } else if (!rule.trade_team) {
    // 通用规则，不加分也不扣分
  } else {
    // 班组不匹配，此规则不适用
    return null
  }

  const fullText = (itemName + ' ' + spec).toLowerCase()

  // ---- 2. 排除词检查 ----
  if (rule.exclude_keywords) {
    const excludes = rule.exclude_keywords.split(/[,，、\s]+/).filter(Boolean)
    for (const ex of excludes) {
      if (fullText.includes(ex.toLowerCase())) {
        return null // 命中排除词，直接跳过
      }
    }
  }

  // ---- 3. 关键词组匹配（分号=AND，逗号=OR） ----
  if (rule.keyword_groups) {
    const groups = rule.keyword_groups.split(';').filter(Boolean)
    let allGroupsHit = true
    let hitCount = 0

    for (const group of groups) {
      const terms = group.split(/[,，、\s]+/).filter(Boolean)
      const anyHit = terms.some(t => fullText.includes(t.toLowerCase()))
      if (anyHit) {
        hitCount++
        details.push(`词组[${group}]命中`)
      } else {
        allGroupsHit = false
      }
    }

    // 每组至少命中一个词 => 全部命中
    if (allGroupsHit && groups.length > 0) {
      score += 40 + hitCount * 5 // 基础分 + 额外命中奖励
      details.push(`全部词组命中+${40 + hitCount * 5}`)
    } else if (hitCount > 0) {
      // 部分命中，可以加少量分但分数低
      score += hitCount * 8
      details.push(`部分词组命中+${hitCount * 8}`)
    }
  }

  // ---- 4. sort_order 优先级加分 ----
  const orderBonus = Math.max(0, 10 - (rule.sort_order || 0))
  score += orderBonus

  // ---- 5. 最低门槛：至少30分才认为匹配 ----
  if (score < 30) return null

  const matchDetail = details.join(' | ')
  return { ...rule, score, matchDetail }
}

export const auxiliaryRules = {
  list: async (): Promise<AuxiliaryRule[]> => {
    const { data, error } = await (supabase.from('auxiliary_rules') as any)
      .select('*')
      .order('sort_order', { ascending: true })

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

  /**
   * 语言匹配：根据项目名称+特征描述+班组，对辅材规则做多维评分匹配
   * @returns 按得分降序排列的匹配规则
   */
  matchByItem: async (tradeTeam: string, itemName: string, spec?: string): Promise<MatchedRule[]> => {
    // 1. 查出所有规则（条件允许的话可以优化为只查相关班组）
    let query = (supabase.from('auxiliary_rules') as any).select('*')
      .or(`trade_team.eq.${tradeTeam},trade_team.is.null`)

    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) throw error

    const allRules: AuxiliaryRule[] = data || []
    const specText = spec || ''

    // 2. 对每条规则做语言评分
    const scored: MatchedRule[] = []
    for (const rule of allRules) {
      const result = scoreRule(rule, tradeTeam, itemName, specText)
      if (result) scored.push(result)
    }

    // 3. 按得分降序
    scored.sort((a, b) => b.score - a.score)
    return scored
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

  /** 计算单条规则的辅材费 */
  calcCost: (rule: AuxiliaryRule, qty: number): number => {
    const price = Number(rule.unit_price) || 0
    const params = rule.params || {}

    switch (rule.calc_method) {
      case 'fixed':
        return price * qty
      case 'thickness': {
        // 厚度(m) × 面积(m²) × 单价(元/m³) × 损耗系数
        const t = Number(params.thickness) || 0.02
        const loss = Number(params.loss) || 1.05
        return t * qty * price * loss
      }
      case 'ratio': {
        // 用量系数 × 面积 × 单价 × 损耗
        const r = Number(params.ratio) || 1
        const loss = Number(params.loss) || 1.1
        return r * qty * price * loss
      }
      case 'per_unit': {
        // 每m²用N套 × 面积 × 单价 × 损耗
        const per = Number(params.per) || 1
        const loss = Number(params.loss) || 1.05
        return per * qty * price * loss
      }
      default:
        return 0
    }
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
