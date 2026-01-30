-- Fix Realtime and RLS configuration for Dashboard metrics

-- 1. Enable RLS for sebo_inventory_records if not enabled (safety measure)
ALTER TABLE IF EXISTS sebo_inventory_records ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for authenticated users for sebo_inventory_records if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sebo_inventory_records' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON sebo_inventory_records FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END
$$;

-- 3. Ensure all dashboard related tables have REPLICA IDENTITY FULL for complete payloads
ALTER TABLE IF EXISTS raw_materials REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS production REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS shipping REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS acidity_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS quality_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS cooking_time_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS downtime_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS sebo_inventory_records REPLICA IDENTITY FULL;

-- 4. Ensure publication exists and add all tables
DO $$
DECLARE
  -- List of tables required for Dashboard metrics
  tables text[] := ARRAY[
    'raw_materials', 
    'production', 
    'shipping', 
    'acidity_records', 
    'quality_records', 
    'cooking_time_records', 
    'downtime_records', 
    'sebo_inventory_records'
  ];
  t text;
BEGIN
  -- Create publication if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add each table to the publication if not already present
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END
$$;
