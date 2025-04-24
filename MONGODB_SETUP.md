# Configuração do MongoDB e Sistema de Autenticação

Este guia descreve como configurar o MongoDB e o sistema de autenticação para o projeto SAS IA Platform.

## Requisitos

1. MongoDB (local ou MongoDB Atlas)
2. Node.js e NPM (já instalados)
3. Arquivo `.env.local` configurado corretamente

## Configuração do MongoDB

### Opção 1: MongoDB Local

1. Baixe e instale o [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Inicie o serviço MongoDB:
   - Windows: O serviço geralmente inicia automaticamente
   - Linux: `sudo systemctl start mongod`
   - macOS: `brew services start mongodb-community`
3. Verifique se o MongoDB está rodando na porta padrão: 27017

### Opção 2: MongoDB Atlas (Recomendado para Produção)

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Crie um novo cluster (o nível gratuito é suficiente para testes)
3. Configure um usuário de banco de dados (Database Access)
4. Configure o acesso à rede (Network Access) - Adicione seu IP ou 0.0.0.0/0 para desenvolvimento
5. Obtenha a string de conexão em "Connect" > "Connect your application"

## Configuração do Ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```
# Configuração do MongoDB
MONGODB_URI=mongodb://localhost:27017/sas-ia-platform
# Para MongoDB Atlas use:
# MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@cluster0.xxxxx.mongodb.net/sas-ia-platform

# NextAuth
NEXTAUTH_SECRET=SUBSTITUA_POR_UMA_STRING_ALEATORIA_SEGURA
NEXTAUTH_URL=http://localhost:3000

# Chaves de API existentes
OPENAI_API_KEY=sua_chave_api_openai
DEEPSEEK_API_KEY=sua_chave_api_deepseek
```

Para gerar um valor seguro para NEXTAUTH_SECRET, você pode usar o comando:
```bash
openssl rand -base64 32
```

## Iniciando o Projeto

Depois de configurar o MongoDB e o arquivo `.env.local`:

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse http://localhost:3000

## Primeiro Acesso

Como estamos usando um banco de dados vazio, você precisará criar o primeiro usuário:

1. Acesse http://localhost:3000/login
2. Clique na aba "Cadastro"
3. Preencha os dados para criar o primeiro usuário
4. Use o usuário criado para fazer login

## Troubleshooting

Se encontrar problemas de conexão com o MongoDB:

1. Verifique se o serviço do MongoDB está rodando
2. Verifique se a string de conexão no `.env.local` está correta
3. Para MongoDB Atlas, confirme se o IP tem permissão de acesso
4. Verifique os logs do console para mensagens de erro específicas 