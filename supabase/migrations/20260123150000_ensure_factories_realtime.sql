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
