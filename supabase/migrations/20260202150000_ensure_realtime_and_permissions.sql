BEGIN;

-- Define tables to be configured for Realtime
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
    'steam_control_records',
    'sebo_inventory_records'
  ];
  t text;
BEGIN
  -- 1. Ensure publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    -- 2. Enable RLS
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);

    -- 3. Create Policy for Select (Authenticated users)
    -- We allow authenticated users to view all data for now to ensure Realtime works
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Enable read access for authenticated users'
    ) THEN
      EXECUTE format('CREATE POLICY "Enable read access for authenticated users" ON %I FOR SELECT TO authenticated USING (true)', t);
    END IF;

    -- 4. Create Policy for Insert/Update/Delete (Authenticated users)
    -- Ensuring users can perform operations if policies don't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Enable write access for authenticated users'
    ) THEN
      EXECUTE format('CREATE POLICY "Enable write access for authenticated users" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END IF;

    -- 5. Add to publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;

    -- 6. Set Replica Identity to FULL
    -- This ensures we get the full old record on updates/deletes
    EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);
    
  END LOOP;
END
$$;

COMMIT;
