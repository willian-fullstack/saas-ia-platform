import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { updateSubscriptionStatus, getUserSubscription } from "@/lib/db/models/Subscription";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";
import { revalidatePath } from "next/cache";

/**
 * Endpoint para corrigir manualmente a assinatura de um usuário
 * Útil quando o webhook do Mercado Pago não processou corretamente o pagamento
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
    
    // Verificar se o usuário tem uma assinatura existente
    const existingSubscription = await getUserSubscription(userId);
    
    if (!existingSubscription) {
      return NextResponse.json({
        success: false,
        message: "Usuário não possui assinatura para corrigir"
      }, { status: 404 });
    }
    
    // Atualizar a assinatura existente
    const updatedSubscription = await updateSubscriptionStatus(
      existingSubscription._id.toString(),
      'active',
      {
        planId,
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
      }
    );
    
    if (!updatedSubscription) {
      return NextResponse.json({
        success: false,
        message: "Falha ao atualizar a assinatura"
      }, { status: 500 });
    }
    
    // Atualizar referência da assinatura no usuário
    await updateUserSubscription(userId, existingSubscription._id.toString());
    
    // Adicionar créditos ao usuário
    const updatedUser = await updateUserCredits(userId, plan.credits, false);
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: "Falha ao atualizar créditos do usuário"
      }, { status: 500 });
    }
    
    // Registrar adição de créditos
    await recordCreditAddition(
      userId,
      plan.credits,
      `Créditos do plano ${plan.name} (correção manual)`
    );
    
    // Revalidar caminhos relevantes
    revalidatePath('/dashboard/subscription');
    revalidatePath('/dashboard/credits');
    revalidatePath('/dashboard');
    
    // Forçar revalidação de cache
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/revalidate?path=/dashboard/subscription&secret=${process.env.REVALIDATION_SECRET}`, { method: 'POST' });
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/revalidate?path=/dashboard/credits&secret=${process.env.REVALIDATION_SECRET}`, { method: 'POST' });
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/revalidate?path=/dashboard&secret=${process.env.REVALIDATION_SECRET}`, { method: 'POST' });
    } catch (error) {
      console.error('Erro ao revalidar cache:', error);
    }
    
    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      user: {
        id: updatedUser._id,
        credits: updatedUser.credits
      }
    });
  } catch (error) {
    console.error('Erro ao corrigir assinatura:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao corrigir assinatura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 