# SAS IA Platform

Plataforma de IA integrada para automação de marketing e geração de conteúdo.

## Módulos Implementados

### 1. Sistema de Autenticação
- Login via Google OAuth
- Proteção de rotas
- Gerenciamento de sessão
- Perfil do usuário
- Papéis de usuário (usuário comum e administrador)

### 2. IA de Copywriting
- Geração de textos persuasivos sem restrições
- Suporte a múltiplos tipos de copy:
  - Headlines
  - Email Marketing
  - Black Hat Marketing
  - Scripts de Vídeo
- Configurações avançadas:
  - Tom da mensagem personalizado
  - Estruturas de persuasão (AIDA, PAS, etc.)
  - Público-alvo específico
  - Pontos-chave customizáveis
- Sistema de cache para otimização de requisições
- Salvamento e gerenciamento de criações
- Consumo automático de créditos conforme uso
- Validação em tempo real de créditos disponíveis

### 3. DeepSite - Gerador de Landing Pages
- Geração completa de landing pages em HTML/CSS
- Sistema de streaming para solicitações de melhorias
- Aplicação de modificações incrementais via diff
- Suporte a múltiplos estilos e componentes:
  - Hero sections
  - Features
  - Testimonials
  - Pricing
  - Call-to-action
  - Formulários de contato
- Sanitização e validação automática do HTML
- Preview em tempo real das modificações
- Exportação do código fonte
- Integração com o sistema de créditos
- Gerenciamento de sessões para continuidade do trabalho
- HTML autossuficiente sem dependências externas
- Suporte completo a SVG para ícones e elementos gráficos
- Algoritmo avançado de aplicação de diffs com múltiplos fallbacks
- Validação rigorosa de entrada e saída
- **Novidades (v1.3.0):**
  - Sistema completo de salvamento e gerenciamento de landing pages
  - Visualização responsiva (desktop e mobile) das landing pages
  - Interface para edição de landing pages salvas
  - Listagem e busca de landing pages
  - Integração com banco de dados PostgreSQL via Prisma
  - Prompts aprimorados para garantir código 100% autossuficiente
  - Sanitização avançada de HTML com suporte a SVG e CSS moderno
  - Algoritmo de diff com três níveis de estratégias de fallback
  - Bloqueio rigoroso de bibliotecas externas e CDNs
  - Processamento de buffer otimizado para streaming de respostas

### 4. Sistema de Créditos
- Atribuição de créditos por usuário
- Consumo automático por operação
- Histórico detalhado de uso
- Diferentes planos de créditos
- Integração com gateway de pagamento

## Tecnologias Utilizadas

- **Frontend:** React, Next.js, TailwindCSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** MongoDB com Mongoose, PostgreSQL com Prisma
- **Autenticação:** NextAuth.js
- **IA:** OpenAI API, DeepSeek API
- **Pagamentos:** Mercado Pago

## Configuração do Ambiente

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
# Autenticação
NEXTAUTH_SECRET=sua_chave_secreta
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret

# MongoDB
MONGODB_URI=sua_uri_mongodb

# PostgreSQL (para landing pages)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sas_platform?schema=public"

# OpenAI
OPENAI_API_KEY=sua_chave_api_openai

# DeepSeek
DEEPSEEK_API_KEY=sua_chave_api_deepseek

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_token_mercadopago
```

### Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações do Prisma
npm run prisma:migrate

# Iniciar servidor de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar em produção
npm start
```

## Estrutura do Projeto

```
src/
├── app/                  # Rotas e páginas Next.js
│   ├── api/              # API Routes
│   │   ├── auth/         # Autenticação
│   │   ├── copywriting/  # IA de Copywriting
│   │   └── landing-pages/# DeepSite e gerenciamento de landing pages
│   └── dashboard/        # Interface do usuário
│       └── landing-pages/# Interface de gerenciamento de landing pages
├── components/           # Componentes React
├── lib/                  # Utilitários e bibliotecas
│   ├── db/               # Modelos e conexão com MongoDB
│   ├── prisma.ts         # Cliente Prisma para PostgreSQL
│   ├── auth.ts           # Configuração de autenticação
│   └── deepsite-credits.ts # Sistema de créditos
├── prisma/               # Esquema e migrações do Prisma
│   └── schema.prisma     # Definição do modelo de dados
└── styles/               # Estilos globais
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Módulos

### Landing Pages

Um módulo para criação de landing pages com assistência de IA. Utiliza a API DeepSeek para gerar e modificar código HTML/CSS com base nas instruções do usuário.

- Criação de landing pages usando prompts em linguagem natural
- Editor de código HTML/CSS com visualização em tempo real
- Sistema de diff para aplicar alterações incrementais
- Gerenciamento de landing pages (listagem, edição, exclusão)
- Sanitização de HTML para segurança

[Ver documentação detalhada](./docs/manual-tecnico-landing-pages.md)