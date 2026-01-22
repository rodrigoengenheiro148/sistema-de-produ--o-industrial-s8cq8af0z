ALTER TABLE notification_settings
ADD COLUMN sebo_threshold NUMERIC DEFAULT 0,
ADD COLUMN farinheta_threshold NUMERIC DEFAULT 0,
ADD COLUMN farinha_threshold NUMERIC DEFAULT 0,
ADD COLUMN notification_email TEXT DEFAULT '',
ADD COLUMN notification_phone TEXT DEFAULT '';
