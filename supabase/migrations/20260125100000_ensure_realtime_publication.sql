-- Ensure critical tables are in supabase_realtime publication for the dashboard
DO $$
DECLARE
  tables text[] := ARRAY['factories', 'raw_materials', 'production', 'shipping', 'acidity_records', 'quality_records'];
  t text;
BEGIN
  FOR t IN SELECT unnest(tables) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END
$$;
