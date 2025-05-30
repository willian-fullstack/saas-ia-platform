## Correções de Segurança e Autenticação

### Correção de Permissões de Usuário (Junho 2024)

Foram implementadas correções importantes no sistema de autenticação:

1. **Correção de Atribuição de Papel**
   - Corrigido problema onde todos os usuários em ambiente de desenvolvimento eram automaticamente definidos como "admin"
   - Implementada busca no banco de dados para obter o papel real do usuário mesmo em ambiente de desenvolvimento
   - Mantido fallback para usuário padrão com papel "user" apenas quando o usuário não existe no banco de dados

2. **Verificação Rigorosa de Permissões**
   - Implementada verificação explícita de papel "admin" no middleware para rotas administrativas
   - Adicionada proteção em camadas para rotas administrativas (middleware + verificação específica)
   - Logs detalhados para rastreamento de tokens JWT e papéis de usuário
   - Redirecionamento automático para usuários sem permissões tentando acessar áreas restritas

3. **Uso de Dados Reais**
   - Removido código que simulava usuários e créditos fictícios
   - Garantia que todas as operações usem dados reais do banco de dados
   - Verificação adequada de IDs válidos antes da conversão para ObjectId
   - Tratamento de erros para IDs inválidos com mensagens claras

Estas correções garantem que o sistema de autenticação funcione corretamente em todos os ambientes, usando sempre dados reais do banco de dados e aplicando as restrições de acesso apropriadas com base no papel real do usuário.

## Sistema de Landing Pages

O sistema de landing pages permite aos usuários criar e gerenciar landing pages através de dois métodos:

1. **Geração Automática com IA**: Gera landing pages completas a partir de uma descrição básica usando modelos de IA (OpenAI ou DeepSeek).
2. **Editor DeepSite**: Interface avançada para edição e refinamento de landing pages com assistência de IA.

### Arquitetura do Sistema

O sistema está estruturado da seguinte forma:

#### Modelo de Dados
- `LandingPage.ts`: Define o esquema e funções para interagir com landing pages no MongoDB.

#### APIs
- `/api/landing-pages/route.ts`: Endpoints para listar e criar landing pages.
- `/api/landing-pages/[id]/route.ts`: Endpoints para obter, atualizar e excluir landing pages específicas.
- `/api/landing-pages/deepsite/`: API para o sistema DeepSite de edição avançada.
  - `/sessions/route.ts`: Gerencia sessões de edição.
  - `/ask-ai/route.ts`: Conecta com a IA para assistência em tempo real.

#### Interface Frontend
- `/dashboard/landing-pages/page.tsx`: Página principal do sistema de landing pages.
- `/components/landing-pages/`: Componentes específicos para o sistema:
  - `LandingPagesList.tsx`: Exibe lista de landing pages e sessões de edição.
  - `LandingPageGenerator.tsx`: Interface para geração de novas landing pages com IA.
  - `DeepSiteEditor.tsx`: Editor avançado com assistência de IA em tempo real.

### Funcionalidades Principais

#### Geração de Landing Pages
O sistema suporta a geração de landing pages completas a partir de prompts de usuário. A API aceita parâmetros como:
- Nicho de mercado
- Produto ou serviço
- Público-alvo
- Benefícios
- Chamada para ação (CTA)
- Estilo visual

A geração pode utilizar tanto a API da OpenAI quanto da DeepSeek, dependendo da configuração do sistema.

#### Armazenamento de Imagens
O sistema permite o upload de imagens que são:
- Armazenadas no diretório `/public/uploads/`
- Referenciadas nas landing pages com caminhos relativos
- Podem ser carregadas através da interface do LandingPageGenerator

#### Sistema DeepSite
O DeepSite é um sistema avançado para edição de landing pages com assistência de IA em tempo real:

- **Sessões de Edição**: Permite salvar estados intermediários do trabalho.
- **Consultas à IA**: Fornece sugestões e melhorias para o código HTML.
- **Armazenamento em Memória**: Usa armazenamento global para sessões de edição (com limpeza automática após 24h).
- **Editor Visual**: Interface dividida em código HTML e visualização em tempo real.
- **Assistente Integrado**: Chat com IA para solicitar mudanças no código.

### Interface do Usuário

O sistema de landing pages oferece uma interface intuitiva com três áreas principais:

1. **Lista de Landing Pages**: Exibe todas as landing pages criadas e sessões de edição ativas.
   - Permite visualizar, editar ou excluir landing pages
   - Mostra sessões de edição em andamento que podem ser continuadas

2. **Gerador de Landing Pages**: Interface para criar novas landing pages com:
   - Formulário detalhado para fornecer informações sobre o produto/serviço
   - Upload de imagens para enriquecer a landing page
   - Indicador de progresso durante a geração
   - Opções de personalização de estilo e conteúdo

3. **Editor DeepSite**: Ambiente avançado de edição que inclui:
   - Editor de código HTML com syntax highlighting
   - Visualizador em tempo real para ver as mudanças
   - Assistente de IA integrado para solicitar ajuda
   - Capacidade de salvar alterações ou visualizar em nova janela
   - Histórico de comunicação com a IA

