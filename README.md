# SaaS IA Platform

Uma plataforma All-in-One para Criadores de Conteúdo, Afiliados, Dropshippers e Closers, com funcionalidades de IA para copywriting, geração de imagens, vídeos, landing pages e muito mais.

## Tecnologias Utilizadas

- **Frontend:** React, Next.js 14+, Tailwind CSS, shadcn/ui, Lucide React
- **Backend:** Next.js API Routes com Edge Runtime
- **IA:** OpenAI GPT-4-turbo, DeepSeek Chat API
- **Banco de Dados:** MongoDB com Mongoose
- **Autenticação:** NextAuth.js com autenticação via Google
- **Pagamentos:** Integração completa com Mercado Pago para assinaturas recorrentes
- **Gestão de Créditos:** Sistema avançado de créditos e histórico detalhado de consumo
- **Cache:** Sistema de cache em memória para otimização de requisições
- **Monitoramento:** Sistema próprio de logging e monitoramento de performance
- **Gerenciamento de Estado:** React Hooks e Context API
- **Validação:** Zod para validação de dados
- **Formatação de Data:** date-fns com suporte a pt-BR
- **UI/UX:** Sistema de feedback visual em tempo real

## Requisitos

- Node.js 18+ LTS
- NPM ou Yarn
- MongoDB (local ou Atlas)
- Chaves de API:
  - OpenAI API Key
  - DeepSeek API Key
  - Google OAuth Client ID e Secret
  - Mercado Pago Access Token (para processamento de pagamentos)

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
```bash
MONGODB_URI=sua_uri_do_mongodb
NEXTAUTH_SECRET=seu_secret_para_nextauth
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=seu_client_id_do_google
GOOGLE_CLIENT_SECRET=seu_client_secret_do_google
OPENAI_API_KEY=sua_chave_da_openai
DEEPSEEK_API_KEY=sua_chave_da_deepseek
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_do_mercado_pago
```

5. Definir usuário administrador:
```bash
npm run setup-admin -- --email=seu_email@exemplo.com
```

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
- **Novo:** Consumo automático de créditos conforme uso
- **Novo:** Validação em tempo real de créditos disponíveis

### 3. IA de Ofertas
- Geração de ofertas persuasivas completas
- Configurações personalizáveis:
  - Nicho e produto
  - Público-alvo
  - Faixa de preço
  - Quantidade de bônus (1-7)
  - Pontos de dor do público
  - Elementos de desconto e urgência
- Formatos de saída:
  - Oferta completa detalhada
  - Resumo em tópicos
- Salvamento automático das criações
- Preview em tempo real com animação de geração
- **Novo:** Sistema de consumo de créditos integrado
- **Novo:** Melhorias na interface de usuário e feedback visual

### 4. Consultor IA 24h
- Chat em tempo real com IA especializada
- Suporte a múltiplas áreas de expertise:
  - Marketing Digital (White/Black Hat)
  - Copywriting Persuasivo
  - Tráfego Pago
  - Vendas
  - Lançamentos Digitais
  - Redes Sociais
  - Criação de Conteúdo
- Funcionalidades:
  - Respostas rápidas e sem censura
  - Animação de digitação em tempo real
  - Histórico de conversas
  - Configuração de especialidade
  - Cache inteligente para respostas similares
  - Salvamento automático das interações
- Interface moderna e responsiva:
  - Indicadores visuais de status
  - Formatação automática de mensagens
  - Suporte a atalhos de teclado
  - Modo claro/escuro
- **Novo:** Integração completa com sistema de créditos
- **Novo:** Respostas mais precisas e personalizadas por área

### 5. Gerenciamento de Criações
- Sistema unificado para todas as criações do usuário
- Organização por tipo de conteúdo
- Funcionalidades:
  - Listagem com filtros
  - Preview do conteúdo
  - Download em formato apropriado
  - Cópia rápida para clipboard
  - Visualização de landing pages
