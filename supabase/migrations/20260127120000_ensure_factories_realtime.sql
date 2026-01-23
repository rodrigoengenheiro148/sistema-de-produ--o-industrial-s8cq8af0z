BEGIN;

-- 1. Ensure factories table has REPLICA IDENTITY FULL
-- This is critical for receiving full row data on updates and deletes
ALTER TABLE factories REPLICA IDENTITY FULL;

-- 2. Ensure RLS is enabled on factories table
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

-- 3. Re-create the SELECT policy for authenticated users
-- We drop and recreate to ensure the policy definition is exactly what we need
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON factories;

CREATE POLICY "Enable read access for authenticated users"
ON factories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Ensure factories table is in the supabase_realtime publication
DO $$
BEGIN
  -- Create publication if it doesn't exist (safety check)
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add table to publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'factories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE factories;
  END IF;
END
$$;

COMMIT;
