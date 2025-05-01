import { NextRequest, NextResponse } from "next/server";
import { validateMercadoPagoNotification } from "@/services/mercadopago";
import { getSubscriptionByMPId, updateSubscriptionStatus, addPaymentRecord } from "@/lib/db/models/Subscription";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";

// Interface para atualização de assinatura
interface SubscriptionUpdateData {
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  [key: string]: Date | undefined;
}

// Interface para dados de pagamento do Mercado Pago
interface MercadoPagoPaymentData {
  id: string;
  status: string;
  external_reference: string;
  date_created: string;
  transaction_amount?: number;
}

// Processar notificações de pagamento do Mercado Pago
export async function POST(req: NextRequest) {
  try {
    // Obter dados da requisição
    const { action, data } = await req.json();
    
    console.log('Notificação do Mercado Pago recebida:', { action, data });
    
    // Verificar se é uma notificação de pagamento
    if (action !== 'payment.created' && action !== 'payment.updated') {
      return NextResponse.json({
        success: false,
        message: "Tipo de notificação não suportado"
      }, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
    }
    
    const notificationId = data?.id as string;
    
    if (!notificationId) {
      return NextResponse.json({
        success: false,
        message: "ID da notificação não encontrado"
      }, { status: 200 });
    }
    
    // Validar notificação com Mercado Pago
    const rawData = await validateMercadoPagoNotification(notificationId);
    const mpData: MercadoPagoPaymentData = {
      id: rawData.id as string,
      status: rawData.status as string,
      external_reference: rawData.external_reference as string,
      date_created: rawData.date_created as string,
      transaction_amount: rawData.transaction_amount as number || 0
    };
    
    // Buscar assinatura no banco de dados
    const subscription = await getSubscriptionByMPId(mpData.external_reference);
    
    if (!subscription) {
      return NextResponse.json({
        success: false,
        message: "Assinatura não encontrada"
      }, { status: 200 });
    }
    
    // Se a assinatura já estiver ativa, não processar novamente
    if (subscription.status === 'active' && mpData.status === 'approved') {
      return NextResponse.json({
        success: true,
        message: "Assinatura já está ativa"
      });
    }
    
    // Processar status da assinatura
    let statusToUpdate = subscription.status;
    const updateData: SubscriptionUpdateData = {};
    
    if (mpData.status === 'approved') {
      statusToUpdate = 'active';
      updateData.startDate = new Date();
      
      // Para renovações, definir também a data de renovação
      if (subscription.status === 'active') {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        updateData.renewalDate = nextMonth;
      }
    } else if (mpData.status === 'cancelled' || mpData.status === 'rejected') {
      statusToUpdate = 'cancelled';
      updateData.endDate = new Date();
    } else if (mpData.status === 'pending' || mpData.status === 'in_process') {
      statusToUpdate = 'pending';
    }
    
    // Atualizar status da assinatura
    await updateSubscriptionStatus(
      subscription._id.toString(),
      statusToUpdate as 'active' | 'cancelled' | 'pending',
      updateData
    );
    
    // Registrar pagamento
    if (mpData.status === 'approved') {
      await addPaymentRecord(subscription._id.toString(), {
        paymentId: mpData.id,
        amount: mpData.transaction_amount || 0,
        status: mpData.status,
        date: new Date(mpData.date_created)
      });
      
      // Se a assinatura está se tornando ativa, processar créditos
      if (subscription.status !== 'active' && statusToUpdate === 'active') {
        const user = await getUserById(subscription.userId.toString());
        const plan = await getPlanById(subscription.planId.toString());
        
        if (user && plan) {
          // Atualizar referência da assinatura no usuário
          await updateUserSubscription(user._id.toString(), subscription._id.toString());
          
          // Adicionar créditos ao usuário
          await updateUserCredits(user._id.toString(), plan.credits);
          
          // Registrar adição de créditos
          await recordCreditAddition(
            user._id.toString(), 
            plan.credits, 
            `Créditos do plano ${plan.name}`
          );
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      status: statusToUpdate
    });
  } catch (error) {
    console.error('Erro ao processar notificação do Mercado Pago:', error);
    return NextResponse.json({
      success: false,
      message: `Erro ao processar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
  }
} 