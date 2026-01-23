BEGIN;

-- 1. Ensure factories table has REPLICA IDENTITY FULL to receive full row data on updates/deletes
ALTER TABLE factories REPLICA IDENTITY FULL;

-- 2. Ensure factories table is in the supabase_realtime publication
DO $$
BEGIN
  -- Create publication if it doesn't exist (safety check)
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add table to publication if not already present
  -- This handles the case where it might already be there safely
  ALTER PUBLICATION supabase_realtime ADD TABLE factories;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, ignore error
END $$;

COMMIT;