- Exibição de atividades recentes no dashboard
- Proteção contra acesso não autorizado
- **Novo:** Interface aprimorada para visualização de histórico
- **Novo:** Categorização inteligente de criações

### 6. Sistema de Performance
- Monitoramento de tempo de resposta das APIs
- Cache inteligente para requisições repetidas
- Rate limiting para proteção da API
- Logs detalhados para debugging
- Tratamento robusto de erros
- **Novo:** Melhorias significativas na performance de respostas
- **Novo:** Otimizações para redução de latência em todos os módulos

### 7. Sistema de Assinaturas e Créditos (Completamente Implementado)
- **Novo:** Integração completa com Mercado Pago para processamento de pagamentos recorrentes
- **Novo:** Interface amigável para seleção e assinatura de planos
- **Novo:** Checkout seguro com redirecionamento para pagamento
- **Novo:** Webhook para processamento automático de notificações de pagamento
- **Novo:** Painel de administração para gestão completa de planos e créditos
- **Novo:** Histórico detalhado de consumo de créditos com filtros avançados
- **Novo:** Visualização de status da assinatura em tempo real
- **Novo:** Sistema de notificações para estado da assinatura e saldo de créditos
- **Novo:** Controle granular de custos de créditos por funcionalidade

### 8. Área Administrativa
- **Novo:** Painel completo de administração com acesso restrito
- **Novo:** Gestão de planos de assinatura (criação, edição, ativação/desativação)
- **Novo:** Configuração de preços e quantidade de créditos por plano
- **Novo:** Definição de custos de créditos para cada funcionalidade
- **Novo:** Visualização de métricas e estatísticas de uso
- **Novo:** Interface intuitiva para todas as operações administrativas

## Sistema de Assinaturas (Documentação Detalhada)

### Planos Disponíveis
- **Básico (Gratuito)**
  - Créditos limitados para testes iniciais
  - Acesso a funcionalidades básicas
  - Sem cobranças recorrentes

- **Médio (Pago)**
  - Quantidade intermediária de créditos mensais
  - Acesso a todas as funcionalidades
  - Renovação automática mensal

- **Avançado (Pago)**
  - Grande quantidade de créditos mensais
  - Acesso a todas as funcionalidades com prioridade
  - Renovação automática mensal

### Integração com Mercado Pago
- Integração completa com a nova SDK do Mercado Pago (v2+)
- Checkout transparente com redirecionamento seguro
- Processamento automático de callbacks de pagamento
- Webhook para processamento assíncrono de notificações de pagamento
- Suporte a diferentes status de pagamento (pendente, aprovado, rejeitado)
- Mapeamento adequado entre pagamentos e assinaturas do usuário
- Logs detalhados para rastreamento de transações

### Gestão de Créditos
- Cada funcionalidade de IA consome uma quantidade específica de créditos
- Os créditos são renovados automaticamente com a renovação da assinatura
- Histórico completo de uso de créditos
- Notificações de créditos baixos
- Possibilidade de comprar créditos extras

### Área Administrativa
- Painel exclusivo para administradores
- Gerenciamento de custos de créditos por funcionalidade
- Visualização de estatísticas de uso
- Ativação/desativação de funcionalidades
- Gestão de planos de assinatura

### Configuração do Mercado Pago

Para habilitar a integração com o Mercado Pago, adicione a seguinte variável ao seu arquivo `.env.local`:

```
MERCADO_PAGO_ACCESS_TOKEN=seu_token_de_acesso
```

Você pode obter seu token de acesso no [Painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel/credentials).

O sistema foi projetado para operar em dois modos:
1. **Modo Completo:** Com token configurado, utilizando a API real do Mercado Pago
2. **Modo Simulado:** Sem token configurado, simulando respostas para desenvolvimento

No modo simulado, você poderá testar toda a funcionalidade sem precisar de uma conta no Mercado Pago.

### Implementação Atualizada do Mercado Pago

A integração com o Mercado Pago foi completamente reescrita para utilizar a versão mais recente da API oficial (v2). As principais melhorias incluem:

