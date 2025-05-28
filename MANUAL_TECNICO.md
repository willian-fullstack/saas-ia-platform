# Manual Técnico - SAS IA Platform

Este manual técnico documenta a arquitetura, componentes e processos utilizados no sistema SAS IA Platform, com foco especial no módulo DeepSite para geração de landing pages.

## Arquitetura Geral

O sistema foi desenvolvido com base em uma arquitetura moderna de microserviços, utilizando Next.js como framework principal tanto para frontend quanto para backend (API Routes). Os principais componentes são:

- **Frontend:** React 19 com Next.js 15+, Tailwind CSS e shadcn/ui
- **Backend:** Next.js API Routes com Edge Runtime para melhor performance
- **Banco de Dados:** MongoDB com Mongoose para persistência de dados
- **Autenticação:** NextAuth.js com Google OAuth
- **Integrações externas:** OpenAI, DeepSeek, Mercado Pago

## Módulo DeepSite - Gerador de Landing Pages

O DeepSite é um sistema avançado para geração de landing pages usando IA generativa. Foi implementado com base no projeto original "deepsite" e adaptado para o ecossistema SAS.

### Atualizações Recentes

**Versão 2.0.0 - Integração Completa com DeepSite**

Foram implementadas melhorias significativas para equiparar o gerador de landing pages do SAS com o sistema DeepSite original, incluindo:

1. **Sistema de Processamento Avançado**
   - Implementação de processamento completo de imagens através de marcadores `__IMG_N__`
   - Integração com bibliotecas externas (Bootstrap, AOS, FontAwesome) para efeitos visuais avançados
   - Suporte para animações ao scroll e efeitos de interação modernos
   - Processamento de estilos CSS para garantir compatibilidade com imagens e animações

2. **Sistema de Diff Robusto**
   - Nova implementação do sistema de diff para aplicação de modificações em landing pages existentes
   - Múltiplas estratégias de fallback para garantir aplicação correta de modificações
   - Suporte para diff fuzzy com tolerância configurável para correspondências aproximadas

3. **SEO e Tracking Integrados**
   - Adição automática de meta tags para SEO
   - Suporte para integração com Google Analytics, Facebook Pixel e Google Tag Manager
   - Configuração detalhada de tags Open Graph para compartilhamento em redes sociais

4. **Prompt Engineering Aprimorado**
   - Atualização do prompt para gerar landing pages com uso adequado de bibliotecas externas
   - Instruções para criação de designs modernos com gradientes, sombras e efeitos visuais
   - Diretrizes para estrutura semântica adequada e microdados para SEO

**Versão 1.2.0 - Melhorias de Código Autossuficiente**

Foram implementadas melhorias significativas para garantir que as landing pages geradas sejam totalmente autossuficientes:

1. **Prompt Engineering**
   - Reforço das restrições no prompt para proibir explicitamente o uso de CDNs e recursos externos
   - Instruções detalhadas para criação de código HTML/CSS/JS completamente autossuficiente
   - Diretivas para uso de SVG inline em vez de bibliotecas de ícones externas

2. **Sanitização HTML Avançada**
   - Suporte completo a elementos SVG para garantir funcionamento de ícones e gráficos
   - Lista abrangente de propriedades CSS permitidas para design moderno e responsivo
   - Configurações de segurança balanceadas para permitir funcionalidades avançadas

3. **Algoritmo de Diff Aprimorado**
   - Implementação de múltiplas estratégias de fallback para aplicação de modificações
   - Uso de diff-match-patch com configurações otimizadas para correspondência aproximada
   - Algoritmo de correspondência de contexto para modificações mais complexas

### Componentes Principais

1. **Geração Inicial de HTML**
   - Endpoint: `/api/landing-pages/deepsite`
   - Responsável por gerar o HTML completo da landing page com base nos parâmetros fornecidos
   - Utiliza o modelo DeepSeek Coder para geração de código HTML/CSS de alta qualidade
   - Suporte para configurações avançadas de SEO, tracking e animações
   - Processamento de imagens através de marcadores para substituição posterior

