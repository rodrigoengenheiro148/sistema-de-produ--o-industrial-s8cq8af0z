ALTER TABLE notification_settings
ADD COLUMN brevo_api_key TEXT,
ADD COLUMN smtp_host TEXT,
ADD COLUMN smtp_port INTEGER,
ADD COLUMN smtp_user TEXT,
ADD COLUMN smtp_password TEXT;
