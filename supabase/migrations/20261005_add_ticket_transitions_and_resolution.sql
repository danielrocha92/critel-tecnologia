ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS resolucao JSONB;

CREATE TABLE IF NOT EXISTS public.ticket_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ticket_transitions_ticket_id_created_at_idx
ON public.ticket_transitions (ticket_id, created_at DESC);

ALTER TABLE public.ticket_transitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read ticket transitions"
ON public.ticket_transitions;
CREATE POLICY "Authenticated users can read ticket transitions"
ON public.ticket_transitions FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert ticket transitions"
ON public.ticket_transitions;
CREATE POLICY "Authenticated users can insert ticket transitions"
ON public.ticket_transitions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT, INSERT ON public.ticket_transitions TO authenticated;

NOTIFY pgrst, 'reload schema';