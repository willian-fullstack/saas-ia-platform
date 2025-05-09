import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById, getActivePlans } from "@/lib/db/models/Plan";
import { 
  getUserSubscription, 
  updateSubscriptionStatus,
  getSubscriptionByMPId 
} from "@/lib/db/models/Subscription";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";
import { revalidatePath } from "next/cache";

// Interface para os dados enviados no corpo da requisição
interface FixRequestBody {
  userId?: string;
  subscriptionId?: string;
  planName?: string;
  forceActivate?: boolean;
}

/**
 * Endpoint para administradores corrigirem assinaturas pendentes
 * POST - Corrige assinaturas pendentes, mesmo quando houve pagamento mas o webhook falhou
 * Pode ser usado para ativar qualquer assinatura pendente, manual ou automaticamente
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
    
    // Verificar se o usuário é administrador
    const adminId = token.sub;
    const adminUser = await getUserById(adminId);
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: "Permissão negada. Apenas administradores podem realizar esta operação."
      }, { status: 403 });
    }
    
    // Obter dados do corpo da requisição
    const body: FixRequestBody = await req.json();
    const { userId, subscriptionId, planName, forceActivate = false } = body;
    
    // Validar dados da requisição
    if (!userId && !subscriptionId) {
      return NextResponse.json({
        success: false,
        message: "É necessário fornecer o ID do usuário ou o ID da assinatura"
      }, { status: 400 });
    }
    
    // Buscar assinatura pelo ID ou pelo ID do usuário
    let subscription;
    
    if (subscriptionId) {
      subscription = await getSubscriptionByMPId(subscriptionId);
      
      if (!subscription) {
        return NextResponse.json({
          success: false,
          message: `Assinatura com ID ${subscriptionId} não encontrada`
        }, { status: 404 });
      }
    } else if (userId) {
      subscription = await getUserSubscription(userId);
      
      if (!subscription) {
        return NextResponse.json({
          success: false,
          message: `Nenhuma assinatura encontrada para o usuário ${userId}`
        }, { status: 404 });
      }
    }
    
    // Verificar se a assinatura precisa ser corrigida
    if (!forceActivate && subscription.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `A assinatura já está ${subscription.status === 'active' ? 'ativa' : 'cancelada'}`
      }, { status: 400 });
    }
    
    // Buscar informações do usuário
    const user = await getUserById(subscription.userId.toString());
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Usuário da assinatura não encontrado"
      }, { status: 404 });
    }
    
    // Buscar plano associado à assinatura
    let plan = await getPlanById(subscription.planId.toString());
    
    // Se foi passado um nome de plano específico, tentar buscar pelo nome
    if (planName) {
      const allPlans = await getActivePlans();
      const matchingPlan = allPlans.find(p => p.name === planName);
      
      if (matchingPlan) {
        console.log(`Plano especificado encontrado: ${matchingPlan.name}, ID: ${matchingPlan._id}`);
        plan = matchingPlan;
        
        // Atualizar o planId da assinatura
        await updateSubscriptionStatus(
          subscription._id.toString(),
          'pending', // Mantém o status pendente por enquanto
          { planId: matchingPlan._id }
        );
      }
    }
    
    if (!plan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
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
        mercadoPagoId: subscription.mercadoPagoId || `manual-fix-${Date.now()}`
      }
    );
    
    // Adicionar créditos ao usuário
    await updateUserCredits(user._id.toString(), plan.credits, false);
    
    // Registrar adição de créditos
    await recordCreditAddition(
      user._id.toString(),
      plan.credits,
      `Correção manual: Plano ${plan.name} ativado por administrador`
    );
    
    // Atualizar referência da assinatura no usuário
    await updateUserSubscription(user._id.toString(), subscription._id.toString());
    
    // Revalidar caminhos para atualizar UI
    revalidatePath('/dashboard/subscription');
    revalidatePath('/dashboard/credits');
    revalidatePath('/dashboard');
    
    // Forçar revalidação da página para atualizar a interface imediatamente
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const secret = process.env.REVALIDATION_SECRET || '';
      
      await fetch(`${baseUrl}/api/revalidate?path=/dashboard/subscription&secret=${secret}`, { method: 'POST' });
      await fetch(`${baseUrl}/api/revalidate?path=/dashboard/credits&secret=${secret}`, { method: 'POST' });
      await fetch(`${baseUrl}/api/revalidate?path=/dashboard&secret=${secret}`, { method: 'POST' });
    } catch (error) {
      console.error('Erro ao revalidar cache:', error);
    }
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      message: `Assinatura do plano ${plan.name} ativada com sucesso para o usuário ${user.email || user._id}`
    });
  } catch (error) {
    console.error('Erro ao corrigir assinatura:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao corrigir assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 