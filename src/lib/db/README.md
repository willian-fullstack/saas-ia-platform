# Configuração do Banco de Dados MongoDB

Esta aplicação usa MongoDB como banco de dados para armazenar informações de usuários e outros dados persistentes.

## Configuração Local

Para desenvolvimento, você pode usar o MongoDB Community Edition instalado localmente:

1. [Instale o MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Inicie o serviço MongoDB
3. Configure a variável de ambiente `MONGODB_URI` no arquivo `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/sas-ia-platform
```

## Configuração na Nuvem (MongoDB Atlas)

Para produção, recomendamos usar o MongoDB Atlas:

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um novo cluster
3. Configure um usuário de banco de dados com permissões de leitura/escrita
4. Configure o IP de acesso (permitir qualquer IP: 0.0.0.0/0 para desenvolvimento)
5. Obtenha a string de conexão e adicione ao arquivo `.env.local`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sas-ia-platform
```

## Modelos de Dados

A aplicação usa os seguintes modelos:

### Usuario (User)

Armazena informações de usuários para autenticação e perfil.

- `name`: Nome completo do usuário
- `email`: Email do usuário (único)
- `password`: Senha criptografada
- `image`: URL da imagem de perfil (opcional)
- `createdAt`: Data de criação
- `updatedAt`: Data da última atualização

## Observações Importantes

1. **Nunca** armazene credenciais reais de banco de dados no controle de versão
2. Use variáveis de ambiente diferentes para diferentes ambientes (dev, test, prod)
3. Em produção, certifique-se de limitar o acesso ao MongoDB apenas aos IPs necessários 