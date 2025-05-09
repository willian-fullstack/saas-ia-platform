import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { updateSubscriptionStatus, getUserSubscription } from "@/lib/db/models/Subscription";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";
import { revalidatePath } from "next/cache";

/**
 * Endpoint para corrigir automaticamente assinaturas gratuitas que estão com status pendente
 * Verifica se o usuário tem uma assinatura pendente de um plano gratuito e a ativa
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.sub) {
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const userId = token.sub;
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Usuário não encontrado"
      }, { status: 404 });
    }
    
    // Buscar assinatura atual do usuário
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return NextResponse.json({
        success: false,
        message: "Nenhuma assinatura encontrada para o usuário"
      }, { status: 404 });
    }
    
    // Verificar se a assinatura está pendente
    if (subscription.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `A assinatura já está ${subscription.status === 'active' ? 'ativa' : 'cancelada'}`
      }, { status: 400 });
    }
    
    // Carregar detalhes do plano
    const plan = await getPlanById(subscription.planId.toString());
    
    if (!plan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    // Verificar se é um plano gratuito
    if (plan.price !== 0) {
      return NextResponse.json({
        success: false,
        message: "Este endpoint só pode ser usado para ativar planos gratuitos"
      }, { status: 400 });
    }
    
    // Ativar a assinatura
    const startDate = new Date();
    const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 dias
    
    await updateSubscriptionStatus(
      subscription._id.toString(), 
      'active',
      {
        startDate,
        renewalDate,
        mercadoPagoId: 'free-plan'
      }
    );
    
    // Adicionar créditos se necessário
    if (user.credits < plan.credits) {
      const creditsToAdd = plan.credits - user.credits;
      await updateUserCredits(userId, creditsToAdd, false);
      
      // Registrar adição de créditos
      await recordCreditAddition(
        userId,
        creditsToAdd,
        `Correção de plano gratuito: ${plan.name}`
      );
    }
    
    // Atualizar referência da assinatura no usuário se necessário
    if (!user.subscriptionId || user.subscriptionId.toString() !== subscription._id.toString()) {
      await updateUserSubscription(userId, subscription._id.toString());
    }
    
    // Revalidar caminhos para atualizar UI
    revalidatePath('/dashboard/subscription');
    revalidatePath('/dashboard/credits');
    revalidatePath('/dashboard');
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      message: "Plano gratuito corrigido e ativado com sucesso"
    });
  } catch (error) {
    console.error('Erro ao corrigir plano gratuito:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao corrigir plano gratuito: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 