# SaaS IA Platform

Uma plataforma All-in-One para Criadores de Conteúdo, Afiliados, Dropshippers e Closers, com funcionalidades de IA para copywriting, geração de imagens, vídeos, landing pages e muito mais.

## Tecnologias Utilizadas

- **Frontend:** React, Next.js, Tailwind CSS, shadcn/ui, Lucide React
- **Backend:** Next.js API Routes
- **IA:** OpenAI GPT-4-turbo, DeepSeek Chat API
- **Banco de Dados:** A ser implementado
- **Autenticação:** NextAuth.js (a ser implementado)

## Requisitos

- Node.js 18+ LTS
- NPM ou Yarn
- Chave de API da OpenAI
- Chave de API da DeepSeek (para o módulo de Copywriting Black)

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

3. Copie o arquivo de exemplo de variáveis de ambiente e configure suas chaves:
```bash
cp .env.local.example .env.local
```

4. Edite o arquivo `.env.local` e adicione suas chaves de API:
   - `OPENAI_API_KEY`: Sua chave da API da OpenAI
   - `DEEPSEEK_API_KEY`: Sua chave da API da DeepSeek

## Executando o Projeto

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse http://localhost:3000 no seu navegador.

Para construir para produção:

```bash
npm run build
npm start
```

## Atualizações Recentes

- **Clean Code:**
  - Remoção de importações não utilizadas no módulo de Landing Pages
  - Eliminação dos erros de lint no módulo de geração de landing pages
  - Otimização de código com redução de dependências desnecessárias

- **Experiência de usuário melhorada:** 
  - Animação progressiva de geração de texto para feedback visual em tempo real
  - Interface responsiva e consistente em diferentes módulos
  - Indicadores de status durante o processamento da IA

- **Melhorias técnicas:**
  - Correção de configurações no `next.config.ts` para compatibilidade com Next.js 15.3+
  - Otimização da renderização de componentes para evitar duplicações
  - Implementação de tratamento de erros robusto com timeout para requisições à API

- **Ajustes de performance:**
  - Código mais limpo e organizado com implementação de funções reutilizáveis
  - Melhor feedback visual durante o carregamento de operações longas
  - Desativação automática de campos durante processamento

## Módulos Implementados

### 1. IA de Landing Pages
- Gera código HTML completo para landing pages de alta conversão
- Personalização por:
  - Nicho de mercado
  - Produto/serviço
  - Benefícios principais (até 6)
  - Público-alvo
  - Call-to-action
  - Opção de incluir seção de depoimentos
  - Preço/oferta
  - Estilo visual (minimalista, moderno, colorido, corporativo, elegante)
- Código pronto para copiar e usar em qualquer plataforma

### 2. IA de Ofertas
- Cria textos persuasivos para ofertas de produtos/serviços
- Configurações:
  - Nicho e nome do produto
  - Descrição detalhada
  - Público-alvo específico
  - Faixa de preço (baixo, médio, alto, premium)
  - Quantidade de bônus (1-7)
  - Pontos de dor do público
  - Inclusão de desconto com justificativa
  - Elemento de urgência/escassez
  - Formato detalhado ou resumido
- Animação em tempo real durante a geração da oferta
- Interface responsiva com exibição progressiva do conteúdo

### 3. Consultor IA 24h
- Chat interativo com IA especializada em marketing e copywriting
- Recursos:
  - Interface de chat completa em tempo real
  - Seleção de área de especialidade (marketing digital, copywriting, tráfego pago, etc.)
  - Histórico de conversa persistente
  - Suporte a perguntas complexas sobre estratégias de marketing

### 4. Transcrição de Áudio
- Converte arquivos de áudio em texto
- Recursos:
  - Upload de arquivos de áudio
  - Processamento rápido
  - Resultado em formato editável
  - Opção para copiar texto para clipboard

### 5. IA de Copywriting Black
- Gera textos persuasivos sem restrições para diversas finalidades
- Recursos:
  - Múltiplos tipos de texto (Headlines, Email Marketing, Black Hat Marketing)
  - Diferentes tons de mensagem (Persuasivo, Agressivo, Manipulador, etc.)
  - Estruturas de persuasão personalizáveis (AIDA, PAS, Escassez, Fear Based)
  - Feedback visual em tempo real durante a geração
  - Interface responsiva com exibição progressiva do conteúdo
  - Sem censura ou restrição de conteúdo

## Módulos em Desenvolvimento

- **IA de Criativos Visuais**
  - Geração de imagens para anúncios e redes sociais

- **IA de Vídeos Curtos**
  - Scripts e estruturas para conteúdo viral

- **Roteiro para Shorts**
  - Fórmulas de storytelling otimizadas para plataformas de vídeo curto

## Estrutura do Projeto

```
sas-ia-platform/
├── src/
│   ├── app/                     # Páginas da aplicação (Next.js App Router)
│   │   ├── api/                 # Rotas de API para os módulos de IA
│   │   │   ├── consultant/      # API para o Consultor IA 24h
│   │   │   ├── copywriting/     # API para Copywriting Black
│   │   │   ├── landing-pages/   # API para geração de landing pages
│   │   │   └── offers/          # API para geração de ofertas
│   │   └── dashboard/           # Interface do usuário
│   │       ├── consultant/      # Página do Consultor IA
│   │       ├── copywriting/     # Página de geração de copywriting
│   │       ├── landing-pages/   # Página de geração de landing pages
│   │       ├── offers/          # Página de geração de ofertas
│   │       └── transcription/   # Página de transcrição de áudio
│   ├── components/              # Componentes React
│   │   ├── ai-modules/          # Componentes específicos dos módulos de IA
│   │   └── ui/                  # Componentes de UI reutilizáveis
│   └── lib/                     # Funções utilitárias e serviços
└── public/                      # Arquivos estáticos
```

## Uso dos Módulos

### IA de Landing Pages
1. Navegue para `/dashboard/landing-pages`
2. Preencha os campos do formulário (nicho, produto, benefícios, etc.)
3. Clique em "Gerar Landing Page"
4. Copie o código HTML gerado para usar em qualquer plataforma

### IA de Ofertas
1. Acesse `/dashboard/offers`
2. Defina os detalhes da sua oferta (produto, descrição, público-alvo)
3. Configure bônus e elementos de persuasão
4. Clique em "Gerar Oferta"
5. Acompanhe a geração progressiva do texto
6. Utilize o texto produzido em suas campanhas

### Consultor IA 24h
1. Vá para `/dashboard/consultant`
2. Selecione a área de especialidade de seu interesse
3. Faça perguntas sobre marketing, copywriting, estratégias digitais
4. Receba respostas personalizadas da IA

### Transcrição de Áudio
1. Acesse `/dashboard/transcription`
2. Faça upload do arquivo de áudio que deseja transcrever
3. Clique em "Transcrever Áudio"
4. Visualize o resultado da transcrição e utilize as opções para copiar ou limpar o texto

### IA de Copywriting Black
1. Acesse `/dashboard/copywriting`
2. Selecione o tipo de texto e o tom da mensagem desejados
3. Preencha o tópico/produto e os pontos-chave
4. Escolha a estrutura de persuasão e o tamanho do texto
5. Clique em "Gerar Copywriting"
6. Acompanhe o processo de geração em tempo real
7. Ao finalizar, utilize o botão de cópia para usar o texto

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a licença MIT. 