BEGIN;

DO $$
DECLARE
  -- List of all operational tables that need realtime updates
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
  -- 1. Ensure the supabase_realtime publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY tables LOOP
    -- 2. Set Replica Identity to FULL
    -- This ensures that the full row (including unchanged columns) is sent in the update payload.
    -- This is crucial for filtering by factory_id if the factory_id itself isn't changed.
    EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);

    -- 3. Add table to publication if it's not already there
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;

    -- 4. Ensure RLS is enabled (Best Practice)
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END
$$;

COMMIT;
