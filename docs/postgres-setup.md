# Configuração do PostgreSQL para o Sistema de Landing Pages

Este documento contém instruções para configurar o PostgreSQL para o módulo de landing pages da plataforma SAS.

## Pré-requisitos

- PostgreSQL 12 ou superior instalado
- Acesso administrativo ao PostgreSQL

## Instalação do PostgreSQL

### Windows

1. Baixe o instalador do PostgreSQL em [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Execute o instalador e siga as instruções
3. Anote a senha do usuário `postgres` durante a instalação
4. Mantenha a porta padrão (5432)

### macOS

```bash
# Usando Homebrew
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Criação do Banco de Dados

1. Acesse o PostgreSQL:

```bash
# Windows (via psql)
"C:\Program Files\PostgreSQL\[versão]\bin\psql.exe" -U postgres

# macOS/Linux
sudo -u postgres psql
```

2. Crie um novo usuário e banco de dados:

```sql
CREATE USER sas_user WITH PASSWORD 'sua_senha_segura';
CREATE DATABASE sas_platform;
GRANT ALL PRIVILEGES ON DATABASE sas_platform TO sas_user;
```

3. Saia do psql:

```sql
\q
```

## Configuração da Variável de Ambiente

Adicione a seguinte variável ao seu arquivo `.env.local`:

```
DATABASE_URL="postgresql://sas_user:sua_senha_segura@localhost:5432/sas_platform?schema=public"
```

## Executando Migrações do Prisma

Após configurar o banco de dados e a variável de ambiente, execute os seguintes comandos:

```bash
# Gerar o cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate
```

## Verificação da Instalação

Para verificar se tudo está funcionando corretamente, você pode iniciar o Prisma Studio:

```bash
npm run prisma:studio
```

Isso abrirá uma interface web em `http://localhost:5555` onde você poderá visualizar e gerenciar os dados do banco de dados.

## Solução de Problemas

### Erro de Conexão

Se você encontrar erros de conexão:

1. Verifique se o PostgreSQL está em execução
2. Confirme que a URL do banco de dados está correta
3. Verifique as configurações de firewall
4. Certifique-se de que o usuário tem as permissões necessárias

### Erro nas Migrações

Se as migrações falharem:

1. Verifique os logs de erro
2. Certifique-se de que não há conflitos com esquemas existentes
3. Tente resetar o banco de dados (apenas em ambiente de desenvolvimento):

```bash
npx prisma migrate reset
```

## Backup e Restauração

### Backup

```bash
pg_dump -U sas_user -d sas_platform -f backup.sql
```

### Restauração

```bash
psql -U sas_user -d sas_platform -f backup.sql
``` 