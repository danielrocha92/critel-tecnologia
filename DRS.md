# Documento de Requisitos do Sistema (DRS)

**Projeto:** Intranet Corporativa Critel & Central Unificada de Atendimento 
**Documento:** Especificação Técnica e Regras de Negócio

## 1. Visão Geral e Perfis de Usuário
O sistema de Intranet da Critel atuará como o portal centralizador de acessos e governança de identidade da empresa. O foco principal é a segurança da informação através de um Cofre de Senhas e autenticação Single Sign-On (SSO), e a unificação da operação em uma Central de Atendimento (Single Pane of Glass), eliminando a dependência de plataformas SaaS de terceiros.

**Perfis de Acesso:**
- **Administrador (Gestores/Diretoria):** Acesso total para criação de credenciais genéricas, atribuição de permissões, revogação de acessos e visualização de logs de auditoria.
- **Analista de TI (Base):** Acesso aos painéis de sistemas dos clientes e ferramentas de suporte, com credenciais mascaradas.
- **Técnico de Campo:** Acesso restrito ao PWA operacional e webmail/comunicação, exclusivamente através de autenticação por token ou login único (SSO).

## 2. Requisitos Funcionais (RF)

### Autenticação e Governança:
- **RF01 - Autenticação Única (SSO):** O sistema deve permitir que o usuário faça um único login na Intranet para acessar os demais sistemas (Stoq, Milvus) com um clique.
- **RF02 - Cofre de Senhas Mascarado:** O sistema deve armazenar as credenciais corporativas (como o e-mail genérico suporte.criitel@gmail.com) e injetá-las automaticamente nas sessões de destino. A senha em texto plano nunca deve ser exibida ao usuário final.
- **RF03 - Gestão de Revogação Imediata:** O sistema deve possuir um "botão de pânico" no painel do Administrador que encerra todas as sessões ativas de um colaborador específico simultaneamente.

### Central Unificada e Integrações:
- **RF04 - Recepção de Webhooks (TomTicket):** O sistema deve possuir uma rota (Endpoint) em Node.js para receber chamados em tempo real do TomTicket, inserindo-os no banco de dados para reflexão imediata na tela do analista.
- **RF05 - Comunicação Omnichannel (WhatsApp):** O sistema deve integrar o motor do Chatwoot no back-end (conectado à Meta Cloud API), permitindo que múltiplos analistas operem o WhatsApp da Critel simultaneamente com logins individuais.
- **RF06 - Geração de Salas de Vídeo Sob Demanda:** O sistema deve interpretar o atalho `/video` no chat de atendimento, gerando um link único e seguro (Jitsi/Meet) para visualização de equipamentos em loja, eliminando o uso de celulares físicos.
- **RF07 - Proxy de Sessão Centralizado (Milvus):** O back-end em Node.js atuará como o único cliente logado no Milvus, fazendo consultas periódicas e atualizando o status dos PDVs no banco da Critel, contornando a limitação de licenças.

### Módulos de Negócio (Micro-CRM e Radar):
- **RF08 - Módulo de Contatos Dinâmicos (Substituição de Planilhas):** O sistema deve cruzar a loja de origem do chamado com a base de dados interna (`lojas_contatos`) para acionamento imediato.
  - *Fluxo Principal:* O back-end identifica a loja, busca o número e renderiza o botão "Iniciar WhatsApp". O clique abre o chat com o contato já preenchido.
  - *Fluxo Alternativo:* O analista identifica um novo gerente, altera o número na própria tela do chamado ativo e o front-end processa um `UPDATE` no banco, atualizando o contato para os próximos acionamentos.
  - *Fluxo de Exceção:* Em caso de lojas novas sem cadastro prévio, a interface exibe um campo de alerta para inserção manual. O sistema salva o contato provisório, permite o atendimento e retroalimenta o banco.
- **RF09 - Radar de Obras (Mobilização/Desmobilização):** O motor de Webhooks deve rodar uma verificação de Expressões Regulares (Regex: `/(obra|reforma).*?(aprovação|mobilização|desmobilização)/i`).
  - *Fluxo Alternativo Estratégico:* Caso detecte as palavras-chave, o chamado não entra na fila de suporte técnico. Ele é desviado para a tabela `radar_obras_mobilizacao` e dispara um alerta de e-mail para a diretoria tratar a oportunidade de faturamento.

## 3. Requisitos Não Funcionais e Arquitetura (RNF)
- **RNF01 - Stack de Desenvolvimento (Front-end e UI):** A interface deve ser desenvolvida em Next.js. A estilização será feita rigorosamente com CSS Dedicado, sendo expressamente proibida a utilização de frameworks genéricos (como Tailwind ou Bootstrap) e CSS inline. O layout deve priorizar o `display: grid` para estruturação do Single Pane of Glass.
- **RNF02 - Stack de Desenvolvimento (Back-end e Banco):** A API e os Workers de processos (como o Polling do Milvus) devem ser feitos em Node.js. O banco de dados relacional utilizará o Supabase (PostgreSQL), aproveitando os recursos de WebSockets (Realtime) para atualizar a fila de chamados na tela sem necessidade de recarregamento (refresh).
- **RNF03 - Segurança de Banco de Dados:** O acesso direto aos dados deve ser blindado por Row Level Security (RLS) nativo do PostgreSQL, garantindo que usuários autenticados consumam apenas os dados pertinentes ao seu nível de acesso.
- **RNF04 - Hardware de Atendimento:** O projeto exige a aquisição e utilização de headsets USB com cancelamento de ruído direcional para as chamadas de vídeo via web, isolando a acústica do ambiente de suporte.

## 4. Regras de Negócio e Segurança (RN)
- **RN01 - Política de Confiança Zero (Zero Trust):** A propriedade das credenciais dos portais integrados (Stoq, Milvus, etc.) é exclusiva da Critel.
- **RN02 - Prevenção contra Vazamento de DOM:** Se um colaborador tentar inspecionar o código da página (via DevTools) para capturar a senha injetada pelo SSO, o sistema utilizará rotas de proxy no back-end para gerar a sessão de destino, não permitindo que o payload da senha trafegue pelo navegador.
- **RN03 - Desligamento em Cadeia:** Ao inativar um usuário na Intranet, o corte de acesso reflete instantaneamente em todas as ferramentas conectadas por SSO.
