-- Seed data for development/testing
-- Note: In production, profiles are created via Supabase Auth triggers

-- 示例客户/生态伙伴
INSERT INTO public.parties (name, industry, type) VALUES
  ('北京市文化和旅游局', '文旅', 'customer'),
  ('故宫博物院', '文旅', 'customer'),
  ('万科企业股份有限公司', '住建', 'customer'),
  ('中央电视台', '传媒', 'customer'),
  ('国家体育总局', '体育', 'customer')
ON CONFLICT (name) DO NOTHING;