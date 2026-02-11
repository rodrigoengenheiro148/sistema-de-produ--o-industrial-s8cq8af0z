ALTER TABLE cooking_time_records ADD COLUMN total_hours NUMERIC;
ALTER TABLE cooking_time_records ALTER COLUMN start_time DROP NOT NULL;
