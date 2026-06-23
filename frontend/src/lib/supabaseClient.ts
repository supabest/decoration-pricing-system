import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/** @description 是否有完整的 Supabase 配置 */
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

/** @description Supabase 客户端（配置缺失时返回占位对象，运行时在 UI 层报错） */
let client: ReturnType<typeof createClient>
try {
  client = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')
} catch {
  client = createClient('https://placeholder.supabase.co', 'placeholder')
}

export const supabase = client
