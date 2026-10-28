CREATE TABLE IF NOT EXISTS public.ticket_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('BEFORE', 'AFTER')),
  media_url TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_evidences_ticket_created_idx
  ON public.ticket_evidences (ticket_id, created_at DESC);

ALTER TABLE public.ticket_evidences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read ticket evidences"
  ON public.ticket_evidences;
CREATE POLICY "Authenticated users can read ticket evidences"
  ON public.ticket_evidences FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add ticket evidences"
  ON public.ticket_evidences;
CREATE POLICY "Authenticated users can add ticket evidences"
  ON public.ticket_evidences FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

GRANT SELECT, INSERT ON public.ticket_evidences TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ticket_evidences'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_evidences;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
