-- Ensure acidity_records table is in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'acidity_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE acidity_records;
  END IF;
END
$$;
