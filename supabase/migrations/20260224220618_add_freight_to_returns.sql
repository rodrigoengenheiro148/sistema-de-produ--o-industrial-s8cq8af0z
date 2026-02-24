ALTER TABLE public.returns ADD COLUMN outbound_freight NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.returns ADD COLUMN return_freight NUMERIC NOT NULL DEFAULT 0;
