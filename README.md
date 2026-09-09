# Critel Tecnologia & Critel Core

Este repositório contém não apenas o site institucional da **Critel Tecnologia**, mas também a plataforma de operações internas **Critel Core** (Intranet & Central de Atendimento), construídos utilizando as tecnologias mais modernas de desenvolvimento web visando alta performance e produtividade.

## 🚀 Tecnologias Utilizadas

Este projeto foi desenvolvido com as seguintes ferramentas:

- [Next.js 16](https://nextjs.org/) - Framework React para renderização híbrida (App Router) e APIs Serverless.
- [React 19](https://react.dev/) - Biblioteca JavaScript para construção de interfaces de usuário.
- [TypeScript](https://www.typescriptlang.org/) - Superset tipado do JavaScript para maior segurança do código.
- [Supabase](https://supabase.com/) - Backend as a Service (BaaS) com PostgreSQL, Realtime WebSockets e RLS.
- **CSS Modules** - Metodologia de estilização modular, com design em *Glassmorphism*.

---

## ⚙️ Módulos e Funcionalidades

### 1. Site Institucional
Focado em branding e marketing corporativo:
- **Header/Footer**: Navegação global, seletor de idiomas (PT, EN, ES) e branding.
- **ScrollReveal**: Animações suaves de fade-in ao longo da rolagem.
- **Ações Flutuantes**: Botões adaptativos de WhatsApp e navegação rápida.

### 2. Critel Core (Intranet / Painel de Atendimento)
A plataforma interna (acessível via `/atendimento`) automatiza e concentra a operação de suporte técnico:

- **Fila de Chamados Automática**: Integração via **Webhooks** com o **TomTicket**, processando e categorizando chamados (ex: *Radar de Obras* e *Chamados Comuns*) em tempo real no Supabase.
- **Micro-CRM Dinâmico (Integração WhatsApp)**: Elimina o uso de planilhas de Excel. O sistema puxa automaticamente os contatos das lojas. Se o contato não existir, um formulário "on-the-fly" permite o cadastro e acionamento do WhatsApp Web do cliente de forma instantânea. API segura com *Service Role* faz bypass seguro de RLS.
- **Radar de PDVs (Milvus)**: Integração *On-Demand* com a plataforma Milvus. Ao abrir um chamado, o painel central dispara uma consulta assíncrona ao Milvus que devolve (via WebSockets em tempo real) a disponibilidade (Online/Offline) do terminal da loja na tela do atendente.
- **Gerador de Salas Jitsi**: Atalho prático no chat (`/video`) que gera links de salas virtuais únicas e seguras para os técnicos e gerentes de loja interagirem sem necessidade de celulares.
- **Cofre Zero Trust (SSO Proxy)**: Sistema de redirecionamento interno e seguro para acesso a sistemas terceiros (Stoq ERP, Milvus) ocultando credenciais do frontend.

---

## 💻 Como rodar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- Configuração do **Supabase** (Projetos: `tickets`, `lojas_contatos`, `status_pdv`)
- Configuração de chaves no arquivo `.env.local`

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/danielrocha92/critel-tecnologia.git
cd critel-tecnologia
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_admin
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse [http://localhost:3000](http://localhost:3000) (Site) ou [http://localhost:3000/pt/atendimento](http://localhost:3000/pt/atendimento) (Critel Core).

---

Desenvolvido para e pela **Critel Tecnologia**.
