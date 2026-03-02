-- Convert time columns to timestamptz for full datetime support
-- First handle the end_time to ensure we correctly capture if the process crossed midnight
ALTER TABLE public.cooking_time_records
  ALTER COLUMN end_time TYPE TIMESTAMPTZ USING
    CASE
      WHEN end_time IS NOT NULL THEN
        CASE
          WHEN end_time::time < start_time::time THEN (date + interval '1 day' + end_time::time) AT TIME ZONE 'America/Sao_Paulo'
          ELSE (date + end_time::time) AT TIME ZONE 'America/Sao_Paulo'
        END
      ELSE NULL
    END,
  ALTER COLUMN start_time TYPE TIMESTAMPTZ USING
    CASE
      WHEN start_time IS NOT NULL THEN (date + start_time::time) AT TIME ZONE 'America/Sao_Paulo'
      ELSE NULL
    END;
