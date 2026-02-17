ALTER TABLE public.production ADD COLUMN IF NOT EXISTS visceras_meal_produced NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.production ADD COLUMN IF NOT EXISTS feather_meal_produced NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.production ADD COLUMN IF NOT EXISTS fish_meal_produced NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.production ADD COLUMN IF NOT EXISTS visceras_oil_produced NUMERIC NOT NULL DEFAULT 0;
