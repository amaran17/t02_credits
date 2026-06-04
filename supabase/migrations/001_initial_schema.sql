-- 用户表 (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'leader')) DEFAULT 'manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 客户档案表
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL CHECK (industry IN ('文旅', '住建', '传媒', '体育')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 工作记录表
CREATE TABLE IF NOT EXISTS public.work_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  project_name TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  industry TEXT NOT NULL CHECK (industry IN ('文旅', '住建', '传媒', '体育')),
  stage TEXT NOT NULL CHECK (stage IN ('方案阶段', '招投标过程', '已签合同', '项目暂停', '项目关闭')),
  customer_manager TEXT NOT NULL,
  support_role TEXT NOT NULL CHECK (support_role IN ('一线支撑', '二线支撑')),
  support_units TEXT[] DEFAULT '{}',
  work_content TEXT NOT NULL,
  work_date DATE NOT NULL,
  work_categories TEXT[] DEFAULT '{}',
  work_weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for work_records
CREATE INDEX idx_work_records_user_id ON public.work_records(user_id);
CREATE INDEX idx_work_records_work_date ON public.work_records(work_date);
CREATE INDEX idx_work_records_industry ON public.work_records(industry);
CREATE INDEX idx_work_records_customer_id ON public.work_records(customer_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_records_updated_at
  BEFORE UPDATE ON public.work_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 工作权重配置表
CREATE TABLE IF NOT EXISTS public.weight_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_category TEXT NOT NULL UNIQUE,
  weight INTEGER NOT NULL DEFAULT 1,
  is_default BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 招投标权重配置表（按人配置）
CREATE TABLE IF NOT EXISTS public.bid_weight_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES public.profiles(id) NOT NULL,
  weight INTEGER NOT NULL DEFAULT 5,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(manager_id)
);

-- 大模型配置表
CREATE TABLE IF NOT EXISTS public.model_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_url TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 邀请码表
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_weight_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Leaders can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Customers policies
CREATE POLICY "Anyone can view customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create customers" ON public.customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creators can update customers" ON public.customers
  FOR UPDATE USING (created_by = auth.uid());

-- Work Records policies
CREATE POLICY "Users can view own records" ON public.work_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Leaders can view all records" ON public.work_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "Users can create own records" ON public.work_records
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records" ON public.work_records
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Leaders can update any records" ON public.work_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Weight Configs policies
CREATE POLICY "Leaders can manage weight configs" ON public.weight_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Bid Weight Configs policies
CREATE POLICY "Leaders can manage bid weight configs" ON public.bid_weight_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Model Configs policies
CREATE POLICY "Leaders can manage model configs" ON public.model_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

-- Invite Codes policies
CREATE POLICY "Leaders can manage invite codes" ON public.invite_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "Anyone can use valid invite codes" ON public.invite_codes
  FOR SELECT USING (used = false AND expires_at > NOW());

-- Insert default weight configs
INSERT INTO public.weight_configs (work_category, weight, is_default) VALUES
  ('内部部门需求对接', 1, true),
  ('生态交流', 1, true),
  ('简单方案', 2, true),
  ('复杂方案', 5, true),
  ('日常方案汇报', 3, true),
  ('客户简单交流', 2, true),
  ('招投标', 5, true),
  ('流程支撑', 1, true),
  ('方案审核', 1, true),
  ('培训', 1, true),
  ('内部会议', 1, true),
  ('高层汇报/展厅讲解', 5, true)
ON CONFLICT (work_category) DO NOTHING;