- **Uso da nova SDK:** Implementação utilizando a nova API `MercadoPagoConfig` e `Preference` para maior compatibilidade e estabilidade.
- **Estruturação correta das preferências:** Configuração otimizada para minimizar erros de validação.
- **Remoção do parâmetro auto_return:** Configuração simplificada para maior compatibilidade com a API.
- **Melhor tratamento de respostas:** Sistema mais robusto para processar retornos da API.
- **Logs detalhados:** Registro completo das preferências e respostas para facilitar o diagnóstico de problemas.
- **Webhooks aprimorados:** Tratamento otimizado de notificações de pagamento com suporte a todos os status.
- **Compatibilidade com testes:** Suporte para contas de teste vendedor/comprador seguindo as melhores práticas.
- **Atualização robusta de assinaturas:** Melhorias feitas para garantir que ao mudar de plano o ID do plano seja atualizado corretamente.
- **Correção do processamento de créditos:** Resolução do problema de pagamentos aprovados que permaneciam como pendentes, com a implementação de:
  - Verificação robusta de IDs de assinatura nas notificações
  - Verificação e processamento correto de metadados
  - Melhor tratamento de referências externas
  - Adição de logs extensivos para rastreamento de problemas
  - Implementação correta de adição de créditos (em vez de substituição)
  - Revalidação de cache para atualização instantânea da interface após pagamentos
  - Endpoint seguro para revalidação com proteção por token secreto

### Correções Importantes

- **Registro de usuários:** Correção do problema com o campo CPF no registro de usuários, que causava erro de duplicidade mesmo quando o campo estava vazio
  - Remoção do índice único no campo CPF para evitar conflitos
  - Remoção manual do índice `cpf_1` do banco de dados usando script especializado
  - Configuração do campo CPF com `sparse: true` e `default: undefined`
  - Adição de script de utilidade (scripts/remove-cpf-index.js) para remoção de índices problemáticos
  - Tratamento adequado de valores vazios e nulos
  - Mensagens de erro específicas para facilitar a identificação do problema

Para testar pagamentos, lembre-se de:
1. Criar contas de teste separadas para vendedor e comprador no painel do Mercado Pago
2. Usar uma aba anônima/privada ao testar pagamentos (para evitar o erro "não é possível pagar para si mesmo")
3. Configurar chaves Pix nas contas de teste para habilitar essa opção de pagamento
4. **Novo:** Configurar corretamente a URL pública do webhook nas variáveis de ambiente:
   ```
   NEXT_PUBLIC_BASE_URL=https://sua-url-publica.com
   NEXT_PUBLIC_WEBHOOK_URL=https://sua-url-publica.com/api/webhooks/mercadopago
   ```

As configurações podem ser gerenciadas no painel do desenvolvedor do Mercado Pago em: https://www.mercadopago.com.br/developers/panel/

#### Script de Correção de Assinaturas Pendentes

Foi desenvolvido um script auxiliar para ajudar na correção manual de assinaturas que possam ter ficado pendentes durante o período de ajustes:

```bash
node scripts/fix-subscriptions.js
```

Este script permite que o administrador visualize todas as assinaturas pendentes e escolha quais devem ser ativadas manualmente, adicionando os créditos correspondentes aos usuários.

### Uso e Configuração do Sistema de Planos

#### Para Administradores:
1. Acesse `/dashboard/admin/plans` para gerenciar os planos
2. Crie planos com diferentes preços, créditos e recursos
3. Ative/desative planos conforme necessário
4. Configure os custos de créditos em `/dashboard/admin/credits`

#### Para Usuários:
1. Acesse `/dashboard/subscription` para visualizar e assinar planos
2. Selecione um plano de acordo com suas necessidades
3. Complete o pagamento via Mercado Pago (ou automaticamente para planos gratuitos)
4. Acompanhe o consumo de créditos em `/dashboard/credits/history`

## Estrutura do Projeto

