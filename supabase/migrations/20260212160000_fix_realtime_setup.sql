BEGIN;

-- Ensure all operational tables have REPLICA IDENTITY FULL for proper realtime updates
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
    'daily_production_forecasts',
    'factories'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I REPLICA IDENTITY FULL', t);
  END LOOP;
END
$$;

-- Ensure publication exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- Add tables to publication
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
    'daily_production_forecasts',
    'factories'
  ];
  t text;
BEGIN
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
