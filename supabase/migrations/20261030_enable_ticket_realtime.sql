-- Tabelas usadas pelas inscricoes Realtime da central e das notificacoes.
DO $$
BEGIN
  IF to_regclass('public.tickets') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'tickets'
    ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets';
  END IF;

  IF to_regclass('public.ticket_replies') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'ticket_replies'
    ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_replies';
  END IF;
END;
$$;

-- O hook de notificacoes compara o status anterior e o atual do chamado.
ALTER TABLE IF EXISTS public.tickets REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';
