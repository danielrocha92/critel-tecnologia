ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS assinatura_datahora TIMESTAMP WITH TIME ZONE;

NOTIFY pgrst, 'reload schema';
