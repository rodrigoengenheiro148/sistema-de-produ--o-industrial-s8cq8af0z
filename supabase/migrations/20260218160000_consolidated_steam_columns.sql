-- Add new columns for Farinorte Steam Control safely
ALTER TABLE steam_control_records ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 0;
ALTER TABLE steam_control_records ADD COLUMN IF NOT EXISTS package_count NUMERIC DEFAULT 0;
ALTER TABLE steam_control_records ADD COLUMN IF NOT EXISTS volume_m3 NUMERIC DEFAULT 0;
