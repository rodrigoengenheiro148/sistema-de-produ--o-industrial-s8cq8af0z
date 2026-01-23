-- Add fco_threshold column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notification_settings' AND column_name = 'fco_threshold') THEN
        ALTER TABLE notification_settings ADD COLUMN fco_threshold NUMERIC DEFAULT 0;
        -- Initialize with farinha_threshold value if available, assuming they represent the same business goal initially
        UPDATE notification_settings SET fco_threshold = farinha_threshold;
    END IF;
END $$;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to check yields and trigger alert
CREATE OR REPLACE FUNCTION check_production_yields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    settings RECORD;
    sebo_yield NUMERIC := 0;
    fco_yield NUMERIC := 0;
    farinheta_yield NUMERIC := 0;
    total_yield NUMERIC := 0;
    mp NUMERIC := 0;
    payload JSONB;
    violation_found BOOLEAN := FALSE;
BEGIN
    -- Get MP Used (avoid division by zero)
    mp := COALESCE(NEW.mp_used, 0);
    IF mp <= 0 THEN
        RETURN NEW;
    END IF;

    -- Calculate Yields
    sebo_yield := (COALESCE(NEW.sebo_produced, 0) / mp) * 100;
    fco_yield := (COALESCE(NEW.fco_produced, 0) / mp) * 100;
    farinheta_yield := (COALESCE(NEW.farinheta_produced, 0) / mp) * 100;
    total_yield := ((COALESCE(NEW.sebo_produced, 0) + COALESCE(NEW.fco_produced, 0) + COALESCE(NEW.farinheta_produced, 0)) / mp) * 100;

    -- Get Notification Settings for the User
    SELECT * INTO settings FROM notification_settings WHERE user_id = NEW.user_id LIMIT 1;

    -- If no settings or everything disabled, exit
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Check Thresholds (Only if threshold is set > 0)
    IF (settings.sebo_threshold > 0 AND sebo_yield < settings.sebo_threshold) OR
       (settings.fco_threshold > 0 AND fco_yield < settings.fco_threshold) OR
       (settings.farinheta_threshold > 0 AND farinheta_yield < settings.farinheta_threshold) OR
       (settings.yield_threshold > 0 AND total_yield < settings.yield_threshold) THEN
        violation_found := TRUE;
    END IF;

    -- If violation found, trigger Edge Function via pg_net
    IF violation_found THEN
        payload := jsonb_build_object(
            'productionData', row_to_json(NEW),
            'user_id', NEW.user_id,
            'source', 'database_trigger'
        );

        -- Perform HTTP POST to the Edge Function
        -- Note: The URL is specific to this project context
        PERFORM net.http_post(
            url := 'https://cbmpujaahiqcehapnboj.supabase.co/functions/v1/send-brevo-alert',
            body := payload,
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create Trigger on Production Table
DROP TRIGGER IF EXISTS trg_check_yield_on_production ON production;

CREATE TRIGGER trg_check_yield_on_production
AFTER INSERT OR UPDATE ON production
FOR EACH ROW
EXECUTE FUNCTION check_production_yields();
