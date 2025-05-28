import { consumeUserCredits, getUserById } from "./db/models/User";
import { recordCreditUsage } from "./db/models/CreditHistory";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { MemoryCache } from "./performance";

// Custos em créditos para diferentes operações
export const DEEPSITE_CREDIT_COSTS = {
  GENERATE_LANDING_PAGE: 20,
  IMPROVE_LANDING_PAGE: 10,
  APPLY_DIFFS: 2,
  EXPORT_CODE: 5,
  PREVIEW: 0,
  SAVE_TEMPLATE: 15
};

// Tipo para as operações suportadas
export type DeepSiteOperation = keyof typeof DEEPSITE_CREDIT_COSTS;

// Cache para evitar consultas frequentes ao banco de dados
const userCreditsCache = new MemoryCache<number>();
const CACHE_TTL = 60 * 1000; // 1 minuto

/**
 * Consome créditos para operações do DeepSite
 * 
 * @param userId - ID do usuário ou operação (para compatibilidade)
 * @param detailsOrOperation - Detalhes da operação ou não utilizado
 * @returns O número de créditos consumidos
 */
export async function consumeDeepSiteCredits(
  userId: string | DeepSiteOperation,
  detailsOrOperation?: string | DeepSiteOperation
): Promise<number> {
  try {
    let actualUserId: string;
    let operation: DeepSiteOperation;
    let details: string;

    // Detectar qual formato de parâmetros está sendo usado
    if (Object.keys(DEEPSITE_CREDIT_COSTS).includes(userId as string)) {
      // Formato antigo: consumeDeepSiteCredits(operation, details)
      operation = userId as DeepSiteOperation;
      details = detailsOrOperation as string || operation;
      
      // Obter a sessão do usuário atual
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        throw new Error("Usuário não autenticado");
      }
      
      actualUserId = session.user.id;
    } else {
      // Novo formato: consumeDeepSiteCredits(userId, operation)
      actualUserId = userId as string;
      operation = (detailsOrOperation || 'GENERATE_LANDING_PAGE') as DeepSiteOperation;
      details = `${operation}`;
    }
    
    const credits = DEEPSITE_CREDIT_COSTS[operation];
    
    // Se não há custo, não é necessário consumir créditos
    if (credits <= 0) {
      return 0;
    }
    
    // Consumir os créditos
    await consumeUserCredits(actualUserId, credits);
    
    // Registrar no histórico
    await recordCreditUsage(
      actualUserId,
      credits,
      "deepsite",
      `${operation}: ${details}`
    );
    
    // Invalidar cache após consumo
    userCreditsCache.delete(actualUserId);
    
    return credits;
  } catch (error: any) {
    console.error(`Erro ao consumir créditos:`, error.message);
    throw new Error(`Erro ao processar créditos: ${error.message}`);
  }
}

/**
 * Verifica se o usuário tem créditos suficientes para uma operação
 * 
 * @param userIdOrOperation - ID do usuário ou operação (para compatibilidade)
 * @param operation - Tipo de operação (opcional)
 * @returns Boolean indicando se o usuário tem créditos suficientes
 */
export async function hasEnoughCredits(
  userIdOrOperation: string | DeepSiteOperation,
  operation?: DeepSiteOperation
): Promise<boolean> {
  try {
    let userId: string;
    let requiredCredits: number;

    // Detectar qual formato de parâmetros está sendo usado
    if (Object.keys(DEEPSITE_CREDIT_COSTS).includes(userIdOrOperation as string)) {
      // Formato antigo: hasEnoughCredits(operation)
      const op = userIdOrOperation as DeepSiteOperation;
      
      // Obter a sessão do usuário atual
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return false;
      }
      
      userId = session.user.id;
      requiredCredits = DEEPSITE_CREDIT_COSTS[op];
    } else {
      // Novo formato: hasEnoughCredits(userId, operation)
      userId = userIdOrOperation as string;
      const op = (operation || 'GENERATE_LANDING_PAGE') as DeepSiteOperation;
      requiredCredits = DEEPSITE_CREDIT_COSTS[op];
    }
    
    // Se a operação não consome créditos, sempre retorna true
    if (requiredCredits <= 0) {
      return true;
    }
    
    // Verificar cache primeiro
    const userCredits = userCreditsCache.get(userId);
    
    if (userCredits === undefined) {
      // Se não está em cache, buscar do banco de dados
      const user = await getUserById(userId);
      
      if (!user) {
        return false;
      }
      
      const credits = user.credits;
      
      // Armazenar em cache para futuras verificações
      userCreditsCache.set(userId, credits, CACHE_TTL);
      
      return credits >= requiredCredits;
    }
    
    return userCredits >= requiredCredits;
  } catch (error) {
    console.error("Erro ao verificar créditos:", error);
    return false;
  }
}

/**
 * Obtém o custo em créditos de uma operação
 * 
 * @param operation - Tipo de operação
 * @returns Número de créditos necessários
 */
export function getCreditCost(operation: DeepSiteOperation): number {
  return DEEPSITE_CREDIT_COSTS[operation] || 0;
}

/**
 * Obtém os créditos atuais do usuário
 * 
 * @param userId - ID do usuário (opcional)
 * @returns Número de créditos disponíveis ou null se não autenticado
 */
export async function getUserCredits(userId?: string): Promise<number | null> {
  try {
    let actualUserId: string;
    
    if (userId) {
      actualUserId = userId;
    } else {
      // Obter da sessão
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return null;
      }
      
      actualUserId = session.user.id;
    }
    
    // Verificar cache primeiro
    const userCredits = userCreditsCache.get(actualUserId);
    
    if (userCredits !== undefined) {
      return userCredits;
    }
    
    // Se não está em cache, buscar do banco de dados
    const user = await getUserById(actualUserId);
    
    if (!user) {
      return null;
    }
    
    const credits = user.credits;
    
    // Armazenar em cache para futuras verificações
    userCreditsCache.set(actualUserId, credits, CACHE_TTL);
    
    return credits;
  } catch (error) {
    console.error("Erro ao obter créditos do usuário:", error);
    return null;
  }
} 