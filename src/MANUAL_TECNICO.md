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

O sistema de landing pages permite aos usuários criar e gerenciar landing pages através de três métodos:

1. **Geração Automática com IA**: Gera landing pages completas a partir de uma descrição básica usando modelos de IA (OpenAI ou DeepSeek).
2. **Editor DeepSite**: Interface avançada para edição e refinamento de landing pages com assistência de IA.
3. **Importação de Copy**: Permite criar landing pages a partir de textos de copy já existentes, com o sistema de IA interpretando e estruturando o conteúdo.

### Arquitetura do Sistema

O sistema está estruturado da seguinte forma:

#### Modelo de Dados
- `LandingPage.ts`: Define o esquema e funções para interagir com landing pages no MongoDB.

#### APIs
- `/api/landing-pages/route.ts`: Endpoints para listar e criar landing pages.
- `/api/landing-pages/[id]/route.ts`: Endpoints para obter, atualizar e excluir landing pages específicas.
- `/api/landing-pages/import-copy/route.ts`: Endpoint para criar landing pages a partir de textos de copy existentes.
- `/api/landing-pages/deepsite/`: API para o sistema DeepSite de edição avançada.
  - `/sessions/route.ts`: Gerencia sessões de edição.
  - `/ask-ai/route.ts`: Conecta com a IA para assistência em tempo real.

#### Interface Frontend
- `/dashboard/landing-pages/page.tsx`: Página principal do sistema de landing pages.
- `/components/landing-pages/`: Componentes específicos para o sistema:
  - `LandingPagesList.tsx`: Exibe lista de landing pages e sessões de edição.
  - `LandingPageGenerator.tsx`: Interface para geração de novas landing pages com IA.
  - `CopyImporter.tsx`: Interface para importação de textos de copy e criação de landing pages.
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

#### Sistema de Armazenamento de Imagens
O sistema de landing pages agora inclui um gerenciamento eficiente de imagens para evitar problemas com strings base64 muito grandes:

#### Modelo de Dados para Imagens
- `Image.ts`: Define o esquema e funções para interagir com imagens no MongoDB
  - Campos: filename, originalname, mimetype, path, size, userId
  - Funções: createImage, getImagesByUserId, getImageById, deleteImage

#### Endpoints da API para Imagens
- `/api/images/upload`: Permite o upload de imagens (limite 5MB por imagem)
  - Salva os arquivos no sistema de arquivos em `/public/uploads/`
  - Armazena metadados no MongoDB
  - Retorna ID e URL pública da imagem
- `/api/images/list`: Lista todas as imagens do usuário atual

#### Integração com o Importador de Copy
- O componente `CopyImporter` foi atualizado para:
  - Fazer upload de imagens para o servidor em vez de convertê-las para base64
  - Exibir o progresso de upload para cada imagem
  - Permitir selecionar imagens previamente enviadas
  - Mostrar erros de upload quando ocorrem

#### Gerenciamento de Textos Grandes
O sistema implementa um mecanismo de truncamento radical para lidar com textos de copy muito extensos:

- **Estratégia Minimalista**: Ao invés de um prompt extenso e detalhado, usa um formato extremamente compacto
- **Estimativa Conservadora de Tokens**: Calcula o número aproximado de tokens em um texto (1 token ≈ 2 caracteres)
- **Truncamento Ultra-Agressivo**: 
  - Limita o texto da copy a 10.000 caracteres no máximo
  - Preserva apenas o início do texto, que geralmente contém as informações mais importantes
  - Simplifica drasticamente as instruções para a IA
- **Truncamento de Emergência**: Durante a execução da requisição, aplica truncamento adicional se necessário
- **Monitoramento em Tempo Real**: Acompanha o tamanho da requisição e executa ajustes dinâmicos
- **Prompts Reduzidos**: Reduz todos os prompts secundários (descrição, tags) para o mínimo essencial
- **Logging Detalhado**: Registra informações sobre o processo de truncamento para facilitar a depuração

Esta abordagem radical garante que as requisições à API de IA fiquem abaixo do limite máximo de tokens, mesmo com textos extremamente longos, priorizando a funcionalidade sobre a completude do conteúdo quando necessário.

