# Manual Técnico: Módulo de Landing Pages

Este documento fornece informações técnicas detalhadas sobre o módulo de landing pages da plataforma SAS.

## Arquitetura

O módulo de landing pages é composto por:

1. **Frontend**: Interface de usuário para criação, edição e visualização de landing pages
2. **Backend**: APIs para processamento de solicitações, comunicação com IA e gerenciamento de dados
3. **Banco de Dados**: Armazenamento persistente das landing pages criadas
4. **Integração com IA**: Comunicação com APIs de IA para geração de código HTML/CSS

### Diagrama de Componentes

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Interface de  |     |   APIs Next.js |     |  DeepSeek API  |
|     Usuário    +---->+    (Backend)   +---->+                |
|                |     |                |     |                |
+----------------+     +-------+--------+     +----------------+
                               |
                               v
                       +-------+--------+
                       |                |
                       |   PostgreSQL   |
                       |  (via Prisma)  |
                       |                |
                       +----------------+
```

## Componentes Principais

### Frontend

#### Páginas

- **`/dashboard/landing-pages/page.tsx`**: Lista todas as landing pages do usuário
- **`/dashboard/landing-pages/deepsite/page.tsx`**: Interface para criar novas landing pages com IA
- **`/dashboard/landing-pages/[id]/page.tsx`**: Visualização de uma landing page específica
- **`/dashboard/landing-pages/edit/[id]/page.tsx`**: Edição de uma landing page existente

#### Componentes Principais

- **Editor de HTML**: Permite edição direta do código HTML
- **Visualizador Responsivo**: Permite visualizar a landing page em diferentes tamanhos de tela
- **Chat com IA**: Interface para comunicação com a IA para geração e modificação de código

### Backend

#### APIs

- **`/api/landing-pages/route.ts`**: Gerenciamento de landing pages (listar, criar)
- **`/api/landing-pages/[id]/route.ts`**: Operações em landing pages específicas (obter, atualizar, excluir)
- **`/api/landing-pages/deepsite/session/[sessionId]/route.ts`**: Gerenciamento de sessões de criação
- **`/api/landing-pages/deepsite/ask-ai/route.ts`**: Comunicação com a API DeepSeek
- **`/api/landing-pages/deepsite/apply-diffs/route.ts`**: Aplicação de diferenças de código
- **`/api/landing-pages/deepsite/save/route.ts`**: Salvamento de landing pages

#### Utilitários

- **`/api/landing-pages/deepsite/utils.ts`**: Funções para sanitização de HTML e gerenciamento de sessões
- **`/api/landing-pages/deepsite/diff-utils.ts`**: Funções para aplicação de diferenças de código

### Banco de Dados

O módulo utiliza o Prisma ORM para interagir com o PostgreSQL. O modelo principal é:

```prisma
model LandingPage {
  id          String   @id @default(cuid())
  title       String
  description String?
  html        String   @db.Text
  tags        String[]
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  sessionId   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Fluxos de Dados

### Criação de Landing Page

1. Usuário acessa `/dashboard/landing-pages/deepsite`
2. Frontend cria uma nova sessão via `/api/landing-pages/deepsite/session`
3. Usuário envia instruções para a IA via `/api/landing-pages/deepsite/ask-ai`
4. IA gera código HTML/CSS e envia para o frontend
5. Modificações incrementais são aplicadas via `/api/landing-pages/deepsite/apply-diffs`
6. Usuário salva a landing page via `/api/landing-pages/deepsite/save`

### Edição de Landing Page

1. Usuário acessa `/dashboard/landing-pages/edit/[id]`
2. Frontend carrega a landing page via `/api/landing-pages/[id]`
3. Usuário edita o HTML diretamente
4. Alterações são salvas via `/api/landing-pages/[id]`

## Segurança

### Autenticação e Autorização

- Todas as rotas são protegidas por autenticação via NextAuth
- Verificação de propriedade: apenas o proprietário pode acessar suas landing pages

### Sanitização de HTML

O HTML gerado e salvo é sanitizado para evitar XSS e outros ataques:

```typescript
import sanitizeHtml from 'sanitize-html';

const sanitizedHtml = sanitizeHtml(html, sanitizeOptions);
```

As opções de sanitização permitem elementos HTML e CSS seguros, bloqueando scripts e atributos perigosos.

## Tratamento de Erros

- Validação de entrada em todas as APIs
- Tratamento de erros de conexão com a API de IA
- Fallbacks para aplicação de diffs quando o algoritmo principal falha
- Logs detalhados para depuração

## Limitações e Considerações

- O HTML gerado é autossuficiente (sem dependências externas)
- Tamanho máximo do HTML: 10MB
- Tempo limite para comunicação com a IA: 120 segundos
- Sanitização pode remover alguns elementos avançados de CSS/JS
- A API DeepSeek não suporta entrada de imagens como a OpenAI (as imagens enviadas serão ignoradas)

## Manutenção e Escalabilidade

### Monitoramento

- Logs de erros em todas as APIs
- Rastreamento de uso de créditos de IA
- Métricas de performance para geração de código

### Escalabilidade

- Sessões armazenadas em banco de dados para persistência
- Código modular para facilitar atualizações
- Separação clara entre frontend e backend

## Integração com Outros Módulos

- Sistema de créditos para controle de uso da IA
- Autenticação compartilhada com outros módulos
- Interface consistente com o restante da plataforma

## Próximos Passos e Melhorias Futuras

- Implementação de templates pré-definidos
- Exportação para hospedagem direta
- Integração com sistemas de analytics
- Editor visual WYSIWYG
- Suporte a componentes dinâmicos (formulários funcionais, etc.)
- Versionamento de landing pages

## Configuração

### Variáveis de Ambiente

O sistema requer as seguintes variáveis de ambiente:

```
# Banco de Dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sas_platform?schema=public"

# DeepSeek API
DEEPSEEK_API_KEY=sua_chave_api_deepseek
DEEPSEEK_MODEL_ID=deepseek-ai/deepseek-coder-v2-instruct-16k

# DeepSite API (opcional)
DEEPSITE_API_URL=http://localhost:5173/api
DEEPSITE_API_KEY=deepsite_api_key_development
DEEPSITE_API_PORT=5173
```

## Prompts e Configuração da IA

O sistema utiliza prompts avançados armazenados no arquivo `promptavançado.txt` na raiz do projeto. Este arquivo contém instruções detalhadas para a IA sobre como gerar e modificar o código HTML das landing pages.

### Formato do Prompt

O prompt base inclui:
- Contexto sobre desenvolvimento web e design de landing pages
- Instruções para análise do HTML atual
- Formato esperado para retornar as modificações (usando diff blocks)
- Diretrizes de estilo e boas práticas

Os prompts são combinados com o HTML atual e a solicitação do usuário para gerar uma resposta completa. 