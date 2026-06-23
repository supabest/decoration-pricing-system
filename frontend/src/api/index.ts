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
