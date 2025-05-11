# Guia de Deploy na Vercel

Este documento fornece instruções detalhadas para implementação do projeto na plataforma Vercel.

## Pré-requisitos

1. Uma conta na Vercel (https://vercel.com)
2. Seu código fonte em um repositório Git (GitHub, GitLab ou Bitbucket)
3. Acesso às variáveis de ambiente necessárias para o projeto

## Passos para Deploy

### 1. Preparação do Projeto

O projeto já está configurado com:
- `vercel.json` com configurações otimizadas
- Script de verificação de ambiente (`check-env.js`)
- Middleware de autenticação configurado

### 2. Importe o Projeto na Vercel

1. Faça login na sua conta Vercel
2. Clique em "Add New..." e depois "Project"
3. Selecione o repositório Git onde o código está hospedado
4. Selecione a branch que deseja implantar (geralmente `main` ou `master`)

### 3. Configure as Variáveis de Ambiente

Na tela de configuração do projeto, adicione as seguintes variáveis de ambiente:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `MONGODB_URI` | URI de conexão com o MongoDB | `mongodb+srv://usuario:senha@cluster.mongodb.net/database` |
| `NEXTAUTH_SECRET` | Chave secreta para autenticação NextAuth | String aleatória (min. 32 caracteres) |
| `NEXTAUTH_URL` | URL completo da aplicação | `https://seu-app.vercel.app` |
| `NEXT_PUBLIC_BASE_URL` | URL público da aplicação (igual ao NEXTAUTH_URL) | `https://seu-app.vercel.app` |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso da API do Mercado Pago | Obter no painel do Mercado Pago |
| `REVALIDATION_SECRET` | Chave para revalidação on-demand do Next.js | String aleatória |

### 4. Configurações Avançadas (Opcional)

#### 4.1. Configurações de Build

O arquivo `vercel.json` já define:
- Comando de build: `npm run check-env && npm run build`
- Comando de instalação: `npm install`
- Framework: Next.js
- Região: GRU1 (São Paulo)

#### 4.2. Domínio Personalizado

Para configurar um domínio personalizado:
1. Vá para a seção "Domains" nas configurações do projeto
2. Adicione seu domínio personalizado
3. Siga as instruções para verificação de DNS

### 5. Deploy

1. Clique em "Deploy" para iniciar o processo de build e deploy
2. A Vercel irá executar automaticamente:
   - `npm install` para instalar dependências
   - `npm run check-env` para verificar variáveis de ambiente
   - `npm run build` para construir a aplicação

### 6. Verificações Pós-Deploy

Após o deploy, verifique:

1. **Autenticação**: Teste o fluxo completo de login
2. **Assinaturas**: Teste a criação de uma assinatura
3. **Logs na Vercel**: Verifique os logs do Function Monitoring para detectar problemas
4. **Webhooks**: Verifique se o webhook do Mercado Pago está configurado para apontar para a URL de produção

### 7. Solução de Problemas Comuns

#### 7.1. Erro de autenticação

- Verifique se `NEXTAUTH_SECRET` e `NEXTAUTH_URL` estão configurados corretamente
- Certifique-se de que os cookies estão sendo enviados corretamente

#### 7.2. Problemas com Mercado Pago

- Verifique se o webhook está configurado para a URL de produção
- Certifique-se de que o `MERCADOPAGO_ACCESS_TOKEN` está correto

#### 7.3. Erros 401 ou 500

- Verifique os logs da função específica no painel da Vercel
- Adicione logs adicionais para identificar onde está ocorrendo o problema

## Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Next.js na Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Guia de Variáveis de Ambiente na Vercel](https://vercel.com/docs/concepts/projects/environment-variables) 