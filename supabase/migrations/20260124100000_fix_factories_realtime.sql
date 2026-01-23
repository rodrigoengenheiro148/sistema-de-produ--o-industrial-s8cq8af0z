-- Enable RLS on factories table
ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;

-- Create policies for factories table
DO $$
BEGIN
    -- SELECT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'factories' AND policyname = 'Users can view own factories'
    ) THEN
        CREATE POLICY "Users can view own factories" ON public.factories
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'factories' AND policyname = 'Users can insert own factories'
    ) THEN
        CREATE POLICY "Users can insert own factories" ON public.factories
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'factories' AND policyname = 'Users can update own factories'
    ) THEN
        CREATE POLICY "Users can update own factories" ON public.factories
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    -- DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'factories' AND policyname = 'Users can delete own factories'
    ) THEN
        CREATE POLICY "Users can delete own factories" ON public.factories
        FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Add factories table to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'factories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.factories;
  END IF;
END
$$;
