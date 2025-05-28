import { prisma } from "./prisma";
import { Performance } from "./performance";

/**
 * Verifica e consome créditos de um usuário
 * 
 * @param userId ID do usuário
 * @param amount Quantidade de créditos a consumir
 * @param operation Tipo de operação que está consumindo os créditos
 * @returns Boolean indicando se a operação foi bem-sucedida (usuário tem créditos suficientes)
 */
export async function consumeCredits(
  userId: string, 
  amount: number, 
  operation: string
): Promise<boolean> {
  const startTime = Performance.now();
  
  try {
    // Buscar o usuário com seus créditos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      throw new Error(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o usuário tem créditos suficientes
    if (user.credits < amount) {
      return false;
    }

    // Consumir os créditos
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } }
    });

    // Registrar o consumo de créditos
    await prisma.creditUsage.create({
      data: {
        userId,
        amount,
        operation,
        createdAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error(`Erro ao consumir créditos do usuário ${userId}:`, error);
    return false;
  } finally {
    // Registrar o tempo de processamento
    const processingTime = Performance.now() - startTime;
    Performance.record('consume_credits', processingTime, { userId, amount, operation });
  }
}

/**
 * Adiciona créditos a um usuário
 * 
 * @param userId ID do usuário
 * @param amount Quantidade de créditos a adicionar
 * @param source Fonte dos créditos (compra, bônus, etc.)
 * @returns Boolean indicando se a operação foi bem-sucedida
 */
export async function addCredits(
  userId: string, 
  amount: number, 
  source: string
): Promise<boolean> {
  const startTime = Performance.now();
  
  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`Usuário com ID ${userId} não encontrado`);
    }

    // Adicionar créditos
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } }
    });

    // Registrar a adição de créditos
    await prisma.creditAddition.create({
      data: {
        userId,
        amount,
        source,
        createdAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error(`Erro ao adicionar créditos ao usuário ${userId}:`, error);
    return false;
  } finally {
    // Registrar o tempo de processamento
    const processingTime = Performance.now() - startTime;
    Performance.record('add_credits', processingTime, { userId, amount, source });
  }
}

/**
 * Verifica o saldo de créditos de um usuário
 * 
 * @param userId ID do usuário
 * @returns Quantidade de créditos ou null se o usuário não for encontrado
 */
export async function getCredits(userId: string): Promise<number | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    return user ? user.credits : null;
  } catch (error) {
    console.error(`Erro ao obter créditos do usuário ${userId}:`, error);
    return null;
  }
} 