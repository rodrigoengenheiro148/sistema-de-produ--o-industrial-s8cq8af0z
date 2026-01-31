-- Migration to fix Dashboard Realtime errors and enable subscriptions for all operational tables

DO $$
DECLARE
  -- List of all tables that need Realtime enabled
  -- Includes tables used in Dashboard cards and requested in Acceptance Criteria
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
  -- 1. Create the supabase_realtime publication if it doesn't exist
  -- This is the default publication used by the client SDK
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    -- 2. Enable Row Level Security (RLS)
    -- RLS is required for policies to work, which control who can subscribe
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);

    -- 3. Set Replica Identity to FULL
    -- This ensures that for UPDATE/DELETE events, the old record is available
    -- which is crucial for realtime consistency
    EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);

    -- 4. Add table to the supabase_realtime publication
    -- We check if it's already there to avoid errors
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;

    -- 5. Create a SELECT policy for authenticated users
    -- Realtime subscription requires SELECT permission on the table
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Enable read access for authenticated users'
    ) THEN
      EXECUTE format('CREATE POLICY "Enable read access for authenticated users" ON %I FOR SELECT TO authenticated USING (true)', t);
    END IF;
    
    -- 6. Ensure INSERT/UPDATE/DELETE policies exist for authenticated users
    -- This ensures the app can write data, avoiding other runtime errors
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Enable insert access for authenticated users'
    ) THEN
      EXECUTE format('CREATE POLICY "Enable insert access for authenticated users" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Enable update access for authenticated users'
    ) THEN
      EXECUTE format('CREATE POLICY "Enable update access for authenticated users" ON %I FOR UPDATE TO authenticated USING (true)', t);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = t 
      AND policyname = 'Enable delete access for authenticated users'
    ) THEN
      EXECUTE format('CREATE POLICY "Enable delete access for authenticated users" ON %I FOR DELETE TO authenticated USING (true)', t);
    END IF;
  END LOOP;
END
$$;
