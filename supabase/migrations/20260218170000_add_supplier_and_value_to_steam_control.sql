ALTER TABLE steam_control_records ADD COLUMN supplier TEXT;
ALTER TABLE steam_control_records ADD COLUMN value NUMERIC DEFAULT 0;
