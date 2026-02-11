-- Ensure policy for delete exists and allows authenticated users to delete records
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON steam_control_records;
  CREATE POLICY "Enable delete access for authenticated users" ON steam_control_records FOR DELETE TO authenticated USING (true);
END
$$;
