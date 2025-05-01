#!/usr/bin/env node
// @ts-check

/**
 * Script para definir um usuário como administrador
 * 
 * Uso: node scripts/setup-admin.js --email=seu@email.com
 */

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Inicializar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env.local');

// Tentar carregar do .env.local primeiro, depois do .env
if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  config();
}

// Analisar os argumentos da linha de comando
const args = process.argv.slice(2);
let email = null;

// Verificar se o email fornecido é raystevie187@gmail.com (email específico do usuário)
if (args.length === 0) {
  email = 'raystevie187@gmail.com';
  console.log(`Email padrão configurado: ${email}`);
} else {
  args.forEach(arg => {
    const match = arg.match(/--email=(.+)/);
    if (match) {
      email = match[1];
    }
  });

  // Verificar se o email foi fornecido
  if (!email) {
    const argsEmail = args[0]; // Aceitar também o email como primeiro argumento sem flag
    if (argsEmail && argsEmail.includes('@')) {
      email = argsEmail;
    } else {
      console.error('Erro: Email não fornecido. Use --email=seu@email.com');
      process.exit(1);
    }
  }
}

// Função para extrair o nome do banco de dados da URI do MongoDB
function extractDatabaseName(uri) {
  try {
    // Formato padrão: mongodb://[username:password@]host[:port]/database[?options]
    // ou mongodb+srv://[username:password@]host/database[?options]
    const urlParts = uri.split('/');
    
    if (urlParts.length >= 4) {
      // Na maioria dos casos, o nome do DB está na quarta parte após dividir por '/'
      const dbNameWithParams = urlParts[3];
      if (dbNameWithParams && dbNameWithParams.length > 0) {
        // Remover parâmetros de consulta, se houver
        return dbNameWithParams.split('?')[0];
      }
    } else if (urlParts.length === 3) {
      // Algumas URIs têm formato mais curto
      const lastPart = urlParts[2];
      if (lastPart && lastPart.includes('?')) {
        // Formato: host/database?options
        return lastPart.split('?')[0];
      }
    }
    
    // Fallback - usar um nome padrão
    console.warn('Aviso: Não foi possível extrair o nome do banco de dados da URI. Usando "sas-ia-platform".');
    return 'sas-ia-platform';
  } catch (error) {
    console.warn('Aviso: Erro ao analisar a URI do MongoDB. Usando "sas-ia-platform".');
    return 'sas-ia-platform';
  }
}

// Função principal
async function setupAdmin() {
  // Verificar se a URI do MongoDB está configurada
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Erro: MONGODB_URI não está definido nas variáveis de ambiente');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    // Conectar ao MongoDB
    await client.connect();
    console.log('Conectado ao MongoDB');

    // Obter a referência do banco de dados e da coleção
    const dbName = extractDatabaseName(uri);
    console.log(`Usando banco de dados: ${dbName}`);
    
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Verificar se o usuário existe
    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.error(`Erro: Usuário com email ${email} não encontrado`);
      console.log('O usuário precisa ter feito login pelo menos uma vez antes de ser definido como administrador');
      process.exit(1);
    }

    // Verificar se o usuário já é administrador
    if (user.role === 'admin') {
      console.log(`O usuário ${email} já é administrador`);
      process.exit(0);
    }

    // Atualizar o papel do usuário para admin
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: { role: 'admin' } }
    );

    if (result.modifiedCount === 1) {
      console.log(`Sucesso: Usuário ${email} definido como administrador`);
    } else {
      console.error(`Erro: Não foi possível atualizar o usuário ${email}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Conexão fechada');
  }
}

// Executar o script
setupAdmin().catch(console.error); 