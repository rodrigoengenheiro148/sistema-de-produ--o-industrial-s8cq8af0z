ALTER TABLE integration_configs ADD COLUMN IF NOT EXISTS api_token TEXT;
ALTER TABLE integration_configs ADD COLUMN IF NOT EXISTS api_documentation_url TEXT;
