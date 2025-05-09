import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { createSubscription, updateSubscriptionStatus, getUserSubscription } from "@/lib/db/models/Subscription";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";
import { createSubscription as createMPSubscription } from "@/services/mercadopago";

// POST - Criar uma assinatura para o usuário autenticado
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
      }, { status: 401 });
    }
    
    // Obter dados do corpo da requisição
    const body = await req.json();
    const { planId } = body;
    
    if (!planId) {
      return NextResponse.json({
        success: false,
        message: "ID do plano não fornecido"
      }, { status: 400 });
    }
    
    // Verificar se plano existe
    const plan = await getPlanById(planId);
    
    if (!plan) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    // Obter o host da origem (localhost ou domínio de produção)
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Verificar se o usuário já tem uma assinatura e atualizar se necessário
    const existingSubscription = await getUserSubscription(userId);
    
    // Criar ou atualizar assinatura
    let subscriptionId;
    
    if (existingSubscription) {
      // Se já tem uma assinatura, atualizar para o novo plano
      await updateSubscriptionStatus(
        existingSubscription._id.toString(),
        'pending',
        {
          // Atualizar para o novo plano e status
          planId,
          startDate: existingSubscription.status === 'cancelled' ? new Date() : existingSubscription.startDate,
        }
      );
      subscriptionId = existingSubscription._id.toString();
    } else {
      // Criar nova assinatura no banco de dados
      const newSubscription = await createSubscription({
        userId,
        planId,
        status: 'pending',
        paymentHistory: [] // Adicionando paymentHistory vazio para satisfazer a interface
      });
      subscriptionId = newSubscription._id.toString();
    }
    
    // Verificar se é um plano gratuito (preço = 0)
    if (plan.price === 0) {
      // Para planos gratuitos, ativar imediatamente sem chamar Mercado Pago
      const startDate = new Date();
      const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias a partir de agora
      
      // Atualizar status da assinatura
      await updateSubscriptionStatus(subscriptionId, 'active', {
        startDate,
        renewalDate,
        mercadoPagoId: 'free-plan'
      });
      
      // Adicionar créditos ao usuário
      await updateUserCredits(userId, plan.credits, false);
      
      // Registrar adição de créditos
      await recordCreditAddition(
        userId, 
        plan.credits, 
        `Ativação do plano gratuito: ${plan.name}`
      );
      
      // Atualizar referência da assinatura no usuário
      await updateUserSubscription(userId, subscriptionId);
      
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
      
      // Retornar sucesso sem URL de pagamento
      return NextResponse.json({
        success: true,
        isFree: true,
        message: "Plano gratuito ativado com sucesso"
      });
    }
    
    // Criar pagamento no Mercado Pago (formato simplificado)
    const preferenceResult = await createMPSubscription({
      planName: plan.name,
      planPrice: plan.price,
      userId,
      external_reference: subscriptionId,
      userEmail: user.email
    });
    
    if (!preferenceResult || !preferenceResult.init_point) {
      return NextResponse.json({
        success: false,
        message: "Erro ao criar preferência de pagamento"
      }, { status: 500 });
    }
    
    // Retornar URL de checkout
    return NextResponse.json({
      success: true,
      paymentUrl: preferenceResult.init_point,
      preferenceId: preferenceResult.id
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao criar assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// GET - Obter a assinatura atual do usuário
export async function GET(req: NextRequest) {
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
    
    // Buscar assinatura do usuário com populate completo do plano
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        message: "Usuário não possui assinatura"
      });
    }
    
    return NextResponse.json({
      success: true,
      hasSubscription: true,
      subscription
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
}

// PATCH - Cancelar assinatura atual
export async function PATCH(req: NextRequest) {
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
    
    // Buscar assinatura do usuário
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return NextResponse.json({
        success: false,
        message: "Usuário não possui assinatura"
      }, { status: 404 });
    }
    
    if (subscription.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        message: "Assinatura já está cancelada"
      }, { status: 400 });
    }
    
    // Cancelar assinatura
    const updatedSubscription = await updateSubscriptionStatus(
      subscription._id.toString(), 
      'cancelled', 
      { endDate: new Date() }
    );
    
    return NextResponse.json({
      success: true,
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao cancelar assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 