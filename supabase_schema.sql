-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Principal de Chamados (Fila de Atendimento)
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocolo_origem VARCHAR(100) NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status VARCHAR(50) DEFAULT 'NOVO',
    analista_id UUID, -- Será referenciado à tabela de perfis de usuários no futuro
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela Radar de Obras (Oportunidades Isoladas da Fila)
CREATE TABLE public.radar_obras_mobilizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_origem_id UUID REFERENCES public.tickets(id),
    loja_afetada VARCHAR(150) NOT NULL,
    trecho_detectado TEXT NOT NULL,
    status_oportunidade VARCHAR(50) DEFAULT 'PENDENTE',
    data_alerta TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Monitoramento de Rede (Proxy Milvus)
CREATE TABLE public.status_pdv (
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
CREATE POLICY "Permitir leitura para analistas logados" 
ON public.tickets FOR SELECT USING (auth.role() = 'authenticated');

-- =========================================================================
-- FASE 3: INTEGRAÇÃO WHATSAPP NATIVA (META CLOUD API)
-- =========================================================================

-- 4. Tabela de Conversas (Lista de Contatos ativos)
CREATE TABLE public.whatsapp_conversas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telefone VARCHAR(30) UNIQUE NOT NULL, -- Ex: 5511999999999
    nome_perfil VARCHAR(150),
    ultimo_status VARCHAR(50) DEFAULT 'ABERTA', -- ABERTA, RESPONDIDA, FECHADA
    ultima_mensagem_data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Mensagens do WhatsApp
CREATE TABLE public.whatsapp_mensagens (
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
CREATE POLICY "Permitir full access anônimo temporário conversas" 
ON public.whatsapp_conversas FOR ALL USING (true);

CREATE POLICY "Permitir full access anônimo temporário mensagens" 
ON public.whatsapp_mensagens FOR ALL USING (true);

