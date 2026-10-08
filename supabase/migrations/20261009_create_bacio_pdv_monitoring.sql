CREATE TABLE IF NOT EXISTS public.bacio_pdv_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_codigo TEXT NOT NULL,
  pdv_codigo TEXT NOT NULL,
  pdv_nome TEXT NOT NULL,
  status_conexao TEXT NOT NULL CHECK (status_conexao IN ('ONLINE', 'OFFLINE')),
  ultima_verificacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bacio_pdv_status_store_terminal_key UNIQUE (loja_codigo, pdv_codigo)
);

CREATE INDEX IF NOT EXISTS bacio_pdv_status_store_idx
  ON public.bacio_pdv_status (loja_codigo);

ALTER TABLE public.bacio_pdv_status ENABLE ROW LEVEL SECURITY;
