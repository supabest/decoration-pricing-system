// API 基础配置
const API_BASE = '/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('未登录')
  }

  if (res.status === 402) {
    // 试用到期
    throw { status: 402, message: '试用已结束，请付费后继续使用' }
  }

  const data = await res.json()
  if (!res.ok) {
    throw { status: res.status, message: data.detail || '请求失败' }
  }
  return data
}

// --- Auth ---
export interface UserInfo {
  id: number; username: string; display_name?: string
  is_admin: boolean; user_type: string; is_paid: boolean
  trial_expires_at?: string; trial_days: number
}
export interface LoginResponse {
  access_token: string; token_type: string; user: UserInfo
}

export const auth = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string, display_name?: string) =>
    request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, display_name }),
    }),
  me: () => request<UserInfo>('/auth/me'),
}

// --- Benchmark Prices ---
export interface BenchmarkItem {
  id: number; trade_team: string; internal_code?: string
  work_type?: string; item_name: string; spec?: string
  unit: string; unit_price: number; remark?: string; created_at: string
}
export interface BenchmarkList {
  items: BenchmarkItem[]; total: number; page: number
  page_size: number; total_pages: number
}
export interface TradeTeam {
  trade_team: string; count: number; min_price: number; max_price: number
}
export interface WorkTypeInfo {
  work_type: string; trade_team: string; count: number
}
export interface PricingRule {
  id: number; title: string; content: string; version: string; created_at?: string
}

export const benchmark = {
  list: (params: { trade_team?: string; work_type?: string; keyword?: string; page?: number; page_size?: number }) => {
    const q = new URLSearchParams()
    if (params.trade_team) q.set('trade_team', params.trade_team)
    if (params.work_type) q.set('work_type', params.work_type)
    if (params.keyword) q.set('keyword', params.keyword)
    if (params.page) q.set('page', String(params.page))
    if (params.page_size) q.set('page_size', String(params.page_size))
    return request<{ items: BenchmarkItem[]; total: number; page: number; page_size: number; total_pages: number }>(`/benchmark-prices?${q}`)
  },
  teams: () => request<TradeTeam[]>('/benchmark-prices/teams'),
  workTypes: (trade_team?: string) => {
    const q = trade_team ? `?trade_team=${encodeURIComponent(trade_team)}` : ''
    return request<WorkTypeInfo[]>(`/benchmark-prices/work-types${q}`)
  },
  getItem: (id: number) => request<BenchmarkItem>(`/benchmark-prices/${id}`),
  getRules: () => request<PricingRule | null>('/benchmark-prices/rules/current'),
}
