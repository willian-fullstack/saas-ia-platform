import { connectToDB } from './db/connection';
import mongoose from 'mongoose';
import { getCreditSettingByFeatureId } from './db/models/CreditSettings';

// Interface para o resultado do consumo de créditos
interface ConsumeCreditsResult {
  success: boolean;
  message?: string;
  remainingCredits?: number;
  consumed?: number;
}

/**
 * Consome créditos de um usuário para uma funcionalidade específica
 * @param userId ID do usuário
 * @param featureId ID da funcionalidade
 * @param description Descrição da operação
 * @param overrideCost Custo opcional para sobrescrever o valor padrão
 */
export async function consumeCredits(
  userId: string,
  featureId: string,
  description: string,
  overrideCost?: number
): Promise<ConsumeCreditsResult> {
  try {
    await connectToDB();
    
    // Obter modelo de usuário dinamicamente
    const User = mongoose.models.User || mongoose.model('User');
    const CreditHistory = mongoose.models.CreditHistory || mongoose.model('CreditHistory');
    
    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado'
      };
    }
    
    // Buscar custo da funcionalidade
    let creditCost = overrideCost ?? 0; // Inicializar com 0 ou o valor fornecido
    
    // Se não foi fornecido um custo personalizado, buscar da configuração
    if (overrideCost === undefined) {
      const creditSetting = await getCreditSettingByFeatureId(featureId);
      if (!creditSetting) {
        return {
          success: false,
          message: 'Configuração de créditos não encontrada para esta funcionalidade'
        };
      }
      
      // Verificar se a cobrança está ativa
      if (!creditSetting.active) {
        // Se a cobrança estiver desativada, permitir o uso sem consumir créditos
        return {
          success: true,
          remainingCredits: user.credits,
          consumed: 0
        };
      }
      
      creditCost = creditSetting.creditCost;
    }
    
    // Verificar se o usuário tem créditos suficientes
    if (user.credits < creditCost) {
      return {
        success: false,
        message: `Créditos insuficientes. Necessário: ${creditCost}, Disponível: ${user.credits}`
      };
    }
    
    // Consumir créditos
    user.credits -= creditCost;
    await user.save();
    
    // Registrar no histórico
    await CreditHistory.create({
      userId,
      featureId,
      description,
      amount: -creditCost,
      operation: 'use',
      feature: featureId
    });
    
    return {
      success: true,
      remainingCredits: user.credits,
      consumed: creditCost
    };
  } catch (error) {
    console.error('Erro ao consumir créditos:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao consumir créditos'
    };
  }
}

/**
 * Verifica se um usuário tem créditos suficientes para uma funcionalidade
 * @param userId ID do usuário
 * @param featureId ID da funcionalidade
 */
export async function hasEnoughCredits(
  userId: string,
  featureId: string
): Promise<{ hasEnough: boolean; required?: number; available?: number; error?: string }> {
  try {
    await connectToDB();
    
    // Obter modelo de usuário dinamicamente
    const User = mongoose.models.User || mongoose.model('User');
    
    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return {
        hasEnough: false,
        error: 'Usuário não encontrado'
      };
    }
    
    // Buscar custo da funcionalidade
    const creditSetting = await getCreditSettingByFeatureId(featureId);
    if (!creditSetting) {
      return {
        hasEnough: false,
        error: 'Configuração de créditos não encontrada'
      };
    }
    
    // Se a cobrança estiver desativada, permitir o uso
    if (!creditSetting.active) {
      return {
        hasEnough: true,
        required: 0,
        available: user.credits
      };
    }
    
    const required = creditSetting.creditCost;
    const available = user.credits;
    
    return {
      hasEnough: available >= required,
      required,
      available
    };
  } catch (error) {
    console.error('Erro ao verificar créditos:', error);
    return {
      hasEnough: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar créditos'
    };
  }
} 