2. **Sistema de Streaming para Melhorias**
   - Endpoint: `/api/landing-pages/deepsite/ask-ai`
   - Permite solicitar melhorias incrementais na landing page
   - Implementa streaming de respostas para feedback em tempo real
   - Processa buffer para garantir respostas completas mesmo com chunks parciais
   - Instruções para geração de HTML com recursos visuais avançados

3. **Mecanismo de Aplicação de Diffs**
   - Endpoint: `/api/landing-pages/deepsite/apply-diffs`
   - Processa blocos SEARCH/REPLACE para aplicar modificações incrementais
   - Implementa múltiplas estratégias de fallback:
     - Substituição direta (para correspondências exatas)
     - Aplicação de patches via diff-match-patch (para correspondências aproximadas)
     - Correspondência fuzzy para diferenças pequenas no texto
   - Suporte para extração de blocos de diff entre duas versões de HTML

4. **Gerenciamento de Sessões**
   - Armazenamento em memória de sessões de edição
   - Sistema de proteção contra acesso não autorizado
   - Validação e autenticação de requisições
   - Persistência de histórico de modificações

### Processamento Avançado de Landing Pages

1. **Processamento de Imagens**
   - Substituição de marcadores `__IMG_N__` por URLs reais
   - Processamento de marcadores em atributos src, estilos inline e folhas de estilo
   - Detecção inteligente de marcadores em diferentes contextos

2. **Integração com Bibliotecas Externas**
   - Carregamento otimizado de Bootstrap para componentes responsivos
   - Integração com AOS (Animate on Scroll) para animações ao rolar a página
   - Suporte para Google Fonts e FontAwesome para tipografia e ícones

3. **SEO e Metatags**
   - Adição automática de meta tags para SEO
   - Configuração de tags Open Graph para compartilhamento em redes sociais
   - Suporte para keywords e descrições personalizadas

4. **Tracking e Analytics**
   - Integração com Google Analytics
   - Suporte para Facebook Pixel
   - Configuração de Google Tag Manager
   - Inserção segura de scripts de tracking no HTML

### Segurança

1. **Sanitização de HTML**
   - Remoção de tags e atributos potencialmente perigosos
   - Configuração personalizada de tags e atributos permitidos
   - Preservação de estilos CSS necessários para o design
   - Suporte completo para elementos SVG para ícones e gráficos
   - Lista abrangente de propriedades CSS permitidas para design responsivo

2. **Validação de Entrada**
   - Esquemas Zod para validação rigorosa de dados de entrada
   - Mensagens de erro descritivas para facilitar a depuração
   - Prevenção contra injeção de código malicioso

3. **Controle de Acesso**
   - Autenticação via NextAuth.js
   - Verificação de propriedade de sessões
   - Proteção contra acesso não autorizado a recursos

4. **Filtragem de Scripts**
   - Remoção de scripts potencialmente maliciosos
   - Permissão apenas para scripts de bibliotecas confiáveis
   - Remoção de manipuladores de eventos inline para prevenir XSS

### Integração com Sistema de Créditos

1. **Consumo de Créditos**
   - Verificação de saldo antes de operações
   - Consumo de créditos após operações bem-sucedidas
   - Registro detalhado de transações

2. **Operações Tarifadas**
   - GENERATE_LANDING_PAGE: Geração inicial da landing page
   - IMPROVE_LANDING_PAGE: Solicitação de melhorias via ask-ai
   - APPLY_DIFFS: Aplicação de modificações estruturais

### Performance

O módulo utiliza a classe `Performance` para monitorar o desempenho:

1. **Métricas Registradas**
   - `deepseek_request`: Tempo de resposta da API DeepSeek
   - `landing_page_generation`: Tempo total para gerar uma landing page
   - `ask_ai_setup`: Tempo de configuração para streaming de melhorias
   - `apply_diffs`: Tempo para aplicar modificações no HTML

