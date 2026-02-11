CREATE TABLE daily_production_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL REFERENCES factories(id),
  date DATE NOT NULL,
  mp_forecast NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  UNIQUE(factory_id, date)
);

ALTER TABLE daily_production_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own forecasts" ON daily_production_forecasts
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
