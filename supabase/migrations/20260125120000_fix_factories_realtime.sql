-- Fix Realtime for factories table

-- 1. Ensure Replica Identity is FULL to send all columns in updates.
-- This is often required for realtime to broadcast UPDATE/DELETE events correctly with all data.
ALTER TABLE factories REPLICA IDENTITY FULL;

-- 2. Ensure table is in the supabase_realtime publication.
-- We check if the table is already in the publication to avoid errors.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'factories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE factories;
  END IF;
END
$$;

-- 3. Explicitly verify RLS is enabled.
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

-- Note: The existing policy "Users can manage their own factories" allows SELECT, INSERT, UPDATE, DELETE 
-- for the owner, so we do not need to add a redundant SELECT policy. The realtime filter `user_id=eq.uid` 
-- will work correctly with the existing policy.
