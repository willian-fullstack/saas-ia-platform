#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Caminho para o arquivo .env.local
const envPath = path.join(process.cwd(), '.env.local');

// Função para gerar um segredo seguro
function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Verificar e atualizar o arquivo .env
async function checkAndUpdateEnv() {
  console.log('Verificando configuração de ambiente...');
  
  try {
    // Verificar se o arquivo .env.local existe
    if (!fs.existsSync(envPath)) {
      console.log('.env.local não encontrado. Criando a partir do .env.example...');
      
      // Verificar se existe .env.example
      const examplePath = path.join(process.cwd(), '.env.example');
      if (fs.existsSync(examplePath)) {
        fs.copyFileSync(examplePath, envPath);
      } else {
        // Criar arquivo .env.local vazio
        fs.writeFileSync(envPath, '');
      }
    }
    
    // Ler o conteúdo atual do arquivo
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar se NEXTAUTH_SECRET está presente
    if (!envContent.includes('NEXTAUTH_SECRET=')) {
      console.log('NEXTAUTH_SECRET não encontrado. Gerando novo segredo...');
      
      const newSecret = generateSecret();
      envContent += `\nNEXTAUTH_SECRET=${newSecret}\n`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('Novo NEXTAUTH_SECRET gerado e salvo no arquivo .env.local');
    } else {
      // Verificar se o valor atual não está vazio
      const match = envContent.match(/NEXTAUTH_SECRET=(.+)/);
      if (match && (!match[1] || match[1].trim() === '')) {
        console.log('NEXTAUTH_SECRET está vazio. Gerando novo valor...');
        
        const newSecret = generateSecret();
        envContent = envContent.replace(/NEXTAUTH_SECRET=(.*)/, `NEXTAUTH_SECRET=${newSecret}`);
        
        fs.writeFileSync(envPath, envContent);
        console.log('Novo NEXTAUTH_SECRET gerado e salvo no arquivo .env.local');
      } else {
        console.log('NEXTAUTH_SECRET está configurado corretamente.');
      }
    }
    
    // Verificar URL do Next Auth
    if (!envContent.includes('NEXTAUTH_URL=')) {
      console.log('NEXTAUTH_URL não encontrado. Adicionando valor padrão...');
      
      envContent += '\nNEXTAUTH_URL=http://localhost:3000\n';
      fs.writeFileSync(envPath, envContent);
      console.log('NEXTAUTH_URL adicionado ao arquivo .env.local');
    }
    
    console.log('Verificação de ambiente concluída com sucesso.');
    console.log('Para aplicar as alterações, reinicie o servidor Next.js.');
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar/atualizar arquivo .env:', error);
    return false;
  }
}

// Executar verificação
checkAndUpdateEnv().then(success => {
  if (success) {
    console.log('✅ Configurações verificadas e atualizadas com sucesso!');
  } else {
    console.error('❌ Falha ao verificar configurações.');
    process.exit(1);
  }
}); 