BEGIN;

-- 1. Ensure operational tables have REPLICA IDENTITY FULL
-- This ensures that the full row is sent in the realtime event payload (UPDATE/DELETE)
ALTER TABLE IF EXISTS raw_materials REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS production REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS shipping REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS acidity_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS quality_records REPLICA IDENTITY FULL;
-- factories was handled in a previous migration, but good to be consistent if needed.

-- 2. Ensure tables are in the supabase_realtime publication
DO $$
DECLARE
  tables text[] := ARRAY['raw_materials', 'production', 'shipping', 'acidity_records', 'quality_records', 'factories'];
  t text;
BEGIN
  -- Create publication if it doesn't exist (idempotent check)
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Loop through tables and add them if not already present in the publication
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

COMMIT;
