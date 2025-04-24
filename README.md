# SaaS IA Platform

Uma plataforma All-in-One para Criadores de Conteúdo, Afiliados, Dropshippers e Closers, com funcionalidades de IA para copywriting, geração de imagens, vídeos, landing pages e muito mais.

## Tecnologias Utilizadas

- **Frontend:** React, Next.js 14+, Tailwind CSS, shadcn/ui, Lucide React
- **Backend:** Next.js API Routes com Edge Runtime
- **IA:** OpenAI GPT-4-turbo, DeepSeek Chat API
- **Banco de Dados:** MongoDB com Mongoose
- **Autenticação:** NextAuth.js com autenticação via Google
- **Cache:** Sistema de cache em memória para otimização de requisições
- **Monitoramento:** Sistema próprio de logging e monitoramento de performance

## Requisitos

- Node.js 18+ LTS
- NPM ou Yarn
- MongoDB (local ou Atlas)
- Chaves de API:
  - OpenAI API Key
  - DeepSeek API Key
  - Google OAuth Client ID e Secret

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd sas-ia-platform
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Configure as seguintes variáveis no arquivo `.env.local`:
```
MONGODB_URI=sua_uri_do_mongodb
NEXTAUTH_SECRET=seu_secret_para_nextauth
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=seu_client_id_do_google
GOOGLE_CLIENT_SECRET=seu_client_secret_do_google
OPENAI_API_KEY=sua_chave_da_openai
DEEPSEEK_API_KEY=sua_chave_da_deepseek
```

## Módulos Implementados

### 1. Sistema de Autenticação
- Login via Google OAuth
- Proteção de rotas
- Gerenciamento de sessão
- Perfil do usuário

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

### 3. Gerenciamento de Criações
- Sistema unificado para todas as criações do usuário
- Organização por tipo de conteúdo
- Funcionalidades CRUD completas
- Validação de dados com Zod
- Proteção contra acesso não autorizado

### 4. Sistema de Performance
- Monitoramento de tempo de resposta das APIs
- Cache inteligente para requisições repetidas
- Logs detalhados para debugging
- Tratamento robusto de erros

## Estrutura do Projeto

```
sas-ia-platform/
├── src/
│   ├── app/
│   │   ├── api/                 # Rotas de API
│   │   │   ├── auth/           # Autenticação
│   │   │   ├── copywriting/    # API de Copywriting
│   │   │   ├── user-creations/ # Gerenciamento de criações
│   │   │   └── user/          # Dados do usuário
│   │   ├── dashboard/          # Interface principal
│   │   ├── login/             # Página de login
│   │   └── profile/           # Perfil do usuário
│   ├── components/
│   │   ├── ai-modules/        # Componentes dos módulos de IA
│   │   │   ├── copywriting/   # Módulo de copywriting
│   │   │   └── creative/      # Módulo de criativos (em desenvolvimento)
│   │   └── ui/               # Componentes de UI reutilizáveis
│   └── lib/
│       ├── db/               # Modelos e funções do banco de dados
│       ├── auth.ts          # Configurações de autenticação
│       ├── performance.ts   # Utilitários de performance
│       └── utils.ts         # Funções utilitárias gerais
```

## Próximos Passos

1. **Módulos em Desenvolvimento:**
   - IA de Criativos Visuais
   - IA de Vídeos Curtos
   - Consultor IA 24h
   - Transcrição de Áudio

2. **Melhorias Planejadas:**
   - Implementação de testes automatizados
   - Sistema de métricas e analytics
   - Otimização de performance
   - Expansão do sistema de cache

3. **Novas Funcionalidades:**
   - Integração com mais APIs de IA
   - Sistema de templates personalizados
   - Exportação de dados
   - Dashboards analíticos

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 