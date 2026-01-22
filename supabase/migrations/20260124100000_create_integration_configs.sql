CREATE TABLE integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  base_url TEXT,
  username TEXT,
  password TEXT,
  client_id TEXT,
  client_secret TEXT,
  sync_inventory BOOLEAN DEFAULT false,
  sync_production BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- Create Policy
CREATE POLICY "Users can manage their own integration configs" ON integration_configs
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_integration_configs_user_id ON integration_configs(user_id);
