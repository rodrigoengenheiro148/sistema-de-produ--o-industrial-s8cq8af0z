-- Add new columns for Farinorte Steam Control
-- Using IF NOT EXISTS to prevent errors if columns were already added by another migration
ALTER TABLE steam_control_records ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 0;
ALTER TABLE steam_control_records ADD COLUMN IF NOT EXISTS package_count NUMERIC DEFAULT 0;
ALTER TABLE steam_control_records ADD COLUMN IF NOT EXISTS volume_m3 NUMERIC DEFAULT 0;
