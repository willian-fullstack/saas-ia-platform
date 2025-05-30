import mongoose, { Schema } from 'mongoose';
import { connectToDB } from '../connection';

// Interface para o modelo de Histórico de Créditos
export interface ICreditHistory {
  userId: Schema.Types.ObjectId;
  amount: number; // positivo para adição, negativo para consumo
  operation: 'add' | 'use';
  feature?: string; // qual funcionalidade consumiu os créditos
  description?: string; // descrição adicional da operação
  createdAt: Date;
}

// Interface para estatísticas de uso de créditos
export interface CreditUsageStats {
  featureId: string;
  featureName: string;
  totalUsage: number;
  percentageOfTotal: number;
}

// Interface para as configurações de créditos
interface ICreditSettings {
  featureId: string;
  featureName: string;
  [key: string]: any;
}

// Schema para o modelo de Histórico de Créditos
const CreditHistorySchema = new Schema<ICreditHistory>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'ID do usuário é obrigatório'] 
  },
  amount: { 
    type: Number, 
    required: [true, 'Quantidade de créditos é obrigatória'] 
  },
  operation: { 
    type: String, 
    enum: ['add', 'use'], 
    required: [true, 'Tipo de operação é obrigatório'] 
  },
  feature: { 
    type: String 
  },
  description: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Verifica se o modelo já existe para evitar redefinição
const CreditHistory = mongoose.models.CreditHistory || mongoose.model<ICreditHistory>('CreditHistory', CreditHistorySchema);

export default CreditHistory;

// Função helper para registrar uso de créditos
export async function recordCreditUsage(userId: string, amount: number, feature: string, description?: string) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao registrar uso de créditos: ${userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  return CreditHistory.create({
    userId: userIdObj,
    amount: -Math.abs(amount), // Garante que seja negativo para consumo
    operation: 'use',
    feature,
    description
  });
}

// Função helper para registrar adição de créditos
export async function recordCreditAddition(userId: string, amount: number, description?: string) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao registrar adição de créditos: ${userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  return CreditHistory.create({
    userId: userIdObj,
    amount: Math.abs(amount), // Garante que seja positivo para adição
    operation: 'add',
    description
  });
}

// Função helper para obter o histórico de créditos de um usuário
export async function getUserCreditHistory(userId: string, limit = 20, skip = 0) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao buscar histórico de créditos: ${userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  return CreditHistory.find({ userId: userIdObj })
    .sort({ createdAt: -1 }) // Mais recentes primeiro
    .skip(skip)
    .limit(limit)
    .exec();
}

// Função helper para obter o saldo total de créditos de um usuário
export async function getTotalUserCredits(userId: string) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao calcular total de créditos: ${userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  const result = await CreditHistory.aggregate([
    { $match: { userId: userIdObj } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]).exec();
  
  return result.length > 0 ? result[0].total : 0;
}

// Função helper para obter estatísticas de uso de créditos por funcionalidade
export async function getCreditUsageStats() {
  await connectToDB();
  
  // Buscar dados de consumo agrupados por funcionalidade
  const usageData = await CreditHistory.aggregate([
    // Filtrar apenas operações de uso (valores negativos)
    { $match: { operation: 'use', feature: { $exists: true, $ne: null } } },
    // Agrupar por funcionalidade e calcular o total de créditos consumidos
    { $group: { 
        _id: '$feature', 
        totalUsage: { $sum: { $abs: '$amount' } } // Usamos abs para ter valores positivos
      } 
    },
    // Ordenar do maior para o menor consumo
    { $sort: { totalUsage: -1 } }
  ]).exec();
  
  // Calcular o total geral de consumo de créditos
  const totalResult = await CreditHistory.aggregate([
    { $match: { operation: 'use' } },
    { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
  ]).exec();
  
  const totalUsage = totalResult.length > 0 ? totalResult[0].total : 0;
  
  // Importar dados das configurações para obter os nomes das funcionalidades
  const CreditSettings = mongoose.models.CreditSettings;
  let settings: any[] = [];
  
  if (CreditSettings) {
    settings = await CreditSettings.find({}).lean().exec();
  }
  
  // Mapear os dados com nomes e calcular percentagens
  const usageStats = usageData.map(item => {
    const setting = settings.find(s => s.featureId === item._id);
    const featureName = setting ? setting.featureName : item._id;
    
    return {
      featureId: item._id,
      featureName,
      totalUsage: item.totalUsage,
      percentageOfTotal: totalUsage > 0 ? (item.totalUsage / totalUsage) * 100 : 0
    };
  });
  
  return { usageStats, totalUsage };
} 