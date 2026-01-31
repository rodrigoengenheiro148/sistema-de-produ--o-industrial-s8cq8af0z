ALTER TABLE public.downtime_records ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.downtime_records ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
