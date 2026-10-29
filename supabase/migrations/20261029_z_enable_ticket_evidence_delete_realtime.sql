ALTER TABLE public.ticket_evidences REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';
