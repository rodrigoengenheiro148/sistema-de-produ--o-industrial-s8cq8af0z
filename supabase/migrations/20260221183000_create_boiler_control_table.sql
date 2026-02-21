CREATE TABLE IF NOT EXISTS boiler_control_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    cald_01_pct NUMERIC DEFAULT 0,
    cald_01_m3 NUMERIC DEFAULT 0,
    cald_02_pct NUMERIC DEFAULT 0,
    cald_02_m3 NUMERIC DEFAULT 0,
    wood_entry_pct NUMERIC DEFAULT 0,
    wood_entry_m3 NUMERIC DEFAULT 0,
    initial_stock_pct NUMERIC DEFAULT 0,
    initial_stock_m3 NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, factory_id)
);

ALTER TABLE boiler_control_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on boiler control" 
ON boiler_control_records FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE boiler_control_records;

