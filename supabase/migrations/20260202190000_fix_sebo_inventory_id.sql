-- Ensure the id column has the default value for UUID generation
ALTER TABLE sebo_inventory_records ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure the id column is NOT NULL
ALTER TABLE sebo_inventory_records ALTER COLUMN id SET NOT NULL;
