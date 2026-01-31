-- Enable RLS and Realtime for all Dashboard tables to fix subscription errors

DO $$
DECLARE
  tables text[] := ARRAY[
    'raw_materials', 
    'production', 
    'shipping', 
    'acidity_records', 
    'quality_records', 
    'cooking_time_records', 
    'downtime_records'
  ];
  t text;
BEGIN
  -- 1. Create publication if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    -- 2. Enable RLS (Idempotent)
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);

    -- 3. Set Replica Identity Full (Idempotent)
    EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);

    -- 4. Add to publication if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;

    -- 5. Create SELECT policy for authenticated users if not exists
    -- This ensures that the realtime subscription (which requires SELECT permission) works
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Enable read access for authenticated users'
    ) THEN
      EXECUTE format('CREATE POLICY "Enable read access for authenticated users" ON %I FOR SELECT TO authenticated USING (true)', t);
    END IF;
  END LOOP;
END
$$;
