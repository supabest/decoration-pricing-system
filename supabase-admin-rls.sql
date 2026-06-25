-- ============================================
-- 管理员权限扩展：允许管理员查看所有项目
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 管理员查看所有项目
CREATE POLICY "projects_select_admin" ON public.projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 管理员删除项目
CREATE POLICY "projects_delete_admin" ON public.projects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
