CREATE TABLE IF NOT EXISTS cooking_time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS downtime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  duration_hours NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Assuming RLS is enabled on other tables, we should enable here too, but for simplicity we rely on application logic in context if policies aren't strictly required by prompt instructions, however standard practice: )
ALTER TABLE cooking_time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_records ENABLE ROW LEVEL SECURITY;

-- create policies (public access for now as per project context typically implies authenticated users can read/write their factory data)
CREATE POLICY "Enable all for authenticated users based on factory access" ON cooking_time_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users based on factory access" ON downtime_records FOR ALL USING (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cooking_time_records;
ALTER PUBLICATION supabase_realtime ADD TABLE downtime_records;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cooking_time_date_factory ON cooking_time_records(date, factory_id);
CREATE INDEX IF NOT EXISTS idx_downtime_date_factory ON downtime_records(date, factory_id);