#### Vantagens do Novo Sistema
- Reduz significativamente o tamanho das requisições para a API de IA
- Evita o erro de limite de tokens devido a imagens base64 gigantes
- Permite reutilizar imagens em diferentes landing pages
- Melhora o desempenho da aplicação
- Processa textos de copy de qualquer tamanho sem erros de limite de contexto

#### Processamento e Limpeza de HTML
O sistema implementa um mecanismo robusto para garantir que apenas HTML válido seja armazenado:

- **Detecção Inteligente**: Identifica e remove explicações e metadados adicionados pela IA
- **Remoção de Marcações Markdown**: Elimina automaticamente códigos de formatação como ```html ou ``` que podem estar presentes na resposta
- **Extração Precisa**: Identifica o início (<!DOCTYPE html>) e o fim (</html>) do código HTML válido
- **Instruções Específicas**: O prompt fornece diretrizes claras para evitar a inclusão de explicações no código
- **Formatação de Imagens**: Pré-formata as tags de imagem no prompt para garantir o uso correto das URLs
- **Validação de Saída**: Garante que o código HTML resultante seja válido e esteja pronto para uso

Esse processo de limpeza assegura que a landing page resultante contenha apenas o código HTML necessário, sem textos explicativos ou comentários que prejudiquem a visualização ou o funcionamento da página.

#### Sistema de Persistência de Edições
O sistema implementa um mecanismo de persistência de edições que garante que as alterações feitas nas landing pages sejam corretamente salvas e mantidas:

- **Salvamento em Duas Camadas**: As edições são salvas tanto na sessão temporária quanto na landing page permanente
- **Logs Detalhados**: Registros extensivos do processo de atualização para facilitar a depuração
- **Validação Rigorosa**: Verificações em cada etapa do processo de salvamento para garantir integridade
- **Confirmação Visual**: Notificações claras ao usuário sobre o status do salvamento
- **Preservação de Conteúdo**: Garantia que o HTML editado seja preservado entre visualizações da página
- **Verificação de Permissões**: Confirmação que apenas usuários autorizados possam editar as landing pages
- **Sanitização de HTML**: Limpeza do código para remover scripts maliciosos sem afetar a funcionalidade

Esta implementação garante que os usuários não percam seu trabalho quando editam landing pages, mesmo após navegar para fora e retornar à página de edição.

#### Sistema DeepSite
O DeepSite é um sistema avançado para edição de landing pages com assistência de IA em tempo real:

- **Sessões de Edição**: Permite salvar estados intermediários do trabalho.
- **Consultas à IA**: Fornece sugestões e melhorias para o código HTML.
- **Armazenamento em Memória**: Usa armazenamento global para sessões de edição (com limpeza automática após 24h).
- **Editor Visual**: Interface dividida em código HTML e visualização em tempo real.
- **Assistente Integrado**: Chat com IA para solicitar mudanças no código.

### Interface do Usuário

O sistema de landing pages oferece uma interface intuitiva com quatro áreas principais:

1. **Lista de Landing Pages**: Exibe todas as landing pages criadas e sessões de edição ativas.
   - Permite visualizar, editar ou excluir landing pages
   - Mostra sessões de edição em andamento que podem ser continuadas

2. **Gerador de Landing Pages**: Interface para criar novas landing pages com:
   - Formulário detalhado para fornecer informações sobre o produto/serviço
   - Upload de imagens para enriquecer a landing page
   - Indicador de progresso durante a geração
   - Opções de personalização de estilo e conteúdo

3. **Importador de Copy**: Interface para criar landing pages a partir de textos existentes:
   - Campo de texto para colar o conteúdo da copy
   - Upload de imagens para complementar o conteúdo
   - Seleção de estilo visual
   - A IA analisa o texto, extrai elementos-chave e estrutura a landing page automaticamente

4. **Editor DeepSite**: Ambiente avançado de edição que inclui:
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

#### Importação de Copy para Landing Page
```http
POST /api/landing-pages/import-copy
Content-Type: application/json

{
  "title": "Página de Vendas do Curso X",
  "copyText": "Todo o texto da copy/texto de venda...",
  "style": "minimalista",
  "images": ["/uploads/imagem1.jpg", "/uploads/imagem2.jpg"]
}
```