-- AI 知识库表：套价技巧 / 同义词 / 项目特征识别规则
CREATE TABLE public.ai_knowledge (
  id          BIGSERIAL PRIMARY KEY,
  category    TEXT NOT NULL,              -- 技巧 / 同义词 / 特征规则
  keyword     TEXT NOT NULL,              -- 关键词
  content     TEXT NOT NULL,              -- 描述
  team        TEXT DEFAULT '',            -- 适用班组（可选）
  updated_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ai_knowledge_category ON public.ai_knowledge(category);

ALTER TABLE public.ai_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_read_approved" ON public.ai_knowledge
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_approved = true));
CREATE POLICY "knowledge_write_admin" ON public.ai_knowledge
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
