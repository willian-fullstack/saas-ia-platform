import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { getUserSubscription, updateSubscriptionStatus } from "@/lib/db/models/Subscription";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";

// POST - Atualizar status do pagamento após retorno do checkout
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
    const status = body.status; // 'success', 'failure', 'pending'
    
    if (!status) {
      return NextResponse.json({
        success: false,
        message: "Status não fornecido"
      }, { status: 400 });
    }
    
    // Buscar assinatura do usuário
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return NextResponse.json({
        success: false,
        message: "Assinatura não encontrada"
      }, { status: 404 });
    }
    
    // Atualizar status da assinatura com base no retorno do checkout
    if (status === 'success') {
      // Buscar informações do plano
      const plan = await getPlanById(subscription.planId.toString());
      
      if (!plan) {
        return NextResponse.json({
          success: false,
          message: "Plano não encontrado"
        }, { status: 404 });
      }
      
      // Atualizar status da assinatura para 'active'
      const updatedSubscription = await updateSubscriptionStatus(
        subscription._id.toString(),
        'active',
        {
          startDate: new Date(),
          renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        }
      );
      
      // Atualizar referência da assinatura no usuário
      await updateUserSubscription(userId, subscription._id.toString());
      
      // Adicionar créditos ao usuário
      await updateUserCredits(userId, plan.credits);
      
      // Registrar adição de créditos
      await recordCreditAddition(userId, plan.credits, `Créditos iniciais do plano ${plan.name}`);
      
      return NextResponse.json({
        success: true,
        message: "Pagamento confirmado e assinatura ativada com sucesso",
        subscription: updatedSubscription
      });
    } else if (status === 'failure') {
      // Atualizar status da assinatura para 'cancelled'
      const updatedSubscription = await updateSubscriptionStatus(
        subscription._id.toString(),
        'cancelled',
        { endDate: new Date() }
      );
      
      return NextResponse.json({
        success: true,
        message: "Assinatura cancelada devido a falha no pagamento",
        subscription: updatedSubscription
      });
    } else if (status === 'pending') {
      // Manter status 'pending', apenas retornar confirmação
      return NextResponse.json({
        success: true,
        message: "Pagamento em processamento",
        subscription
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Status de pagamento inválido"
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro ao processar retorno do pagamento:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao processar retorno do pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 