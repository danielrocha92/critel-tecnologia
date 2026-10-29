ALTER TABLE public.ticket_evidences
  ADD COLUMN IF NOT EXISTS caption TEXT;

NOTIFY pgrst, 'reload schema';
