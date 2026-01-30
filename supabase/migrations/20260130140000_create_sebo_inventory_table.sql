CREATE TABLE IF NOT EXISTS sebo_inventory_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  tank_number TEXT,
  quantity_lt NUMERIC DEFAULT 0,
  quantity_kg NUMERIC DEFAULT 0,
  acidity NUMERIC,
  moisture NUMERIC,
  impurity NUMERIC,
  soaps NUMERIC,
  iodine NUMERIC,
  label TEXT,
  category TEXT NOT NULL CHECK (category IN ('tank', 'extra')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure we can listen to changes
ALTER TABLE sebo_inventory_records REPLICA IDENTITY FULL;

-- Add to publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sebo_inventory_records;

-- Index for faster queries by date and factory
CREATE INDEX IF NOT EXISTS idx_sebo_inventory_date_factory ON sebo_inventory_records(date, factory_id);
