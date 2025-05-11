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
    console.log("Iniciando processo de assinatura de plano");
    
    // Verificar autenticação com mais logs
    console.log("Verificando autenticação do usuário");
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production"
    });
    
    console.log("Token de autenticação:", token ? "Token obtido" : "Token não encontrado");
    
    if (!token || !token.sub) {
      console.log("Erro de autenticação: Token inválido ou sub ausente");
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const userId = token.sub;
    console.log("ID do usuário autenticado:", userId);
    
    // Buscar usuário no banco de dados
    console.log("Buscando usuário no banco de dados");
    const user = await getUserById(userId);
    
    if (!user) {
      console.log("Usuário não encontrado no banco de dados:", userId);
      return NextResponse.json({
        success: false,
        message: "Usuário não encontrado"
      }, { status: 401 });
    }
    
    console.log("Usuário encontrado:", user.email);
    
    // Obter dados do corpo da requisição
    console.log("Obtendo dados da requisição");
    const body = await req.json();
    const { planId } = body;
    
    console.log("ID do plano solicitado:", planId);
    
    if (!planId) {
      console.log("Erro: ID do plano não fornecido");
      return NextResponse.json({
        success: false,
        message: "ID do plano não fornecido"
      }, { status: 400 });
    }
    
    // Verificar se plano existe
    console.log("Verificando existência do plano");
    const plan = await getPlanById(planId);
    
    if (!plan) {
      console.log("Plano não encontrado:", planId);
      return NextResponse.json({
        success: false,
        message: "Plano não encontrado"
      }, { status: 404 });
    }
    
    console.log("Plano encontrado:", plan.name);
    
    // Obter o host da origem (localhost ou domínio de produção)
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log("Origem da requisição:", origin);
    
    // Verificar se o usuário já tem uma assinatura e atualizar se necessário
    console.log("Verificando assinatura existente do usuário");
    const existingSubscription = await getUserSubscription(userId);
    
    // Criar ou atualizar assinatura
    let subscriptionId;
    
    if (existingSubscription) {
      console.log("Assinatura existente encontrada, atualizando para novo plano");
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
      console.log("Criando nova assinatura para o usuário");
      // Criar nova assinatura no banco de dados
      const newSubscription = await createSubscription({
        userId,
        planId,
        status: 'pending',
        paymentHistory: [] // Adicionando paymentHistory vazio para satisfazer a interface
      });
      subscriptionId = newSubscription._id.toString();
    }
    
    console.log("ID da assinatura:", subscriptionId);
    
    // Verificar se é um plano gratuito (preço = 0)
    if (plan.price === 0) {
      console.log("Plano gratuito detectado, ativando imediatamente");
      // Para planos gratuitos, ativar imediatamente sem chamar Mercado Pago
      const startDate = new Date();
      const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias a partir de agora
      
      // Atualizar status da assinatura
      await updateSubscriptionStatus(subscriptionId, 'active', {
        startDate,
        renewalDate,
        mercadoPagoId: 'free-plan'
      });
      
      console.log("Assinatura gratuita ativada, adicionando créditos");
      
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
        console.log("Revalidando cache para atualizar interface");
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const secret = process.env.REVALIDATION_SECRET || '';
        
        await fetch(`${baseUrl}/api/revalidate?path=/dashboard/subscription&secret=${secret}`, { method: 'POST' });
        await fetch(`${baseUrl}/api/revalidate?path=/dashboard/credits&secret=${secret}`, { method: 'POST' });
        await fetch(`${baseUrl}/api/revalidate?path=/dashboard&secret=${secret}`, { method: 'POST' });
      } catch (error) {
        console.error('Erro ao revalidar cache:', error);
      }
      
      // Retornar sucesso sem URL de pagamento
      console.log("Plano gratuito ativado com sucesso");
      return NextResponse.json({
        success: true,
        isFree: true,
        message: "Plano gratuito ativado com sucesso"
      });
    }
    
    // Criar pagamento no Mercado Pago
    console.log("Criando preferência de pagamento no Mercado Pago");
    const preferenceResult = await createMPSubscription({
      planName: plan.name,
      planPrice: plan.price,
      userId,
      external_reference: subscriptionId,
      userEmail: user.email
    });
    
    if (!preferenceResult || !preferenceResult.init_point) {
      console.error("Erro ao criar preferência de pagamento no Mercado Pago");
      return NextResponse.json({
        success: false,
        message: "Erro ao criar preferência de pagamento"
      }, { status: 500 });
    }
    
    console.log("Preferência de pagamento criada com sucesso, ID:", preferenceResult.id);
    
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
    console.log("Obtendo informações de assinatura do usuário");
    
    // Verificar autenticação
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production"
    });
    
    console.log("Token de autenticação:", token ? "Token válido" : "Token ausente");
    
    if (!token || !token.sub) {
      console.log("Erro de autenticação: Token inválido ou ausente");
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const userId = token.sub;
    console.log("ID do usuário autenticado:", userId);
    
    // Buscar assinatura do usuário com populate completo do plano
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      console.log("Usuário não possui assinatura ativa");
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        message: "Usuário não possui assinatura"
      });
    }
    
    console.log("Assinatura encontrada para o usuário:", subscription._id.toString());
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
    console.log("Iniciando processo de cancelamento de assinatura");
    
    // Verificar autenticação
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production"  
    });
    
    console.log("Token de autenticação:", token ? "Token válido" : "Token ausente");
    
    if (!token || !token.sub) {
      console.log("Erro de autenticação: Token inválido ou ausente");
      return NextResponse.json({
        success: false,
        message: "Usuário não autenticado"
      }, { status: 401 });
    }
    
    const userId = token.sub;
    console.log("ID do usuário autenticado:", userId);
    
    // Buscar assinatura do usuário
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      console.log("Usuário não possui assinatura para cancelar");
      return NextResponse.json({
        success: false,
        message: "Usuário não possui assinatura"
      }, { status: 404 });
    }
    
    if (subscription.status === 'cancelled') {
      console.log("Assinatura já está cancelada");
      return NextResponse.json({
        success: false,
        message: "Assinatura já está cancelada"
      }, { status: 400 });
    }
    
    // Cancelar assinatura
    console.log("Cancelando assinatura:", subscription._id.toString());
    const updatedSubscription = await updateSubscriptionStatus(
      subscription._id.toString(), 
      'cancelled', 
      { endDate: new Date() }
    );
    
    console.log("Assinatura cancelada com sucesso");
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