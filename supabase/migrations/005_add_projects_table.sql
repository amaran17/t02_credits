-- 项目/商机表
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  party_id UUID REFERENCES public.parties(id),
  industry TEXT NOT NULL CHECK (industry IN ('文旅', '住建', '传媒', '体育')),
  stage TEXT NOT NULL CHECK (stage IN ('方案阶段', '招投标过程', '已签合同', '项目暂停', '项目关闭')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_party_id ON public.projects(party_id);
CREATE INDEX idx_projects_industry ON public.projects(industry);

-- 触发器自动更新 updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 策略
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Leaders can manage projects" ON public.projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );