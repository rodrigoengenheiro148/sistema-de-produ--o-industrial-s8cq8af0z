CREATE TABLE IF NOT EXISTS digester_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    digester_name TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE digester_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on digester records" 
ON digester_records FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE digester_records;
