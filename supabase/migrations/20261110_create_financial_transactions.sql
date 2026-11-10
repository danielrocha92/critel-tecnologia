ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS financeiro_aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS financeiro_aprovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.transacoes_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
  valor_servico NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (valor_servico >= 0),
  valor_despesas NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (valor_despesas >= 0),
  data_competencia DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_liquidacao DATE,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'LIQUIDADO')),
  metodo_pagamento TEXT CHECK (metodo_pagamento IS NULL OR metodo_pagamento IN ('PIX', 'BOLETO', 'TRANSFERENCIA')),
  origem TEXT NOT NULL DEFAULT 'MANUAL' CHECK (origem IN ('MANUAL', 'OS_TECNICO')),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  tecnico_id UUID,
  pagamento_imediato BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_excecao TEXT,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transacoes_financeiras_liquidacao_check CHECK (
    (status = 'PENDENTE' AND data_liquidacao IS NULL AND metodo_pagamento IS NULL)
    OR (status = 'LIQUIDADO' AND data_liquidacao IS NOT NULL AND metodo_pagamento IS NOT NULL)
  ),
  CONSTRAINT transacoes_financeiras_excecao_check CHECK (
    NOT pagamento_imediato OR (origem = 'OS_TECNICO' AND motivo_excecao IS NOT NULL AND btrim(motivo_excecao) <> '')
  ),
  CONSTRAINT transacoes_financeiras_origem_os_check CHECK (
    (origem = 'OS_TECNICO' AND tipo = 'DESPESA' AND ticket_id IS NOT NULL AND tecnico_id IS NOT NULL)
    OR (origem = 'MANUAL' AND ticket_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS transacoes_financeiras_ticket_os_uidx
  ON public.transacoes_financeiras (ticket_id)
  WHERE origem = 'OS_TECNICO';

CREATE INDEX IF NOT EXISTS transacoes_financeiras_competencia_idx
  ON public.transacoes_financeiras (data_competencia DESC, tipo);

CREATE INDEX IF NOT EXISTS transacoes_financeiras_vencimento_idx
  ON public.transacoes_financeiras (data_vencimento, status);

ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.transacoes_financeiras FROM anon, authenticated;
GRANT SELECT ON public.transacoes_financeiras TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transacoes_financeiras TO service_role;

DROP POLICY IF EXISTS transacoes_financeiras_leitura_autorizada ON public.transacoes_financeiras;
CREATE POLICY transacoes_financeiras_leitura_autorizada
  ON public.transacoes_financeiras
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfis profile
      WHERE profile.user_id = auth.uid()
        AND profile.status = 'ATIVO'
        AND (
          profile.cargo IN ('FINANCEIRO', 'ANALISTA', 'ADMIN', 'SUPER_ADMIN')
          OR (profile.cargo IN ('TECNICO', 'TÉCNICO') AND transacoes_financeiras.tecnico_id = auth.uid())
        )
    )
  );

CREATE OR REPLACE FUNCTION public.finalizar_os_com_lancamento_financeiro(
  p_ticket_id UUID,
  p_actor_id UUID
)
RETURNS public.transacoes_financeiras
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ticket public.tickets%ROWTYPE;
  v_transaction public.transacoes_financeiras%ROWTYPE;
  v_service_value NUMERIC(14, 2);
  v_expense_value NUMERIC(14, 2);
  v_competencia DATE;
  v_due_date DATE;
  v_changed_at TIMESTAMPTZ := NOW();
