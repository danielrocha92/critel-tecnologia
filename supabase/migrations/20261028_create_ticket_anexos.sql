CREATE TABLE IF NOT EXISTS public.ticket_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL DEFAULT 'application/octet-stream',
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_anexos_ticket_id_idx
  ON public.ticket_anexos (ticket_id);

ALTER TABLE public.ticket_anexos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read ticket attachments metadata"
  ON public.ticket_anexos;
CREATE POLICY "Authenticated users can read ticket attachments metadata"
  ON public.ticket_anexos FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.ticket_anexos TO authenticated;

NOTIFY pgrst, 'reload schema';
