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
- **Ordens de Serviço e pausas de SLA**: O técnico responsável pode pausar uma OS em andamento pelo menu **Mais** e retomá-la quando o impedimento for resolvido. A pausa exige motivo, foto do impedimento, responsável local, cargo/função e previsão de retorno. O tempo pausado é acumulado no campo `sla_pausado_segundos` do chamado.
- **Motivos de pausa**: Compra de material; link da operadora pendente; falta de energia ou acesso ao rack; infraestrutura civil; mobiliário/PDV pendente; restrição de horário ou ruído no shopping; equipamento aguardado; falta de EPI/liberação de altura; e dependência da equipe de TI do cliente.
- **Rastreamento de compra de material**: Com permissão de GPS, o portal registra posições enquanto a tela da OS estiver aberta e o rastreamento do navegador continuar ativo. O trajeto no mapa fica disponível somente para analistas e administradores. O mapa usa OpenStreetMap por padrão; `NEXT_PUBLIC_OSM_TILE_URL` permite configurar outro endpoint de tiles. Consulte a [política de uso dos tiles do OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).
- **Ações da OS**: No menu **Mais**, imprimir abre a impressão do navegador, editar atualiza os dados da OS, log de alterações consulta as transições registradas, e pausar/retomar executa o fluxo de SLA. Cancelamento é permitido a analistas/administradores ou ao técnico responsável; exclusão é restrita a administradores. A finalização técnica abre o formulário com evidências e assinatura.
- **Histórico e relatório do técnico**: O histórico apresenta os dados do atendimento concluído, horários, endereço, coordenadas de check-in e encerramento, laudo, materiais e despesas. É possível selecionar um período e gerar um relatório para impressão ou salvar como PDF. O documento inclui os detalhes textuais e coordenadas, sem fotos, vídeos ou assinatura, para manter o arquivo leve.
- **Validação de OS e financeiro**: Após o técnico finalizar a OS, ela fica aguardando validação do analista. Ao aprová-la, o sistema fecha a OS e cria atomicamente uma transação de despesa para o técnico, com o valor do serviço e as despesas registradas no atendimento. A ação de devolver reabre a OS para ajustes e não libera o pagamento.
- **Contas e DRE**: O painel financeiro reúne contas a pagar e a receber, permite cadastrar lançamentos manuais, registrar a liquidação via Pix, boleto ou transferência e consultar o DRE por competência ou caixa. O livro financeiro pode ser filtrado por tipo e técnico. Despesas de OS compõem os reembolsos extras do balanço do técnico somente depois que a OS é aprovada pelo analista.
- **Ciclo de pagamento do técnico**: O ciclo padrão considera atendimentos do dia 2 ao dia 1 seguinte, com vencimento no dia 15. O gestor financeiro pode aprovar exceções de pagamento imediato para uma OS pendente, registrando o motivo.
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

### Banco de dados e migrations

Para habilitar pausas, validação financeira, persistência de notificações e as assinaturas Realtime usadas pela OS, aplique no projeto Supabase as migrations correspondentes do diretório `supabase/migrations`:

1. `20261030_add_ticket_pauses.sql` — cria os registros de pausa, os pontos de localização e os campos de SLA na tabela `tickets`.
2. `20261030_create_user_notifications.sql` — configura notificações persistentes por usuário e sua publicação Realtime.
3. `20261030_enable_ticket_realtime.sql` — publica `tickets` e, se existir, `ticket_replies` para as assinaturas da aplicação.
4. `20261103_add_financial_ticket_approval.sql` — adiciona os campos de aprovação financeira à OS.
5. `20261110_create_financial_transactions.sql` — cria o livro financeiro, suas políticas de acesso e a função transacional que fecha a OS e cria o lançamento a pagar ao técnico. A migration também publica as transações financeiras no Realtime.

Em uma instalação nova, aplique primeiro o schema base e as migrations anteriores necessárias. A API de pausas e ações administrativas também precisa de `SUPABASE_SERVICE_ROLE_KEY` configurada somente no servidor. Para o rastreamento, use HTTPS e permita acesso à localização no navegador; o registro ocorre enquanto a tela da OS permanece aberta.

Aplique as migrations na ordem cronológica pelo Supabase CLI ou pelo SQL Editor do projeto. Sem a migration `20261110_create_financial_transactions.sql`, a aprovação de OS não consegue registrar o pagamento e o resumo financeiro do técnico não exibirá os valores. A geração do relatório no Histórico usa a sessão autenticada e não requer dependências adicionais; ao imprimir, escolha **Salvar como PDF** no navegador.

---

Desenvolvido para e pela **Critel Tecnologia**.
