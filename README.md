# Critel Tecnologia & Critel Core

Este repositório contém não apenas o site institucional da **Critel Tecnologia**, mas também a plataforma de operações internas **Critel Core** (Intranet & Central de Atendimento), construídos utilizando as tecnologias mais modernas de desenvolvimento web visando alta performance e produtividade.

## 🚀 Tecnologias Utilizadas

Este projeto foi desenvolvido com as seguintes ferramentas:

- [Next.js 16](https://nextjs.org/) - Framework React para renderização híbrida (App Router) e APIs Serverless.
- [React 19](https://react.dev/) - Biblioteca JavaScript para construção de interfaces de usuário.
- [TypeScript](https://www.typescriptlang.org/) - Superset tipado do JavaScript para maior segurança do código.
- [Supabase](https://supabase.com/) - Backend as a Service (BaaS) com PostgreSQL, Realtime WebSockets e RLS.
- [Firebase](https://firebase.google.com/) - SDK e serviço legado mantidos no repositório, sem participação no fluxo operacional principal atual.
- **CSS Modules** - Metodologia de estilização modular, com design em *Glassmorphism*.

---

## ⚙️ Módulos e funcionalidades

O Critel Tecnologia reúne o site institucional e o Critel Core, uma intranet para operação de chamados, ordens de serviço, equipe de campo e financeiro. A disponibilidade de cada função depende do perfil do usuário, das variáveis de ambiente e das migrations aplicadas no Supabase.

### Site institucional

- **Idiomas**: conteúdo em português, inglês e espanhol, com navegação localizada.
- **Apresentação da empresa**: páginas inicial, institucional, clientes, certificações e prêmios, contato, privacidade e termos.
- **Portfólio de soluções**: páginas de suporte de TI empresarial, cabeamento estruturado, ativos de rede, segurança da informação, tecnologia predial, field services, Wi-Fi social, outsourcing, automação de estacionamento e segurança eletrônica.
- **Formulário de contato**: coleta nome, cargo, empresa, e-mail e desafio informado. **No estado atual, o envio é demonstrativo**: mostra uma confirmação na tela e limpa o formulário; não persiste nem encaminha a solicitação a um serviço externo.
- **SEO e navegação**: metadados por idioma, canonical e alternates, Open Graph, dados estruturados JSON-LD, navegação global e ações para voltar ao topo.

### Critel Core — acesso e navegação

- **Autenticação**: login pelo Supabase Auth. O perfil em `perfis` determina cargo e status; páginas e operações verificam permissões conforme o papel (por exemplo, técnico, analista, financeiro, comercial, administrador e superadministrador).
- **Painel inicial**: apresenta indicadores de OS e atalhos para os ambientes do analista, financeiro, comercial e OS. Os indicadores dependem das colunas e políticas disponíveis no banco.
- **Preferências de interface**: alternância entre tema claro e escuro.
- **Notificações**: sino com notificações persistentes e preferências para novos chamados, respostas e encerramentos; há opções de alerta sonoro e notificação nativa do navegador quando suportada e autorizada pelo usuário.
- **Compatibilidade de rotas**: `/atendimento` encaminha para o painel do analista ou para a OS indicada pelos parâmetros da URL.

### Chamados e ordens de serviço

- **Abertura pelo analista ou administrador**: registra cliente, assunto, descrição, equipe responsável, prioridade e, para suporte técnico, departamento, categoria e causa raiz. A descrição pode conter formatação e endereço da loja; é possível incluir anexos.
- **Atribuição e remuneração**: uma OS pode ser encaminhada a técnico ativo. Na atribuição, o fluxo permite indicar modalidade de pagamento (diária ou por chamado) e valor, que também é associado ao perfil do técnico.
- **Fila e acompanhamento**: listas de OS podem ser pesquisadas e filtradas por grupo de status, cliente e data. As mudanças de tickets no Supabase podem ser refletidas via Realtime nas telas inscritas.
- **Estados operacionais**: a operação distingue itens na fila/novos, abertos ou em andamento, pausados e concluídos. A OS concluída pelo técnico permanece em `FINALIZADO` aguardando validação; o fechamento financeiro muda para `FECHADO`.
- **Detalhes da OS**: consulta dados do cliente, assunto, descrição, endereço, classificação do problema, prioridade, valor do chamado, anexos e evidências do atendimento, além do histórico de transições.
- **Ações administrativas da OS**: analista, administrador ou técnico responsável podem editar campos permitidos e cancelar uma OS não encerrada. A exclusão é restrita a administrador/superadministrador. Ações são registradas no histórico de transições quando aplicável.
- **Anexos**: arquivos enviados na abertura são armazenados no Supabase Storage; o endpoint aceita até 20 arquivos por chamado e limita cada arquivo a 20 MB.

### Portal do técnico

- **Fila de trabalho**: consulta serviços atribuídos ou disponíveis, pesquisa por cliente/endereço/protocolo, filtra por cliente e data, e permite ao técnico assumir OS ainda não atribuídas quando habilitado.
- **Check-in**: registra início do atendimento com horário e coordenadas GPS, mediante permissão do navegador.
- **Execução e evidências**: permite registrar horários de início e término, descrição dos serviços, materiais utilizados, despesas, assinatura do responsável e evidências antes/depois. Mídias podem ser consultadas e removidas enquanto a OS ainda está em andamento, conforme as permissões.
- **Finalização técnica**: envia o laudo e muda o status para `FINALIZADO`, colocando a OS na fila de validação do analista; isso, por si só, não fecha a OS nem libera pagamento.
- **Pausas e SLA**: o técnico responsável pode pausar e retomar uma OS. Para pausar, informa motivo, contato e função do responsável no local, previsão de retorno, observações e foto do impedimento. O tempo de pausa é acumulado para controle do SLA.
- **Motivos de pausa**: compra de material, link da operadora pendente, falta de energia/acesso ao rack, infraestrutura civil, mobiliário/PDV pendente, restrição de horário/ruído, equipamento aguardado, falta de EPI/liberação de altura e dependência da equipe de TI do cliente.
- **Trajeto para compra de material**: quando aplicável, registra GPS durante a pausa enquanto o navegador mantiver a tela aberta, permissão e localização ativas. O trajeto é exibido para perfis autorizados. O mapa usa OpenStreetMap por padrão; `NEXT_PUBLIC_OSM_TILE_URL` permite definir outro servidor de tiles. Consulte a [política de uso dos tiles do OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).
- **Histórico**: lista atendimentos concluídos e mostra resumo, endereço (inclusive extraído de descrições antigas), horários e laudo. Detalhes adicionais, como localizações, causa, materiais e despesas, ficam em seção expansível.
- **Relatório de atendimentos**: seleciona datas inicial e final e prepara uma página de impressão que pode ser salva como PDF pelo navegador. Inclui dados textuais, endereço, horários, coordenadas, laudo e despesas; não incorpora fotos, vídeos nem assinatura. Há limite de 5.000 atendimentos por solicitação.
- **Balanço financeiro individual**: consulta os lançamentos do próprio técnico por ciclo, distinguindo total, serviços, reembolsos extras aprovados, pendências e valores pagos.

### Validação de OS e financeiro

- **Fila de validação**: analista/financeiro revisa OSs em `FINALIZADO`, consulta técnico, cliente, valores e abre os detalhes da ordem antes de tomar uma ação.
- **Aprovar e fechar**: ação atômica no banco valida o status, fecha a OS e cria ou atualiza uma única conta a pagar vinculada ao chamado. O lançamento soma valor do serviço e despesas declaradas; despesas aparecem como reembolsos no balanço do técnico após esta aprovação.
- **Devolver para ajustes**: reabre uma OS finalizada e a devolve ao técnico, sem liberar o lançamento financeiro.
- **Livro de transações**: reúne contas a pagar e a receber, lançamentos automáticos de OS e lançamentos manuais. O livro permite filtrar tipo e técnico, registrar pagamento/recebimento com data e método (Pix, boleto ou transferência) e acompanhar estados pendente, liquidado ou atrasado (atraso calculado pelo vencimento).
- **Exceção de pagamento imediato**: gestor financeiro pode antecipar uma conta de OS pendente, definir vencimento para hoje e registrar justificativa. A exceção não substitui o registro de liquidação.
- **DRE**: apresenta receitas, despesas e resultado por competência e por caixa liquidado, no mês selecionado.
- **Ciclo padrão**: competência de 2 de um mês a 1 do mês seguinte, com vencimento dia 15. Exceções imediatas são uma decisão do gestor, não a regra do ciclo.

### Administração, equipe e apoio à operação

- **Governança de identidade**: lista perfis e status; a tela de governança permite aprovar solicitações pendentes e revogar acesso pelo botão de pânico. A área Gerenciar Usuários cria colaboradores e permite alterar cargo e status.
- **Cadastro de técnicos parceiros**: pesquisa por nome, empresa ou cidade, consulta ficha, endereço, contato e dados de cadastro; perfis autorizados podem incluir ou editar registros. A criação de acesso de usuário é um fluxo separado do cadastro do parceiro.
- **Configurações de notificações**: define preferências de alertas de chamados, som e notificações de desktop; a permissão do sistema operacional precisa ser concedida no navegador.
- **Base de contatos das lojas (ambiente comercial)**: consulta e pesquisa registros da tabela `lojas_contatos`.
- **Monitoramento Bacio di Latte**: consulta status dos PDVs por loja, mostra online, offline ou sem telemetria, pesquisa loja/código/PDV e atualiza automaticamente a cada minuto, além de permitir atualização manual. Um PDV só é considerado online quando há leitura recente; o painel depende de telemetria disponível pela integração Milvus.

### Telas demonstrativas ou ainda não conectadas a dados operacionais

As telas a seguir existem no projeto, mas atualmente usam dados fixos/de exemplo ou não completam o fluxo de persistência. Não devem ser tratadas como fonte oficial de dados:

- **Acompanhamento CRM/Relatórios**: KPIs e gráficos apresentados na página são valores estáticos; o botão de exportação ainda não gera um relatório real.
- **Funil de Prospecção**: a lista vem de dados em memória de demonstração e não é persistida no Supabase.
- **Base de Conhecimento**: catálogo de exemplos estático; busca, filtros e acesso ao conteúdo ainda não estão conectados a um repositório de artigos.
- **Base de clientes** (`/clientes/lista`): registros exibidos são exemplos locais; filtros e redimensionamento de colunas funcionam na interface, mas o cadastro/lista não representam uma integração operacional com a tabela de contatos de lojas.
- **Cofre/SSO de sistemas externos**: há telas e rotas para credenciais e autenticação. O fluxo de login Milvus possui integração específica, mas outros destinos (como Stoq) contêm respostas simuladas; confirme a implementação, armazenamento e segurança das credenciais antes de usar em produção. A existência da interface não significa que o SSO esteja pronto para todos os sistemas.

---

## 💻 Como rodar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 22.13.0 ou superior; versão do projeto: 22.23.3)
- Projeto **Supabase** configurado com o schema e as tabelas necessárias, incluindo `tickets`, `lojas_contatos` e `status_pdv`
- Configuração de chaves no arquivo `.env.local`

### Firebase legado

O repositório mantém a inicialização do SDK Firebase e um serviço antigo de tickets, mas eles não são necessários para os fluxos ativos do Critel Core. Autenticação, ordens de serviço, transições, notificações, anexos, evidências e dados financeiros usam Supabase Auth, Postgres, Realtime e Storage. Não habilite Firestore ou Firebase Storage para executar a aplicação atual. Se o serviço legado for reativado, revise antes a autenticação e as regras de acesso; a sessão do Supabase não autentica automaticamente no Firebase.

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

3. Configure o `.env.local` com as credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_admin
```
`SUPABASE_SERVICE_ROLE_KEY` é usada somente por rotas server-side e nunca deve ser exposta no navegador. As variáveis `NEXT_PUBLIC_FIREBASE_*` são opcionais e não habilitam funcionalidades do fluxo operacional atual.

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
