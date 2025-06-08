// Script para adicionar a configuração de créditos para a funcionalidade de geração de imagens
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configurar dotenv
dotenv.config();

// Conectar ao MongoDB
async function connectToDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI não definido no arquivo .env');
    }
    
    await mongoose.connect(uri);
    console.log('Conectado ao MongoDB');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

// Definir o esquema para CreditSettings
const CreditSettingsSchema = new mongoose.Schema({
  featureId: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
  },
  featureName: { 
    type: String, 
    required: true
  },
  description: {
    type: String,
    default: '',
  },
  creditCost: { 
    type: Number, 
    required: true,
    min: 0,
  },
  active: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
});

// Adicionar a configuração de créditos para geração de imagens
async function addImageGenerationCreditSetting() {
  try {
    await connectToDB();
    
    // Registrar o modelo
    const CreditSettings = mongoose.models.CreditSettings || 
      mongoose.model('CreditSettings', CreditSettingsSchema);
    
    // Verificar se já existe configuração para esta funcionalidade
    const existingSetting = await CreditSettings.findOne({ featureId: 'creative-image-generation' });
    
    if (existingSetting) {
      console.log('Configuração já existe. Atualizando...');
      
      existingSetting.featureName = 'Geração de Imagens';
      existingSetting.description = 'Geração de imagens usando a API do ChatGPT';
      existingSetting.creditCost = 15; // Definir o custo em créditos
      existingSetting.active = true;
      
      await existingSetting.save();
      console.log('Configuração atualizada com sucesso!');
    } else {
      console.log('Criando nova configuração...');
      
      // Criar nova configuração
      await CreditSettings.create({
        featureId: 'creative-image-generation',
        featureName: 'Geração de Imagens',
        description: 'Geração de imagens usando a API do ChatGPT',
        creditCost: 15, // Definir o custo em créditos
        active: true
      });
      
      console.log('Configuração criada com sucesso!');
    }
    
    // Listar todas as configurações
    const allSettings = await CreditSettings.find({});
    console.log('\nConfiguração de créditos disponíveis:');
    allSettings.forEach(setting => {
      console.log(`- ${setting.featureName} (${setting.featureId}): ${setting.creditCost} créditos, ${setting.active ? 'ativo' : 'inativo'}`);
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    // Desconectar do MongoDB
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

// Executar o script
addImageGenerationCreditSetting();