```
sas-ia-platform/
├── src/
│   ├── app/
│   │   ├── api/                 # Rotas de API
│   │   │   ├── auth/           # Autenticação
│   │   │   ├── consultant/     # API do Consultor IA
│   │   │   ├── copywriting/    # API de Copywriting
│   │   │   ├── offers/         # API de Ofertas
│   │   │   ├── credits/        # API de Gerenciamento de Créditos
│   │   │   ├── admin/          # APIs Administrativas
│   │   │   ├── subscription/   # API de Assinaturas
│   │   │   ├── webhooks/       # Webhooks para integrações externas
│   │   │   └── user-creations/ # Gerenciamento de criações
│   │   ├── dashboard/          # Interface principal
│   │   │   ├── consultant/     # Página do Consultor IA
│   │   │   ├── copywriting/    # Página de Copywriting
│   │   │   ├── creative/       # Página de Criativos
│   │   │   ├── offers/         # Página de Ofertas
│   │   │   ├── subscription/   # Página de Assinaturas
│   │   │   ├── credits/        # Páginas de Créditos
│   │   │   ├── admin/          # Páginas Administrativas 
│   │   │   ├── payment/        # Páginas de Pagamento e Retorno
│   │   │   └── tools/         # Página de Ferramentas
│   │   ├── login/             # Página de login
│   │   ├── profile/           # Perfil do usuário
│   │   ├── transcription/     # Transcrição de áudio
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx          # Página inicial
│   │   └── globals.css       # Estilos globais
│   ├── components/
│   │   ├── ai-modules/        # Componentes dos módulos de IA
│   │   │   ├── copywriting/   # Módulo de copywriting
│   │   │   ├── offers/        # Módulo de ofertas
│   │   │   └── user-creations/ # Componentes de criações
│   │   ├── dashboard/         # Componentes do dashboard
│   │   │   ├── header.tsx     # Cabeçalho do dashboard
│   │   │   ├── sidebar.tsx    # Barra lateral do dashboard
│   │   │   └── mobile-menu.tsx # Menu mobile do dashboard
│   │   ├── subscription/      # Componentes de assinatura
│   │   │   ├── PlanCard.tsx   # Card de plano de assinatura
│   │   │   ├── PaymentStatus.tsx # Status de pagamento
│   │   │   └── CreditsBadge.tsx # Badge de créditos
│   │   ├── ui/               # Componentes de UI reutilizáveis
│   │   │   ├── button/       # Botões customizados
│   │   │   ├── dialog/       # Modais e diálogos
│   │   │   ├── form/         # Componentes de formulário
│   │   │   └── theme/        # Componentes de tema
│   │   ├── logout-button.tsx  # Botão de logout
│   │   ├── user-profile-button.tsx # Botão de perfil
│   │   ├── providers.tsx      # Provedores de contexto
│   │   └── theme-provider.tsx # Provedor de tema
│   ├── lib/
│   │   ├── db/               # Modelos e funções do banco de dados
│   │   │   ├── models/       # Modelos do MongoDB
│   │   │   │   ├── User.ts   # Modelo de usuário
│   │   │   │   ├── Plan.ts   # Modelo de plano
│   │   │   │   ├── Subscription.ts # Modelo de assinatura
│   │   │   │   ├── CreditHistory.ts # Modelo de histórico de créditos
│   │   │   │   └── Creation.ts # Modelo de criações de usuário
│   │   │   └── connect.ts    # Conexão com o banco
│   │   ├── auth.ts          # Configurações de autenticação
│   │   ├── hooks/           # Hooks personalizados
│   │   │   ├── useCredits.ts # Hook para gerenciamento de créditos
│   │   │   ├── useSubscription.ts # Hook para gerenciamento de assinaturas
│   │   │   └── useCreations.ts # Hook para gerenciamento de criações
│   │   ├── performance.ts   # Utilitários de performance
│   │   └── utils.ts         # Funções utilitárias gerais
│   └── services/            # Serviços externos e integrações
│       ├── mercadopago.ts   # Integração com Mercado Pago
│       ├── copywriting.ts   # Serviço de IA para copywriting
│       └── user-creations.ts # Gerenciamento de criações de usuário
├── public/                  # Arquivos estáticos
├── node_modules/           # Dependências
├── .env                    # Variáveis de ambiente
├── .env.example           # Exemplo de variáveis de ambiente
├── next.config.ts         # Configuração do Next.js
├── package.json           # Dependências e scripts
├── postcss.config.js      # Configuração do PostCSS
├── tailwind.config.js     # Configuração do Tailwind
└── tsconfig.json          # Configuração do TypeScript
```

