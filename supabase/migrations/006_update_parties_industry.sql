-- 为 work_records.project_id 添加索引（外键已在 004 中添加）
CREATE INDEX IF NOT EXISTS idx_work_records_project_id ON public.work_records(project_id);

-- 更新 RLS 策略 - 确保 leaders 可以更新 work_records 的 weight
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaders can update work_records weight" ON public.work_records;

CREATE POLICY "Leaders can update work_records weight" ON public.work_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'leader')
  );