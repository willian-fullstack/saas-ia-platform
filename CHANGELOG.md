# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [1.3.0] - 2023-07-15

### Adicionado
- Sistema completo de salvamento e gerenciamento de landing pages
- Página de listagem de landing pages com busca e filtragem
- Visualização detalhada de landing pages com modos desktop e mobile
- Editor de landing pages com preview em tempo real
- API para gerenciamento de landing pages (CRUD)
- Modelo de dados Prisma para armazenamento de landing pages
- Integração com PostgreSQL via Prisma
- Scripts para gerenciamento de migrações do banco de dados

### Melhorado
- Interface do DeepSite com opção para salvar landing pages
- Documentação atualizada com instruções para PostgreSQL
- Menu de navegação com destaque para o novo módulo de landing pages
- Estrutura de arquivos reorganizada para melhor escalabilidade

## [1.2.0] - 2023-06-20

### Adicionado
- Prompts aprimorados para garantir código 100% autossuficiente
- Sanitização avançada de HTML com suporte a SVG e CSS moderno
- Algoritmo de diff com três níveis de estratégias de fallback
- Bloqueio rigoroso de bibliotecas externas e CDNs
- Processamento de buffer otimizado para streaming de respostas

### Melhorado
- Performance do sistema de streaming de respostas
- Tratamento de erros durante a geração de landing pages
- Validação de entrada e saída para garantir qualidade do código gerado

## [1.1.0] - 2023-05-10

### Adicionado
- DeepSite: Gerador de Landing Pages com IA
- Sistema de streaming para solicitações de melhorias
- Aplicação de modificações incrementais via diff
- Suporte a múltiplos estilos e componentes
- Sanitização e validação automática do HTML
- Preview em tempo real das modificações
- Exportação do código fonte
- Integração com o sistema de créditos

### Melhorado
- Sistema de autenticação com papéis de usuário
- Interface do dashboard com novos módulos

## [1.0.0] - 2023-04-01

### Adicionado
- Sistema de Autenticação
- IA de Copywriting
- Sistema de Créditos
- Integração com gateway de pagamento

## [Não lançado]

### Adicionado

- Módulo de Landing Pages para criação e gerenciamento de landing pages com IA
- Sistema de login com autenticação via Google
- API de Créditos para controlar uso de serviços pagos
- Documentação técnica completa

### Alterado

- Migração da API OpenAI para DeepSeek no módulo de landing pages
- Melhorias na interface do dashboard
- Otimização de performance no carregamento de páginas 