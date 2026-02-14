CREATE TABLE public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    date DATE NOT NULL,
    supplier TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC NOT NULL,
    factory_id UUID NOT NULL REFERENCES public.factories(id),
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.returns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.returns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON public.returns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON public.returns
    FOR DELETE USING (auth.uid() = user_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.returns;
