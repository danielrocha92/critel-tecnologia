# Critel Tecnologia

Projeto de desenvolvimento do site institucional da **Critel Tecnologia**. O projeto foi construído utilizando as tecnologias mais modernas de desenvolvimento web, visando alta performance, SEO otimizado e uma interface de usuário incrível.

## 🚀 Tecnologias Utilizadas

Este projeto foi desenvolvido com as seguintes tecnologias e ferramentas:

- [Next.js 16](https://nextjs.org/) - Framework React para renderização híbrida, rotas e otimizações automáticas.
- [React 19](https://react.dev/) - Biblioteca JavaScript para construção de interfaces de usuário.
- [TypeScript](https://www.typescriptlang.org/) - Superset tipado do JavaScript para maior segurança e escalabilidade do código.
- **CSS Modules** - Metodologia de estilização modular e escopada.
- [Lucide React](https://lucide.dev/) - Biblioteca de ícones modernos e customizáveis.

## ⚙️ Funcionalidades e Estrutura

O site é composto por diversas seções focadas na identidade visual e apresentação corporativa da Critel:

- **Header**: Navegação global, seletor de idiomas (PT, EN, ES) e controle de identidade visual superior.
- **Footer**: Rodapé com informações de contato, links úteis, branding e endereço atualizado.
- **Institucional & Inovação**: Apresentação da empresa, visão e valores, utilizando layout intercalado moderno.
- **ScrollReveal (Animações)**: Sistema customizado que revela os elementos suavemente conforme o usuário rola a página (Fade In).
- **Ações Flutuantes (Floating Actions)**: Botões de contato via WhatsApp e "Voltar ao topo", com layout adaptativo que muda inteligentemente no mobile e ao realizar scroll.

## 💻 Como rodar o projeto localmente

Siga as instruções abaixo para executar o projeto em sua máquina local.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- Gerenciador de pacotes npm, yarn, pnpm ou bun.

### Instalação

1. Clone o repositório (ou acesse a pasta raiz do projeto):

```bash
git clone https://github.com/danielrocha92/critel-tecnologia.git
cd critel-tecnologia
```

2. Instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

4. Abra o seu navegador e acesse [http://localhost:3000](http://localhost:3000) para visualizar o projeto.

## 📂 Estrutura de Diretórios

A estrutura principal do projeto é baseada no App Router do Next.js:

```
critel-tecnologia/
├── public/                 # Arquivos públicos e imagens estáticas
├── src/
│   ├── components/         # Componentes reutilizáveis (Header, Footer, Institutional, Innovation)
│   ├── app/                # Páginas, layouts e rotas da aplicação (App Router)
│   └── ...                 # Outros diretórios de utilitários e estilos
├── package.json            # Dependências e scripts do projeto
├── next.config.ts          # Configurações do Next.js
└── tsconfig.json           # Configurações do TypeScript
```

---

Desenvolvido para **Critel Tecnologia**.
