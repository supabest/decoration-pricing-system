-- ============================================
-- 装修成本分析系统 - Supabase 建表脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 1. 用户配置表（扩展 Supabase Auth）
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT,
  is_admin    BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. 基准价库
CREATE TABLE public.benchmark_items (
  id            BIGSERIAL PRIMARY KEY,
  trade_team    TEXT NOT NULL,
  internal_code TEXT,
  work_type     TEXT,
  item_name     TEXT NOT NULL,
  spec          TEXT,
  unit          TEXT NOT NULL,
  unit_price    NUMERIC(12,2) NOT NULL,
  remark        TEXT,
  updated_by    UUID REFERENCES public.profiles(id),
  version       INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_benchmark_trade_team ON public.benchmark_items(trade_team);

-- 3. 基准价说明
CREATE TABLE public.benchmark_notes (
  id        BIGSERIAL PRIMARY KEY,
  title     TEXT NOT NULL DEFAULT '基准价说明',
  content   TEXT NOT NULL,
  version   TEXT DEFAULT '2025',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 历史套价方案
CREATE TABLE public.projects (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  global_coef   NUMERIC(5,2) DEFAULT 1.00,
  proj_team     TEXT,
  proj_date     TEXT,
  hourly_rate   NUMERIC(8,2) DEFAULT 350,
  groups_json   JSONB NOT NULL,
  row_count     INTEGER DEFAULT 0,
  priced_count  INTEGER DEFAULT 0,
  is_shared     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_projects_user ON public.projects(user_id);

-- 5. 意见反馈
CREATE TABLE public.feedback (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name   TEXT,
  fb_type     TEXT NOT NULL,
  fb_ref      TEXT,
  fb_desc     TEXT NOT NULL,
  proj_name   TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_feedback_status ON public.feedback(status);

-- ============================================
-- RLS 行级安全策略
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.benchmark_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "benchmark_read_approved" ON public.benchmark_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true));
CREATE POLICY "benchmark_write_admin" ON public.benchmark_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE public.benchmark_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_read_approved" ON public.benchmark_notes
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true));
CREATE POLICY "notes_write_admin" ON public.benchmark_notes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select_own_or_shared" ON public.projects
  FOR SELECT USING (user_id = auth.uid() OR is_shared = true);
CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (user_id = auth.uid());

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_insert_all" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_select_admin" ON public.feedback
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
