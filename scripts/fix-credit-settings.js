/**
 * Script para corrigir configurações de créditos
 * 
 * Este script verifica as configurações de créditos no banco de dados e remove
 * configurações inválidas como "dashboard" que não deveria consumir créditos.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Definir o modelo de Configurações de Créditos
const CreditSettingsSchema = new mongoose.Schema({
  featureId: String,
  featureName: String,
  description: String,
  creditCost: Number,
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const CreditSettings = mongoose.models.CreditSettings || 
  mongoose.model('CreditSettings', CreditSettingsSchema);

// Lista de módulos válidos que podem consumir créditos
const validModules = [
  "copywriting",
  "creative",
  "videos",
  "landing",
  "offers",
  "consultant"
];

async function fixCreditSettings() {
  try {
    // 1. Buscar todas as configurações
    const allSettings = await CreditSettings.find({});
    console.log(`Encontradas ${allSettings.length} configurações de créditos`);
    
    // 2. Identificar configurações inválidas (dashboard ou que não estão na lista de módulos válidos)
    const invalidSettings = allSettings.filter(
      setting => setting.featureId === 'dashboard' || !validModules.includes(setting.featureId)
    );
    
    if (invalidSettings.length === 0) {
      console.log('Não foram encontradas configurações inválidas.');
      process.exit(0);
    }
    
    console.log(`Encontradas ${invalidSettings.length} configurações inválidas:`);
    invalidSettings.forEach(setting => {
      console.log(`- ${setting.featureName} (${setting.featureId})`);
    });
    
    // 3. Desativar configurações inválidas
    console.log('\nDesativando configurações inválidas...');
    for (const setting of invalidSettings) {
      // Opção 1: Desativar (manter no banco mas como inativo)
      // await CreditSettings.updateOne(
      //   { _id: setting._id },
      //   { $set: { active: false } }
      // );
      // console.log(`- Desativada: ${setting.featureName} (${setting.featureId})`);
      
      // Opção 2: Remover completamente
      await CreditSettings.deleteOne({ _id: setting._id });
      console.log(`- Removida: ${setting.featureName} (${setting.featureId})`);
    }
    
    console.log('\nCorrigindo valores de créditos para os módulos ativos...');
    // 4. Verificar módulos que deveriam estar configurados mas não estão
    for (const moduleId of validModules) {
      const exists = await CreditSettings.findOne({ featureId: moduleId });
      
      if (!exists) {
        // Valores padrão para cada módulo
        const moduleDefaults = {
          copywriting: { name: "IA de Copywriting", cost: 5 },
          creative: { name: "Criativos Visuais", cost: 5 },
          videos: { name: "Vídeos Curtos", cost: 10 },
          landing: { name: "Landing Pages", cost: 2 },
          offers: { name: "IA de Ofertas", cost: 10 },
          consultant: { name: "Consultor IA 24h", cost: 1 }
        };
        
        const defaults = moduleDefaults[moduleId];
        
        if (defaults) {
          await CreditSettings.create({
            featureId: moduleId,
            featureName: defaults.name,
            description: `Uso da funcionalidade ${defaults.name}`,
            creditCost: defaults.cost,
            active: true
          });
          
          console.log(`- Adicionada configuração para: ${defaults.name} (${moduleId})`);
        }
      }
    }
    
    console.log('\nOperação concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao corrigir configurações:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixCreditSettings(); 