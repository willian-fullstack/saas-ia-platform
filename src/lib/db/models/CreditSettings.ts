import mongoose, { Schema } from 'mongoose';
import { connectToDB } from '../connection';

// Interface para o modelo de Configurações de Créditos
export interface ICreditSettings {
  featureId: string; // ID único da funcionalidade
  featureName: string; // Nome da funcionalidade
  description?: string; // Descrição da funcionalidade
  creditCost: number; // Custo em créditos para usar a funcionalidade
  active: boolean; // Se a cobrança de créditos está ativa para esta funcionalidade
  createdAt: Date;
  updatedAt: Date;
}

// Schema para o modelo de Configurações de Créditos
const CreditSettingsSchema = new Schema<ICreditSettings>({
  featureId: { 
    type: String, 
    required: [true, 'ID da funcionalidade é obrigatório'],
    unique: true,
    trim: true,
  },
  featureName: { 
    type: String, 
    required: [true, 'Nome da funcionalidade é obrigatório'] 
  },
  description: {
    type: String,
    default: '',
  },
  creditCost: { 
    type: Number, 
    required: [true, 'Custo em créditos é obrigatório'],
    min: 0,
  },
  active: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

// Verifica se o modelo já existe para evitar redefinição
const CreditSettings = mongoose.models.CreditSettings || mongoose.model<ICreditSettings>('CreditSettings', CreditSettingsSchema);

export default CreditSettings;

// Função helper para obter todas as configurações de créditos ativas
export async function getActiveCreditSettings() {
  await connectToDB();
  return CreditSettings.find({ active: true }).exec();
}

// Função helper para obter configuração de crédito por ID da funcionalidade
export async function getCreditSettingByFeatureId(featureId: string) {
  await connectToDB();
  return CreditSettings.findOne({ featureId }).exec();
}

// Função helper para obter configuração de crédito pelo ID do MongoDB (_id)
export async function getCreditSettingById(id: string) {
  await connectToDB();
  return CreditSettings.findById(id).exec();
}

// Função helper para criar uma configuração de crédito
export async function createCreditSetting(settingData: Omit<ICreditSettings, 'createdAt' | 'updatedAt'>) {
  await connectToDB();
  return CreditSettings.create(settingData);
}

// Função helper para atualizar uma configuração de crédito
export async function updateCreditSetting(featureId: string, settingData: Partial<ICreditSettings>) {
  await connectToDB();
  return CreditSettings.findOneAndUpdate(
    { featureId }, 
    settingData, 
    { new: true }
  ).exec();
}

// Função helper para ativar/desativar uma configuração de crédito
export async function toggleCreditSetting(featureId: string, active: boolean) {
  await connectToDB();
  return CreditSettings.findOneAndUpdate(
    { featureId }, 
    { active }, 
    { new: true }
  ).exec();
} 