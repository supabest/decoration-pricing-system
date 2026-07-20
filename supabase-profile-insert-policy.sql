-- ============================================
-- 为 profiles 表添加 INSERT 策略
-- 在 Supabase Dashboard → SQL Editor 中执行
-- 目的：允许客户端在注册时自行创建 profile 行，
--       不再依赖数据库 trigger handle_new_user()
-- ============================================

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
