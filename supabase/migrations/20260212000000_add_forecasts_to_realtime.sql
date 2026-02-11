BEGIN;

-- Ensure daily_production_forecasts has REPLICA IDENTITY FULL to support realtime deletes/updates properly
ALTER TABLE IF EXISTS daily_production_forecasts REPLICA IDENTITY FULL;

-- Add daily_production_forecasts to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'daily_production_forecasts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE daily_production_forecasts;
  END IF;
END
$$;

COMMIT;
