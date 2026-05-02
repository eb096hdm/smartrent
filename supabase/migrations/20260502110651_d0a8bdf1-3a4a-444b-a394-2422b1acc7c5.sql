CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  geburtsdatum DATE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefon TEXT NOT NULL,
  datenschutz_akzeptiert BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) may insert their own registration. No SELECT/UPDATE/DELETE policies => only service role can read/modify.
CREATE POLICY "Anyone can register"
  ON public.registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (datenschutz_akzeptiert = true);

-- Validation trigger: enforce age >= 18
CREATE OR REPLACE FUNCTION public.validate_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.geburtsdatum > (CURRENT_DATE - INTERVAL '18 years') THEN
    RAISE EXCEPTION 'Die Nutzung ist erst ab 18 Jahren möglich.';
  END IF;
  IF NEW.datenschutz_akzeptiert IS NOT TRUE THEN
    RAISE EXCEPTION 'Datenschutz muss akzeptiert werden.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_registration
  BEFORE INSERT OR UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.validate_registration();