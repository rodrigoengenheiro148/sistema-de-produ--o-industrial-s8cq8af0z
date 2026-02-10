BEGIN;

-- 1. Ensure the supabase_realtime publication exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- 2. Enable Realtime for specific tables (Add to publication and set Replica Identity)
DO $$
DECLARE
  tables_to_add text[] := ARRAY[
    'raw_materials', 
    'production', 
    'shipping', 
    'acidity_records', 
    'quality_records', 
    'cooking_time_records', 
    'downtime_records', 
    'steam_control_records',
    'sebo_inventory_records',
    'factories'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables_to_add LOOP
    -- Set Replica Identity to FULL to ensure all columns are available in updates (crucial for filtering)
    EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);

    -- Add table to publication if it's not already included
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END
$$;

COMMIT;