## Atualizações Recentes

### Melhorias de UX
- Implementação de listagem de criações recentes no dashboard
- Animação progressiva na geração de textos
- Feedback visual em tempo real para todas as ações
- Interface responsiva e consistente
- **Novo:** Animação de digitação no Consultor IA
- **Novo:** Indicadores visuais de status em tempo real
- **Novo:** Menu mobile otimizado para navegação rápida
- **Novo:** Exibição de créditos em tempo real no cabeçalho
- **Novo:** Aprimoramentos visuais em todas as páginas administrativas

### Consumo de Créditos nas Ferramentas de IA
- **Novo:** Implementação completa do consumo de créditos em todas as ferramentas de IA
- **Novo:** Integração do sistema de créditos com todas as APIs da plataforma
- **Novo:** Mensagens de erro aprimoradas para notificar sobre créditos insuficientes
- **Novo:** Atualização em tempo real do saldo de créditos após cada uso
- **Novo:** Sistema de eventos para sincronizar o saldo em toda a aplicação
- **Novo:** Tratamento de erro gracioso para tentativas de uso sem créditos suficientes
- **Novo:** Otimização do processo de validação e consumo para redução de latência

### Sistema de Gerenciamento de Planos e Créditos
- **Novo:** Implementação completa do gerenciamento de planos de assinatura
- **Novo:** Interface administrativa para controle de planos (criação, edição, ativação/desativação)
- **Novo:** Exibição de cartões atrativos para seleção de planos pelos usuários
- **Novo:** Configuração de recursos e características por plano
- **Novo:** Sistema resiliente para funcionamento com ou sem integração de pagamentos
- **Novo:** Endpoints de API para administração de planos no formato RESTful
- **Novo:** Histórico detalhado de consumo de créditos com informações completas
- **Novo:** Interface de gerenciamento de créditos para administradores

### Integração com Mercado Pago
- **Novo:** Implementação completa do fluxo de checkout oficial do Mercado Pago
- **Novo:** Tratamento de erros e resiliência na integração
- **Novo:** Suporte para assinaturas recorrentes automatizadas
- **Novo:** Gerenciamento de estados de pagamento (pendente, aprovado, rejeitado)
- **Novo:** Suporte para cancelamento de assinaturas
- **Novo:** Compatibilidade com ambiente de desenvolvimento e produção
- **Novo:** Páginas de retorno após conclusão do pagamento (sucesso, pendente, falha)
- **Novo:** Tratamento de webhooks para atualização automática de status

## Próximos Passos

1. **Módulos em Desenvolvimento:**
   - IA de Criativos Visuais
   - IA de Vídeos Curtos
   - Transcrição de Áudio
   - Dashboard administrativo com métricas de uso e receita
   - Relatórios de consumo de créditos por funcionalidade

2. **Melhorias Planejadas:**
   - Implementação de testes automatizados
   - Sistema de métricas e analytics
   - Otimização de performance
   - Expansão do sistema de cache
   - Melhorias no sistema de notificações de pagamento
   - Interface para visualização de histórico de créditos pelo usuário
   - Sistema de recomendação de planos com base no consumo

3. **Novas Funcionalidades:**
   - Integração com mais APIs de IA
   - Sistema de templates personalizados
   - Exportação de dados
   - Dashboards analíticos
   - Cupons de desconto para planos
   - Sistema de afiliados
   - Bônus de créditos por indicação
   - Notificações por email para status de assinatura

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 