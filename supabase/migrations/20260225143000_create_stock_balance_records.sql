CREATE TABLE IF NOT EXISTS public.stock_balance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE NOT NULL,
    product_code TEXT NOT NULL,
    description TEXT NOT NULL,
    weight_kg NUMERIC NOT NULL DEFAULT 0,
    quantity_units INTEGER NOT NULL DEFAULT 0,
    is_filial_row BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stock_balance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.stock_balance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.stock_balance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON public.stock_balance_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete access for authenticated users" ON public.stock_balance_records FOR DELETE TO authenticated USING (true);

DO $$
DECLARE
    v_factory_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_factory_id FROM public.factories WHERE name ILIKE '%Reciclagem%' LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF v_factory_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.stock_balance_records WHERE factory_id = v_factory_id) THEN
            INSERT INTO public.stock_balance_records (factory_id, user_id, product_code, description, weight_kg, quantity_units, is_filial_row) VALUES
            (v_factory_id, v_user_id, 'PP000001', 'FARINHA DE CARNE E OSSO', 0, 0, false),
            (v_factory_id, v_user_id, 'PP000006', 'FARINHA DE CARNE E OSSO ESPECIAL', 32580, 25, false),
            (v_factory_id, v_user_id, 'PP000011', 'FARINHA VISCERAS DE AVES', 0, 0, false),
            (v_factory_id, v_user_id, 'PP000012', 'FARINHA DE PEIXE', 0, 0, false),
            (v_factory_id, v_user_id, 'PP000002', 'FARINHA DE SANGUE', 0, 0, false),
            (v_factory_id, v_user_id, '', 'ESTOQUE QUE ESTA NA FILIAL:', 31100, 0, true);
        END IF;
    END IF;
END $$;