BEGIN
  SELECT *
  INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id
    AND protocolo_origem LIKE 'OS-%'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada.';
  END IF;

  IF v_ticket.status <> 'FINALIZADO' OR v_ticket.financeiro_aprovado_em IS NOT NULL THEN
    RAISE EXCEPTION 'Esta OS não está aguardando validação financeira.';
  END IF;

  IF v_ticket.tecnico_id IS NULL THEN
    RAISE EXCEPTION 'A OS precisa ter um técnico vinculado antes do fechamento.';
  END IF;

  SELECT COALESCE(v_ticket.valor_pagamento, p.valor_pagamento, 0)
  INTO v_service_value
  FROM public.perfis p
  WHERE p.user_id = v_ticket.tecnico_id
  LIMIT 1;

  v_service_value := COALESCE(v_service_value, v_ticket.valor_pagamento, 0);

  SELECT COALESCE(SUM(
    CASE
      WHEN COALESCE(item->>'valor_numerico', item->>'valor') ~ '^-?[0-9]+([.,][0-9]+)?$'
        THEN REPLACE(COALESCE(item->>'valor_numerico', item->>'valor'), ',', '.')::NUMERIC
      ELSE 0
    END
  ), 0)
  INTO v_expense_value
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(v_ticket.despesas_json) = 'array' THEN v_ticket.despesas_json
      ELSE '[]'::JSONB
    END
  ) AS item;

  IF v_service_value + v_expense_value <= 0 THEN
    RAISE EXCEPTION 'A OS precisa ter um valor de serviço ou despesas para gerar o lançamento financeiro.';
  END IF;

  v_competencia := COALESCE(
    (v_ticket.checkout_at AT TIME ZONE 'America/Sao_Paulo')::DATE,
    (v_ticket.criado_em AT TIME ZONE 'America/Sao_Paulo')::DATE,
    CURRENT_DATE
  );
  v_due_date := (
    DATE_TRUNC('month', v_competencia)::DATE
    + CASE WHEN EXTRACT(DAY FROM v_competencia) = 1 THEN INTERVAL '14 days' ELSE INTERVAL '1 month 14 days' END
  )::DATE;

  INSERT INTO public.transacoes_financeiras (
    tipo, descricao, categoria, valor, valor_servico, valor_despesas, data_competencia, data_vencimento,
    status, origem, ticket_id, tecnico_id, criado_por, atualizado_em
  )
  VALUES (
    'DESPESA',
    'Pagamento técnico — ' || COALESCE(v_ticket.protocolo_origem, LEFT(v_ticket.id::TEXT, 8)),
    'SERVIÇO TÉCNICO',
    v_service_value + v_expense_value,
    v_service_value,
    v_expense_value,
    v_competencia,
    v_due_date,
    'PENDENTE',
    'OS_TECNICO',
    v_ticket.id,
    v_ticket.tecnico_id,
    p_actor_id,
    v_changed_at
  )
  ON CONFLICT (ticket_id) WHERE origem = 'OS_TECNICO'
  DO UPDATE SET
    descricao = EXCLUDED.descricao,
    valor = EXCLUDED.valor,
    valor_servico = EXCLUDED.valor_servico,
    valor_despesas = EXCLUDED.valor_despesas,
    data_competencia = EXCLUDED.data_competencia,
    data_vencimento = EXCLUDED.data_vencimento,
    data_liquidacao = NULL,
    status = 'PENDENTE',
    metodo_pagamento = NULL,
    pagamento_imediato = FALSE,
    motivo_excecao = NULL,
    criado_por = EXCLUDED.criado_por,
    atualizado_em = EXCLUDED.atualizado_em
  RETURNING * INTO v_transaction;

  UPDATE public.tickets
  SET status = 'FECHADO',
      financeiro_aprovado_em = v_changed_at,
      financeiro_aprovado_por = p_actor_id,
      atualizado_em = v_changed_at
  WHERE id = v_ticket.id;

  INSERT INTO public.ticket_transitions (
    ticket_id, from_status, to_status, changed_by, reason
  )
  VALUES (
    v_ticket.id, 'FINALIZADO', 'FECHADO', p_actor_id,
    'OS validada e encerrada pelo departamento responsável.'
  );

  RETURN v_transaction;
END;
$$;

REVOKE ALL ON FUNCTION public.finalizar_os_com_lancamento_financeiro(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalizar_os_com_lancamento_financeiro(UUID, UUID) TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'transacoes_financeiras'
    )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transacoes_financeiras;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
