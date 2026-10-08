-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Principal de Chamados (Fila de Atendimento)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocolo_origem VARCHAR(100) NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    departamento VARCHAR(150),
    categoria VARCHAR(150),
    prioridade VARCHAR(50),
    email_cliente VARCHAR(150),
    status VARCHAR(50) DEFAULT 'NOVO',
    analista_id UUID REFERENCES public.perfis(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela Radar de Obras (Oportunidades Isoladas da Fila)
CREATE TABLE IF NOT EXISTS public.radar_obras_mobilizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_origem_id UUID REFERENCES public.tickets(id),
    loja_afetada VARCHAR(150) NOT NULL,
    trecho_detectado TEXT NOT NULL,
    status_oportunidade VARCHAR(50) DEFAULT 'PENDENTE',
    data_alerta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Monitoramento de Rede (Proxy Milvus)
CREATE TABLE IF NOT EXISTS public.status_pdv (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja VARCHAR(150) UNIQUE NOT NULL,
    status_conexao VARCHAR(20) DEFAULT 'OFFLINE', -- ONLINE ou OFFLINE
    ultima_verificacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) para proteção
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_obras_mobilizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_pdv ENABLE ROW LEVEL SECURITY;

-- Política inicial: Apenas leitura para usuários autenticados no Supabase
DROP POLICY IF EXISTS "Permitir leitura para analistas logados" ON public.tickets;
CREATE POLICY "Permitir leitura para analistas logados" 
ON public.tickets FOR SELECT USING (auth.role() = 'authenticated');

-- =========================================================================
-- FASE 1: AUTENTICAÇÃO E COFRE DE SENHAS
-- =========================================================================

-- 6. Tabela de Perfis de Usuário (Estendendo auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(150),
    nome VARCHAR(150) NOT NULL,
    cargo VARCHAR(50) DEFAULT 'ANALISTA', -- ADMIN, ANALISTA, TECNICO
    status VARCHAR(50) DEFAULT 'ATIVO', -- ATIVO, BANIDO
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detalhes pessoais acessíveis a Analista, Financeiro, Admin e Super Admin ativos.
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
USING (EXISTS (
    SELECT 1 FROM public.perfis
    WHERE perfis.user_id = auth.uid()
      AND perfis.cargo IN ('ANALISTA', 'FINANCEIRO', 'ADMIN', 'SUPER_ADMIN')
      AND perfis.status = 'ATIVO'
));
DROP POLICY IF EXISTS "Administradores alteram detalhes de tecnicos" ON public.tecnicos_detalhes;
CREATE POLICY "Administradores alteram detalhes de tecnicos"
ON public.tecnicos_detalhes FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.perfis
    WHERE perfis.user_id = auth.uid()
      AND perfis.cargo IN ('ADMIN', 'SUPER_ADMIN')
      AND perfis.status = 'ATIVO'
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.perfis
    WHERE perfis.user_id = auth.uid()
      AND perfis.cargo IN ('ADMIN', 'SUPER_ADMIN')
      AND perfis.status = 'ATIVO'
));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tecnicos_detalhes TO authenticated;
GRANT ALL ON public.tecnicos_detalhes TO service_role;

-- 7. Tabela do Cofre de Credenciais
CREATE TABLE IF NOT EXISTS public.cofre_credenciais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sistema VARCHAR(100) NOT NULL, -- Ex: 'Stoq', 'Milvus'
    usuario_login VARCHAR(150) NOT NULL,
    senha_criptografada TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cofre_credenciais ENABLE ROW LEVEL SECURITY;

-- Políticas para Perfis
DROP POLICY IF EXISTS "Permitir leitura de perfis para autenticados" ON public.perfis;
CREATE POLICY "Permitir leitura de perfis para autenticados" 
ON public.perfis FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para Cofre de Credenciais (Apenas Service Role / Backend pode ler)
-- Usuários normais NÃO têm acesso direto a essa tabela pelo front-end (Zero Trust)
DROP POLICY IF EXISTS "Bloquear acesso direto ao cofre pelo client" ON public.cofre_credenciais;
CREATE POLICY "Bloquear acesso direto ao cofre pelo client" 
ON public.cofre_credenciais FOR ALL USING (false);

-- =========================================================================
-- FASE 2: MÓDULO DE CONTATOS DINÂMICOS
-- =========================================================================

-- 8. Tabela de Relacionamento Lojas e Contatos
CREATE TABLE IF NOT EXISTS public.lojas_contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja VARCHAR(150) UNIQUE NOT NULL,
    gerente_nome VARCHAR(150),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.lojas_contatos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura e escrita para analistas" ON public.lojas_contatos;
CREATE POLICY "Permitir leitura e escrita para analistas" 
ON public.lojas_contatos FOR ALL USING (auth.role() = 'authenticated');

-- =========================================================================
-- FASE 4: INTRANET E GOVERNANÇA (SSO E COMUNICADOS)
-- =========================================================================

-- 9. Tabela de Log de Auditoria (Tracking SSO)
CREATE TABLE IF NOT EXISTS public.auditoria_acessos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    sistema_destino VARCHAR(100) NOT NULL,
    ip_origem VARCHAR(50),
    user_agent TEXT,
    data_acesso TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de Comunicados
CREATE TABLE IF NOT EXISTS public.comunicados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'INFO', -- INFO, ALERTA, MANUTENCAO
    ativo BOOLEAN DEFAULT TRUE,
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.auditoria_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- Políticas de Auditoria
DROP POLICY IF EXISTS "Permitir inserção de auditoria pelo backend/usuário logado" ON public.auditoria_acessos;
CREATE POLICY "Permitir inserção de auditoria pelo backend/usuário logado" 
ON public.auditoria_acessos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Apenas admin vê auditoria" ON public.auditoria_acessos;
CREATE POLICY "Apenas admin vê auditoria" 
ON public.auditoria_acessos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.perfis WHERE perfis.user_id = auth.uid() AND cargo = 'ADMIN')
);

-- Políticas de Comunicados
DROP POLICY IF EXISTS "Leitura de comunicados para todos autenticados" ON public.comunicados;
CREATE POLICY "Leitura de comunicados para todos autenticados" 
ON public.comunicados FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Apenas admin gerencia comunicados" ON public.comunicados;
CREATE POLICY "Apenas admin gerencia comunicados" 
ON public.comunicados FOR ALL USING (
  EXISTS (SELECT 1 FROM public.perfis WHERE perfis.user_id = auth.uid() AND cargo = 'ADMIN')
);



-- =========================================================================
-- FASE 5: FLUXO DE EXECUCAO DO CHAMADO (OS) E CHECK-IN
-- =========================================================================

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS tecnico_id UUID REFERENCES public.perfis(id),
ADD COLUMN IF NOT EXISTS endereco VARCHAR(255),
ADD COLUMN IF NOT EXISTS check_in_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS check_in_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checkout_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS checkout_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS checkout_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evidencia_antes_base64 TEXT,
ADD COLUMN IF NOT EXISTS evidencia_depois_base64 TEXT,
ADD COLUMN IF NOT EXISTS despesas_json JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS assinatura_datahora TIMESTAMP WITH TIME ZONE;