2. **Otimizações**
   - Streaming de respostas para feedback imediato
   - Buffer management para processamento eficiente de chunks
   - Cache de sessões para acesso rápido a dados frequentes
   - Retry com backoff exponencial para lidar com falhas transitórias

### Tratamento de Erros

1. **Retry Automatizado**
   - Backoff exponencial para erros de rede
   - Número máximo de tentativas configurável
   - Detecção inteligente de erros transitórios

2. **Logging Detalhado**
   - Registro de erros com contexto completo
   - Informações de diagnóstico para depuração
   - Rastreamento de solicitações através do sistema

### Próximos Passos

Melhorias planejadas para futuras versões:

1. **Sistema de Template**
   - Implementação de templates predefinidos para diferentes nichos
   - Customização avançada de templates existentes
   - Biblioteca de componentes reutilizáveis

2. **Otimização de Imagens**
   - Geração e otimização automática de imagens
   - Lazy loading e técnicas de otimização de performance
   - Suporte para formatos modernos (WebP, AVIF)

3. **Analytics Integrado**
   - Código de rastreamento incorporado
   - Dashboard de métricas de conversão
   - A/B testing de elementos da página

4. **Editor Visual**
   - Interface drag-and-drop para edição de landing pages
   - Personalização visual sem conhecimento de código
   - Modo de edição avançado para desenvolvedores

## Integração com DeepSeek API

O sistema utiliza a API DeepSeek para geração de código HTML e aplicação de melhorias. A implementação inclui:

1. **Cliente Robusto**
   - Tratamento abrangente de erros
   - Sistema de retry com backoff exponencial
   - Timeout para evitar requisições penduradas

2. **Otimização de Prompts**
   - Prompts específicos para geração de HTML completo
   - Instruções detalhadas para o formato de blocos SEARCH/REPLACE
   - Contexto adequado para melhorias incrementais

3. **Configuração de Modelos**
   - Uso do modelo DeepSeek Coder para melhor qualidade de código
   - Parâmetros otimizados para geração de HTML
   - Fallback para modelos alternativos em caso de falha

## Considerações de Manutenção

1. **Monitoramento**
   - Implementar logging adicional para operações críticas
   - Configurar alertas para falhas frequentes na API
   - Monitorar uso de créditos para evitar esgotamento

2. **Escalabilidade**
   - Migrar armazenamento de sessões para Redis em produção
   - Implementar sistema de fila para requisições em momentos de pico
   - Otimizar uso de recursos em ambientes com múltiplos usuários

3. **Futuras Melhorias**
   - Implementar exportação para diversos formatos (WordPress, Webflow, etc.)
   - Adicionar biblioteca de componentes pré-fabricados
   - Desenvolver sistema de templates personalizáveis

## Bibliotecas e Dependências

As principais bibliotecas utilizadas no módulo DeepSite são:

- **diff-match-patch:** Para aplicação eficiente de diferenças textuais
- **next/server:** Para funcionalidades de streaming e resposta HTTP
- **zod:** Para validação de dados de entrada
- **html-react-parser:** Para conversão segura de HTML para React
- **sanitize-html:** Para remoção de conteúdo perigoso do HTML gerado
- **jsdom:** Para manipulação e processamento avançado de HTML
- **cheerio:** Para manipulação e sanitização de HTML

## Apêndice: Parâmetros de Configuração para Geração de Landing Pages

### Parâmetros Básicos
- `title`: Título principal da landing page
- `description`: Descrição do produto/serviço
- `tone`: Tom da comunicação (profissional, amigável, etc.)
- `callToAction`: Texto para botões de ação
- `color`: Cor principal (hexadecimal ou nome)
- `includeComponents`: Componentes a incluir (header, hero, etc.)
- `additionalInfo`: Informações adicionais relevantes

### Parâmetros Avançados
- `imageUrls`: Array de URLs de imagens para substituir marcadores
- `seoConfig`: Configurações de SEO (title, description, keywords, etc.)
- `trackingConfig`: Configurações de tracking (GA, Pixel, GTM) 