CREATE TABLE public.restaurant_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK (kind IN ('product','table','order','customer','promotion','expense','task','staff','settings')),
 data jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.restaurant_records TO service_role;
ALTER TABLE public.restaurant_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX restaurant_records_kind_created ON public.restaurant_records(kind, created_at DESC);