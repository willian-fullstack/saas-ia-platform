import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { createSubscription, updateSubscriptionStatus, getUserSubscription } from "@/lib/db/models/Subscription";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";
import { createSubscription as createMPSubscription } from "@/services/mercadopago";
import mongoose from "mongoose";

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
    
    // Obter dados da requisição
    const body = await req.json();
    const planId = body.planId;
    
    if (!planId) {
      return NextResponse.json({
        success: false,
        message: "ID do plano não informado"
      }, { status: 400 });
    }
    
    // Verificar se o plano existe
    const plan = await getPlanById(planId);
    
    if (!plan || !plan.active) {
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado ou inativo"
      }, { status: 404 });
    }
    
    // Verificar se o usuário já tem uma assinatura ativa
    const existingSubscription = await getUserSubscription(userId);
    
    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json({
        success: false,
        message: "Usuário já possui uma assinatura ativa"
      }, { status: 400 });
    }
    
    // Criar assinatura no Mercado Pago (ou processar plano gratuito)
    const mpSubscription = await createMPSubscription({
      planName: plan.name,
      planPrice: plan.price,
      userEmail: user.email,
      description: `Assinatura do plano ${plan.name} - SaaS IA Platform`,
      userId: userId
    });
    
    // Criar assinatura no banco de dados
    const subscription = await createSubscription({
      userId: new mongoose.Types.ObjectId(userId),
      planId: new mongoose.Types.ObjectId(planId),
      status: mpSubscription.free ? 'active' : 'pending',
      mercadoPagoId: mpSubscription.id,
      startDate: mpSubscription.free ? new Date() : undefined,
      paymentHistory: []
    });
    
    // Se for plano gratuito, ativar imediatamente
    if (mpSubscription.free) {
      // Atualizar referência da assinatura no usuário
      await updateUserSubscription(userId, subscription._id.toString());
      
      // Adicionar créditos ao usuário
      await updateUserCredits(userId, plan.credits);
      
      // Registrar adição de créditos
      await recordCreditAddition(userId, plan.credits, `Créditos iniciais do plano ${plan.name}`);
    }
    
    return NextResponse.json({
      success: true,
      subscription,
      paymentUrl: mpSubscription.init_point,
      isFree: mpSubscription.free
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
    
    // Buscar assinatura do usuário
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