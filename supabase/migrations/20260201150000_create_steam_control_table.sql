CREATE TABLE IF NOT EXISTS steam_control_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    soy_waste NUMERIC DEFAULT 0,
    firewood NUMERIC DEFAULT 0,
    rice_husk NUMERIC DEFAULT 0,
    wood_chips NUMERIC DEFAULT 0,
    steam_consumption NUMERIC DEFAULT 0,
    factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, factory_id)
);

-- Enable RLS
ALTER TABLE steam_control_records ENABLE ROW LEVEL SECURITY;

-- Create Policies (mimicking existing pattern)
CREATE POLICY "Enable read access for authenticated users" ON steam_control_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON steam_control_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON steam_control_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON steam_control_records FOR DELETE TO authenticated USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE steam_control_records;
