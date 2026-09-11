-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Principal de Chamados (Fila de Atendimento)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocolo_origem VARCHAR(100) NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
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
-- FASE 3: INTEGRAÇÃO WHATSAPP NATIVA (META CLOUD API)
-- =========================================================================

-- 4. Tabela de Conversas (Lista de Contatos ativos)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telefone VARCHAR(30) UNIQUE NOT NULL, -- Ex: 5511999999999
    nome_perfil VARCHAR(150),
    ultimo_status VARCHAR(50) DEFAULT 'ABERTA', -- ABERTA, RESPONDIDA, FECHADA
    ultima_mensagem_data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversa_id UUID REFERENCES public.whatsapp_conversas(id) ON DELETE CASCADE,
    wa_message_id VARCHAR(150) UNIQUE, -- ID único da mensagem gerado pela Meta (wamid...)
    direcao VARCHAR(20) NOT NULL, -- 'INBOUND' (cliente -> critel) ou 'OUTBOUND' (critel -> cliente)
    tipo_mensagem VARCHAR(30) DEFAULT 'text', -- text, image, document, audio
    conteudo TEXT, -- O corpo da mensagem ou URL da mídia
    status VARCHAR(30) DEFAULT 'delivered', -- sent, delivered, read (para outbound)
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas de desenvolvimento temporárias para as tabelas do WhatsApp (Desativar em produção)
DROP POLICY IF EXISTS "Permitir full access anônimo temporário conversas" ON public.whatsapp_conversas;
CREATE POLICY "Permitir full access anônimo temporário conversas" 
ON public.whatsapp_conversas FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir full access anônimo temporário mensagens" ON public.whatsapp_mensagens;
CREATE POLICY "Permitir full access anônimo temporário mensagens" 
ON public.whatsapp_mensagens FOR ALL USING (true);

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
    loja VARCHAR(150) UNIQUE NOT NULL, -- O nome ou ID da loja vindo do TomTicket
    gerente_nome VARCHAR(150),
    whatsapp_numero VARCHAR(30) NOT NULL,
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


