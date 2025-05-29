# Módulo de Landing Pages - Manual Técnico

Este documento fornece uma visão técnica detalhada do módulo de landing pages do sistema, incluindo sua arquitetura, componentes e fluxo de funcionamento.

## Visão Geral

O módulo de landing pages permite aos usuários criar e gerenciar landing pages usando uma interface assistida por inteligência artificial. O sistema utiliza a API DeepSeek para gerar e modificar código HTML/CSS com base nas instruções do usuário em linguagem natural.

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

O frontend do módulo é implementado usando React e Next.js, oferecendo uma interface intuitiva para:

- Entrada de prompts em linguagem natural
- Visualização em tempo real do código HTML/CSS gerado
- Preview da landing page em desktop e dispositivos móveis
- Upload de imagens para inclusão na landing page
- Gerenciamento (listagem, visualização, edição e exclusão) de landing pages

### Backend

O backend é implementado como APIs Next.js (App Router) que gerenciam:

1. Comunicação com a API DeepSeek
2. Gerenciamento de sessões
3. Aplicação de diferenças de código
4. Sanitização de HTML
5. Armazenamento e recuperação de landing pages (via Prisma/PostgreSQL)

### Banco de Dados

Utilizamos MongoDB para armazenar:

- Dados das landing pages (título, descrição, HTML, tags)
- Informações do usuário (anônimo ou autenticado)
- Timestamps de criação e atualização

O módulo se integra com o restante do sistema que já utiliza MongoDB, aproveitando a conexão existente para armazenar as landing pages.

## Fluxo de Funcionamento

1. **Criação de Landing Page**:
   - O usuário fornece instruções em linguagem natural
   - A API envia essas instruções para a DeepSeek
   - A DeepSeek gera alterações no código HTML/CSS
   - O sistema aplica essas alterações e exibe o resultado em tempo real

2. **Upload de Imagens**:
   - O usuário pode fazer upload de imagens através da interface
   - As imagens são salvas no diretório `/public/uploads/` com um nome único baseado em timestamp
   - O sistema processa automaticamente a imagem e a envia para a IA com instruções detalhadas
   - A IA incorpora a imagem na landing page usando o caminho correto
   - As imagens ficam disponíveis publicamente através da URL `/uploads/[nome-do-arquivo]`

3. **Salvamento**:
   - O usuário pode salvar a landing page no banco de dados MongoDB
   - O sistema suporta salvamento tanto para usuários autenticados quanto anônimos
   - Um modo "fake" está disponível como fallback em caso de falha no banco de dados
   - No modo "fake", as landing pages são armazenadas apenas temporariamente na sessão

4. **Listagem e Gerenciamento**:
   - Os usuários podem listar, visualizar, editar e excluir suas landing pages
   - Para funcionar sem banco de dados, algumas operações de listagem podem não estar disponíveis

## APIs

### 1. `/api/landing-pages/deepsite/ask-ai`
   - **Método**: POST
   - **Parâmetros**: prompt, html, sessionId (opcional), image (opcional)
   - **Função**: Envia prompt para a API DeepSeek e retorna sugestões de alterações

### 2. `/api/landing-pages/deepsite/apply-diffs`
   - **Método**: POST
   - **Parâmetros**: html, diffs, sessionId (opcional)
   - **Função**: Aplica as diferenças de código ao HTML atual

### 3. `/api/landing-pages/deepsite/session/[sessionId]`
   - **Método**: GET
   - **Parâmetros**: sessionId (na URL)
   - **Função**: Recupera uma sessão de edição específica

### 4. `/api/landing-pages/deepsite/save`
   - **Método**: POST
   - **Parâmetros**: title, html, description (opcional), tags (opcional), sessionId (opcional)
   - **Função**: Salva a landing page no banco de dados ou usa modo "fake" se o banco de dados não estiver disponível
   - **Nota**: Suporta usuários anônimos e autenticados

### 5. `/api/landing-pages/deepsite/upload-image`
   - **Método**: POST
   - **Parâmetros**: file (FormData)
   - **Função**: Recebe e salva imagens enviadas pelos usuários
   - **Retorno**: Caminho relativo para a imagem salva (`/uploads/nome-do-arquivo.jpg`)

### 6. `/api/landing-pages`
   - **Método**: GET
   - **Função**: Lista todas as landing pages do usuário

### 7. `/api/landing-pages/[id]`
   - **Método**: GET, PUT, DELETE
   - **Parâmetros**: id (na URL)
   - **Função**: Recupera, atualiza ou exclui uma landing page específica

## Segurança

- Todo o HTML é sanitizado antes de ser armazenado ou exibido
- As landing pages são associadas ao usuário que as criou (ou a um ID anônimo)
- Controle de acesso via middleware para proteger rotas sensíveis

## Dependências

- **DeepSeek API**: Para geração de código
- **MongoDB**: Banco de dados para armazenamento de landing pages
- **Mongoose**: ODM para acesso ao MongoDB
- **Next.js**: Framework React para frontend e backend
- **sanitize-html**: Para sanitização de HTML

## Variáveis de Ambiente

```
# DeepSeek
DEEPSEEK_API_KEY=sua_chave_api_deepseek
DEEPSEEK_MODEL_ID=deepseek-chat

# Banco de Dados
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/sas_platform
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

## Modo "Fake" (Sem Banco de Dados)

O sistema foi projetado para funcionar mesmo sem um banco de dados PostgreSQL configurado. Neste modo:

1. As landing pages são criadas com IDs gerados aleatoriamente
2. Os dados são armazenados apenas na memória durante a sessão
3. As landing pages não são persistentes entre reinicializações do servidor
4. A API retorna um campo `fake: true` nas respostas de salvamento
5. Operações de listagem e consulta podem não funcionar completamente

Para ativar o modo completo com persistência, configure a variável `DATABASE_URL` no arquivo `.env` e execute as migrações do Prisma.

## Gerenciamento de Imagens

O sistema permite o upload e incorporação de imagens nas landing pages:

1. Os usuários podem fazer upload de imagens através da interface
2. As imagens são validadas (tipo e tamanho) e armazenadas no diretório `public/uploads/`
3. Um nome único baseado em timestamp é gerado para cada imagem para evitar colisões
4. O sistema instrui a IA automaticamente sobre como incorporar a imagem na landing page
5. As imagens são referenciadas com caminhos absolutos (`/uploads/timestamp-nome-do-arquivo.jpg`)
6. O frontend exibe a imagem corretamente, tanto na pré-visualização quanto na landing page final

### Processo de Upload

1. **Interface do Usuário**: O usuário seleciona uma imagem através do seletor de arquivos
2. **Upload para o Servidor**: A imagem é enviada via FormData para o endpoint `/api/landing-pages/deepsite/upload-image`
3. **Processamento**: O servidor:
   - Valida o tipo e tamanho da imagem
   - Gera um nome único
   - Salva a imagem em `/public/uploads/`
   - Retorna um URL relativo e instruções HTML para uso
4. **Instruções para IA**: Quando o usuário envia um prompt com uma imagem, o sistema inclui instruções detalhadas sobre como incorporar a imagem

### Limitações e Considerações:
   - Tamanho máximo de arquivo: 5MB
   - Tipos de arquivo permitidos: imagens (JPEG, PNG, GIF, etc.)
   - As imagens são armazenadas localmente (não em CDN)
   - Os arquivos de imagem não são excluídos automaticamente quando a landing page é excluída 