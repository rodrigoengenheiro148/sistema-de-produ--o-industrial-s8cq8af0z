ALTER TABLE sebo_inventory_records DROP CONSTRAINT IF EXISTS sebo_inventory_records_category_check;
ALTER TABLE sebo_inventory_records ADD CONSTRAINT sebo_inventory_records_category_check CHECK (category IN ('tank', 'extra', 'Sebo', 'Óleo', 'Farinha de Sangue', 'Farinha de Penas', 'Torta de Carne', 'Farinha de Vísceras', 'Farinha de Peixe'));
