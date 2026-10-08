ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS resolucao JSONB;

NOTIFY pgrst, 'reload schema';
