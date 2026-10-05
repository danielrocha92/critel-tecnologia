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
- **Ações Flutuantes**: Navegação rápida para voltar ao topo da página.

### 2. Critel Core (Intranet / Painel de Atendimento)
A plataforma interna (acessível via `/atendimento`) automatiza e concentra a operação de suporte técnico:

- **Fila de Atendimento e Chamados Autônomos**: Chamados internos consultados no Supabase, atualizados em tempo real e carregados em páginas para reduzir o tempo inicial de abertura. A gestão nativa de chamados mantém transições de status controladas pelo banco e refletidas imediatamente na operação.
- **Gestão de Contatos das Lojas**: Mantém os contatos das unidades em uma base interna, permitindo consultar e atualizar os dados usados pela operação.
- **Monitoramento de PDVs (Milvus)**: Consulta à plataforma Milvus pela ferramenta administrativa correspondente, com integração *On-Demand* para disponibilizar a disponibilidade (Online/Offline) do terminal da loja na tela do atendente.
- **Gerador de Salas Jitsi**: Atalho prático no chat (`/video`) que gera links de salas virtuais únicas e seguras para os técnicos e gerentes de loja interagirem sem necessidade de celulares.
- **Painel Comercial**: Consulta e pesquisa dos cadastros de lojas, sem canal externo de mensagens integrado.
- **Cofre Zero Trust (SSO Proxy)**: Sistema de redirecionamento interno e seguro para acesso a sistemas terceiros (Stoq ERP, Milvus) ocultando credenciais do frontend.

---

## 💻 Como rodar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 22.13.0 ou superior; versão do projeto: 22.23.3)
- Configuração do **Supabase** (Projetos: `tickets`, `lojas_contatos`, `status_pdv`)
- Configuração de chaves no arquivo `.env.local`

### Serviços Firebase usados

No Firebase Console, habilite:

- **Cloud Firestore**: usado para chamados/ordens de serviço, transições e resoluções. Crie o banco em modo nativo; as coleções são criadas quando o app grava os primeiros documentos.
- **Cloud Storage for Firebase**: usado para anexos, assinaturas e evidências de atendimento.

O login do app é feito pelo **Supabase Auth**. Firebase Authentication, Analytics, Hosting e Cloud Messaging não são usados atualmente. A identidade do Supabase não autentica automaticamente requisições ao Firebase; antes de liberar Firestore ou Storage em produção, implemente uma ponte de autenticação com Firebase ou mova essas operações para APIs server-side com Firebase Admin SDK. Não publique regras com leitura/escrita abertas.

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

3. Configure o `.env.local` (os valores do Firebase Web já foram preenchidos neste ambiente; não compartilhe o arquivo):
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_admin
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

4. No Windows com nvm-windows, ative a versão do projeto:
```powershell
nvm use 22.23.3
node -v
```
O comando `node -v` deve retornar `v22.23.3`. No macOS/Linux com nvm, use `nvm install` e `nvm use`.

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse [http://localhost:3000](http://localhost:3000) (Site) ou [http://localhost:3000/pt/atendimento](http://localhost:3000/pt/atendimento) (Critel Core).

---

Desenvolvido para e pela **Critel Tecnologia**.
