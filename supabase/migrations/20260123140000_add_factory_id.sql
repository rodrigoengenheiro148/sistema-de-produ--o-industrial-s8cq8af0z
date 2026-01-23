-- Add factory_id to operational tables
ALTER TABLE raw_materials ADD COLUMN factory_id UUID REFERENCES factories(id);
ALTER TABLE production ADD COLUMN factory_id UUID REFERENCES factories(id);
ALTER TABLE shipping ADD COLUMN factory_id UUID REFERENCES factories(id);
ALTER TABLE acidity_records ADD COLUMN factory_id UUID REFERENCES factories(id);
ALTER TABLE quality_records ADD COLUMN factory_id UUID REFERENCES factories(id);

-- Create index for performance
CREATE INDEX idx_raw_materials_factory_id ON raw_materials(factory_id);
CREATE INDEX idx_production_factory_id ON production(factory_id);
CREATE INDEX idx_shipping_factory_id ON shipping(factory_id);
CREATE INDEX idx_acidity_records_factory_id ON acidity_records(factory_id);
CREATE INDEX idx_quality_records_factory_id ON quality_records(factory_id);

-- Optional: Try to link existing orphan data to the user's first factory
-- This prevents data from disappearing from the dashboard immediately after migration
DO $$
DECLARE
    r RECORD;
    first_factory_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT user_id FROM factories LOOP
        -- Get the first factory created by this user
        SELECT id INTO first_factory_id FROM factories WHERE user_id = r.user_id ORDER BY created_at ASC LIMIT 1;
        
        IF first_factory_id IS NOT NULL THEN
            UPDATE raw_materials SET factory_id = first_factory_id WHERE user_id = r.user_id AND factory_id IS NULL;
            UPDATE production SET factory_id = first_factory_id WHERE user_id = r.user_id AND factory_id IS NULL;
            UPDATE shipping SET factory_id = first_factory_id WHERE user_id = r.user_id AND factory_id IS NULL;
            UPDATE acidity_records SET factory_id = first_factory_id WHERE user_id = r.user_id AND factory_id IS NULL;
            UPDATE quality_records SET factory_id = first_factory_id WHERE user_id = r.user_id AND factory_id IS NULL;
        END IF;
    END LOOP;
END $$;
