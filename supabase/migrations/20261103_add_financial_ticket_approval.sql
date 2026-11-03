ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS financeiro_aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS financeiro_aprovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tickets_pending_financial_approval_idx
  ON public.tickets (criado_em DESC)
  WHERE status = 'FINALIZADO'
    AND protocolo_origem LIKE 'OS-%'
    AND financeiro_aprovado_em IS NULL;

NOTIFY pgrst, 'reload schema';
