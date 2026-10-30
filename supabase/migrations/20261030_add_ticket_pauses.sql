CREATE TABLE IF NOT EXISTS public.ticket_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.perfis(id),
  reason_code TEXT NOT NULL CHECK (reason_code IN (
    'COMPRA_MATERIAL',
    'LINK_OPERADORA',
    'SEM_ENERGIA_OU_RACK',
    'INFRA_CIVIL',
    'MOBILIARIO_PDV',
    'RESTRICAO_SHOPPING',
    'AGUARDANDO_EQUIPAMENTO',
    'SEM_EPI_OU_ACESSO_ALTURA',
    'AGUARDANDO_TI_CLIENTE'
  )),
  description TEXT,
  contact_name TEXT NOT NULL,
  contact_role TEXT NOT NULL,
  expected_return_at TIMESTAMPTZ NOT NULL,
  evidence_url TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ticket_pauses_ticket_started_idx
  ON public.ticket_pauses (ticket_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.ticket_pause_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pause_id UUID NOT NULL REFERENCES public.ticket_pauses(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_pause_locations_pause_recorded_idx
  ON public.ticket_pause_locations (pause_id, recorded_at ASC);

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS pausa_atual_id UUID REFERENCES public.ticket_pauses(id),
  ADD COLUMN IF NOT EXISTS sla_pausado_segundos BIGINT NOT NULL DEFAULT 0
    CHECK (sla_pausado_segundos >= 0);

ALTER TABLE public.ticket_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_pause_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios autorizados leem pausas das OS" ON public.ticket_pauses;
CREATE POLICY "Usuarios autorizados leem pausas das OS"
  ON public.ticket_pauses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis p
      WHERE p.user_id = auth.uid()
        AND p.status = 'ATIVO'
        AND (
          p.cargo IN ('ANALISTA', 'ADMIN', 'SUPER_ADMIN')
          OR EXISTS (
            SELECT 1 FROM public.tickets t
            WHERE t.id = ticket_pauses.ticket_id
              AND (t.tecnico_id = p.id OR t.tecnico_id = p.user_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS "Somente analistas veem trajetos de pausas" ON public.ticket_pause_locations;
CREATE POLICY "Somente analistas veem trajetos de pausas"
  ON public.ticket_pause_locations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis p
      WHERE p.user_id = auth.uid()
        AND p.status = 'ATIVO'
        AND p.cargo IN ('ANALISTA', 'ADMIN', 'SUPER_ADMIN')
    )
  );

GRANT SELECT ON public.ticket_pauses, public.ticket_pause_locations TO authenticated;

NOTIFY pgrst, 'reload schema';
