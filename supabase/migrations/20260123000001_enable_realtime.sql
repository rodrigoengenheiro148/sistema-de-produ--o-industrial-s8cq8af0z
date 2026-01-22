-- Add tables to the supabase_realtime publication to enable real-time subscriptions
-- This fixes the CHANNEL_ERROR by ensuring the server allows broadcasting changes for these tables.

ALTER PUBLICATION supabase_realtime ADD TABLE raw_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE production;
ALTER PUBLICATION supabase_realtime ADD TABLE shipping;
ALTER PUBLICATION supabase_realtime ADD TABLE acidity_records;
ALTER PUBLICATION supabase_realtime ADD TABLE quality_records;
ALTER PUBLICATION supabase_realtime ADD TABLE factories;
