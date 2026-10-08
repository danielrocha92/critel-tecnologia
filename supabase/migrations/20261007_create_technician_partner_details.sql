CREATE TABLE IF NOT EXISTS public.tecnicos_detalhes (
    perfil_id UUID PRIMARY KEY REFERENCES public.perfis(id) ON DELETE CASCADE,
    situacao_cadastro TEXT,
    empresa TEXT,
    situacao_faiston TEXT,
    cpf TEXT,
    rg TEXT,
    endereco TEXT,
    cidade TEXT,
    estado VARCHAR(2),
    cep TEXT,
    telefone TEXT,
    email_contato TEXT,
    codigo_parceiro TEXT,
    especialidades TEXT,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tecnicos_detalhes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cargos autorizados leem detalhes de tecnicos" ON public.tecnicos_detalhes;
CREATE POLICY "Cargos autorizados leem detalhes de tecnicos"
ON public.tecnicos_detalhes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.perfis
        WHERE perfis.user_id = auth.uid()
          AND perfis.cargo IN ('ANALISTA', 'FINANCEIRO', 'ADMIN', 'SUPER_ADMIN')
          AND perfis.status = 'ATIVO'
    )
);

DROP POLICY IF EXISTS "Administradores alteram detalhes de tecnicos" ON public.tecnicos_detalhes;
CREATE POLICY "Administradores alteram detalhes de tecnicos"
ON public.tecnicos_detalhes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.perfis
        WHERE perfis.user_id = auth.uid()
          AND perfis.cargo IN ('ADMIN', 'SUPER_ADMIN')
          AND perfis.status = 'ATIVO'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis
        WHERE perfis.user_id = auth.uid()
          AND perfis.cargo IN ('ADMIN', 'SUPER_ADMIN')
          AND perfis.status = 'ATIVO'
    )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tecnicos_detalhes TO authenticated;
GRANT ALL ON public.tecnicos_detalhes TO service_role;

NOTIFY pgrst, 'reload schema';
