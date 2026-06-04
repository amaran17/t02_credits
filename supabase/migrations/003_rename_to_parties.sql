-- 将 customers 表重命名为 parties
ALTER TABLE public.customers RENAME TO parties;

-- 添加 type 字段区分客户/生态伙伴
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'customer' CHECK (type IN ('customer', 'ecosystem'));

-- 添加主营业务字段
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS main_business TEXT;

-- 更新 RLS 策略（表名变了）
DROP POLICY IF EXISTS "Anyone can view customers" ON public.parties;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.parties;
DROP POLICY IF EXISTS "Creators can update customers" ON public.parties;

CREATE POLICY "Anyone can view parties" ON public.parties FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create parties" ON public.parties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creators can update parties" ON public.parties FOR UPDATE USING (created_by = auth.uid());