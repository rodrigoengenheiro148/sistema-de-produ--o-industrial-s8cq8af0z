-- Add material_type column to daily_production_forecasts
ALTER TABLE daily_production_forecasts ADD COLUMN material_type TEXT NOT NULL DEFAULT 'Geral';

-- Drop the old unique constraint
ALTER TABLE daily_production_forecasts DROP CONSTRAINT daily_production_forecasts_factory_id_date_key;

-- Add new unique constraint including material_type
ALTER TABLE daily_production_forecasts ADD CONSTRAINT daily_production_forecasts_factory_id_date_material_type_key UNIQUE (factory_id, date, material_type);
