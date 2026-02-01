BEGIN;

-- 1. Ensure REPLICA IDENTITY FULL for all operational tables
-- This ensures that the full row is sent in the realtime event payload, critical for UPDATE/DELETE
ALTER TABLE IF EXISTS raw_materials REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS production REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS shipping REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS acidity_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS quality_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS cooking_time_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS downtime_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS steam_control_records REPLICA IDENTITY FULL;

-- 2. Ensure publication exists (idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- 3. Add tables to publication
-- Specifically adding steam_control_records which was missing and causing subscription errors
DO $$
DECLARE
  tables text[] := ARRAY[
    'raw_materials', 
    'production', 
    'shipping', 
    'acidity_records', 
    'quality_records', 
    'cooking_time_records', 
    'downtime_records', 
    'steam_control_records'
  ];
  t text;
BEGIN
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

-- 4. Enable RLS and Policies for raw_materials
-- Ensuring permissions are correct for authenticated users to avoid RLS related subscription errors
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Check and create policy for all operations for authenticated users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'raw_materials' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users" ON raw_materials FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END
$$;

COMMIT;