### Uso das APIs

#### Criação de Landing Page
```http
POST /api/landing-pages
Content-Type: application/json

{
  "niche": "fitness",
  "product": "Programa de treinamento em casa",
  "benefits": ["Sem equipamento necessário", "Apenas 20 minutos por dia", "Resultados em 30 dias"],
  "targetAudience": "Pessoas ocupadas que querem ficar em forma",
  "callToAction": "Comece seu treino hoje",
  "style": "moderno"
}
```

#### Iniciar Sessão DeepSite
```http
POST /api/landing-pages/deepsite/sessions
Content-Type: application/json

{
  "landingPageId": "65f45a3b1c2a3b4c5d6e7f8g",
  "sessionName": "Edição da LP Fitness"
}
```

#### Consultar IA para Melhorias
```http
POST /api/landing-pages/deepsite/ask-ai
Content-Type: multipart/form-data

prompt: "Adicione uma seção de depoimentos após a seção de benefícios"
html: "[HTML atual da landing page]"
sessionId: "session-uuid-123"
image: [arquivo de imagem - opcional]
```

### Configuração

O sistema requer as seguintes variáveis de ambiente:
- `OPENAI_API_KEY` ou `DEEPSEEK_API_KEY`: Chave para a API de IA
- `OPENAI_MODEL_ID` ou `DEEPSEEK_MODEL_ID` (opcional): Para especificar o modelo a ser usado

### Considerações de Segurança

- Todo o HTML gerado ou editado é sanitizado usando a biblioteca `sanitize-html`.
- As sessões de edição são vinculadas aos usuários e têm verificações de permissão.
- Em ambiente de desenvolvimento, algumas restrições são relaxadas para facilitar os testes.

## Solução de Problemas

### Sistema DeepSite

O sistema DeepSite utiliza um mecanismo de comunicação baseado em FormData para transmitir dados entre o frontend e a API. Os principais pontos a observar são:

1. **Parâmetros corretos**: O frontend envia parâmetros via FormData com os seguintes nomes:
   - `message`: O texto da pergunta ou instrução do usuário
   - `html`: O código HTML atual da landing page
   - `sessionId`: O ID da sessão atual do DeepSite
   - `image` (opcional): Uma imagem para ser incorporada na landing page

2. **Streaming de Resposta**: A API retorna um stream de texto que é processado incrementalmente pelo frontend. Isso permite uma experiência mais fluida para o usuário.

3. **Tratamento de Erros**: Tanto o frontend quanto o backend possuem mecanismos robustos de tratamento de erros para garantir que falhas não interrompam a experiência do usuário.

Se ocorrerem problemas de comunicação entre o frontend e a API, verifique:
- Se os nomes dos parâmetros no FormData estão corretos
- Se a API está configurada para receber os mesmos nomes de parâmetros
- Se as chaves de API de IA (OpenAI ou DeepSeek) estão configuradas no arquivo .env

### Depuração do Sistema

Para facilitar a depuração de problemas com o sistema DeepSite, foram implementados logs detalhados em pontos críticos:

1. **No frontend (DeepSiteEditor.tsx)**:
   - Log dos dados sendo enviados na requisição (message, sessionId e status do HTML)
   - Validação prévia para garantir que o HTML não esteja vazio
   - Exibição detalhada de erros retornados pela API

2. **No backend (ask-ai/route.ts)**:
   - Log das chaves recebidas no FormData
   - Log da existência de cada parâmetro esperado
   - Suporte flexível para parâmetros (aceita tanto 'message' quanto 'prompt')
   - Tratamento detalhado de erros com informações específicas

Os logs de depuração podem ser visualizados no console do navegador (frontend) e no terminal do servidor (backend), ajudando a identificar onde exatamente os problemas estão ocorrendo.

### Solução de Problemas Comuns

#### HTML Vazio no Editor DeepSite

Um problema comum que pode ocorrer é quando o editor DeepSite mostra um conteúdo HTML vazio, impossibilitando a edição da landing page. Esse problema pode ocorrer pelas seguintes razões:

1. **Inconsistência nos nomes de campos**: O sistema utiliza diferentes nomes de campos para o conteúdo HTML em diferentes partes da aplicação:
   - `html`: Usado no modelo de dados da landing page
   - `content`: Usado internamente nas sessões DeepSite

   O sistema foi atualizado para aceitar ambos os nomes de campos, garantindo compatibilidade entre as diferentes partes.

2. **Validação de conteúdo**: Foram adicionadas verificações para garantir que o conteúdo HTML não esteja vazio antes de enviar requisições à API. Isso evita problemas de edição e feedback claro ao usuário.

3. **Atualização automática de sessões**: As sessões DeepSite agora atualizam automaticamente o conteúdo HTML quando detectam alterações, garantindo que sempre contenham a versão mais recente do código.

#### Solução:

Se mesmo assim o problema persistir:

1. Verifique os logs do console do navegador para identificar erros específicos
2. Tente recarregar a página ou criar uma nova sessão DeepSite
3. Verifique se a landing page original possui conteúdo HTML válido 