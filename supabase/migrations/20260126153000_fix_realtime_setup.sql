BEGIN;

-- 1. Set Replica Identity to FULL for factories to ensure all columns are sent during updates
-- This allows the client to receive the full row data on UPDATE/DELETE events
ALTER TABLE factories REPLICA IDENTITY FULL;

-- 2. Enable RLS on factories (idempotent, ensures security is active)
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

-- 3. Ensure a SELECT policy exists for authenticated users
-- Realtime requires users to have SELECT permission on the table to receive broadcasts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'factories' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
    ON factories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 4. Add critical tables to supabase_realtime publication
-- We loop through the tables and add them if they are not already present
DO $$
DECLARE
  -- List of tables to track for the dashboard
  tables text[] := ARRAY['factories', 'raw_materials', 'production', 'shipping', 'acidity_records', 'quality_records'];
  t text;
BEGIN
  -- Ensure publication exists (standard in Supabase projects)
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    -- Check if table is already in publication to avoid errors
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

COMMIT;
