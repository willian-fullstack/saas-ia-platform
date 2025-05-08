import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { validateMercadoPagoNotification } from "@/services/mercadopago";
import { getSubscriptionByMPId, updateSubscriptionStatus, addPaymentRecord } from "@/lib/db/models/Subscription";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";
import { revalidatePath } from "next/cache";
import { mercadopago } from "@/services/mercadopago";

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
  metadata?: {
    userId?: string;
    planName?: string;
    external_reference?: string;
    [key: string]: any;
  };
}

// Processar notificações de pagamento do Mercado Pago
export async function POST(req: NextRequest) {
  try {
    // Obter dados da requisição
    const body = await req.json();
    
    console.log('Notificação do Mercado Pago recebida (webhook):', JSON.stringify(body, null, 2));
    
    // Verificar o formato da notificação (compatível com diversos formatos do Mercado Pago)
    let notificationId: string | undefined;
    
    if (body.data && body.data.id) {
      // Formato padrão da API v2: { action: 'payment.created', data: { id: '123456789' } }
      notificationId = body.data.id;
    } else if (body.id) {
      // Formato alternativo para APIs antigas: { id: '123456789', ... }
      notificationId = body.id;
    }
    
    if (!notificationId) {
      console.error('ID da notificação não encontrado na requisição:', body);
      return NextResponse.json({}, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
    }
    
    // Log para rastreamento
    console.log(`Processando notificação: ${notificationId}`);
    
    try {
      // Obter dados direto da API do Mercado Pago (como no checkout-pro)
      const payment = await new Payment(mercadopago).get({ id: notificationId });
      
      console.log('Dados do pagamento obtidos:', JSON.stringify(payment, null, 2));
      
      // Em vez de external_reference, agora usamos metadata
      const userId = payment.metadata?.userId || payment.external_reference;
      const subscriptionId = payment.metadata?.external_reference || userId;
      
      if (!subscriptionId) {
        console.error('ID da assinatura não encontrado no pagamento:', payment);
        return NextResponse.json({}, { status: 200 });
      }
      
      console.log(`Buscando assinatura com ID: ${subscriptionId}`);
      
      // Buscar assinatura pelo ID
      let subscription = await getSubscriptionByMPId(subscriptionId);
      
      if (!subscription) {
        console.log(`Assinatura não encontrada com ID ${subscriptionId}, tentando buscar pelo userId: ${userId}`);
        if (userId) {
          subscription = await getSubscriptionByMPId(userId);
        }
      }
      
      if (!subscription) {
        console.error(`Assinatura não encontrada para: ${subscriptionId}`);
        return NextResponse.json({}, { status: 200 });
      }
      
      console.log(`Assinatura encontrada: ${subscription._id.toString()}, status: ${subscription.status}`);
      
      // Processar pagamento aprovado
      if (payment.status === 'approved') {
        console.log(`Pagamento ${notificationId} aprovado!`);
        
        // Atualizar mercadoPagoId se ainda não definido
        if (!subscription.mercadoPagoId || subscription.mercadoPagoId === 'pending') {
          await updateSubscriptionStatus(
            subscription._id.toString(),
            'active',
            { 
              mercadoPagoId: notificationId,
              startDate: new Date(),
              renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
            }
          );
        } else {
          await updateSubscriptionStatus(
            subscription._id.toString(),
            'active',
            { 
              startDate: new Date(),
              renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
            }
          );
        }
        
        // Registrar pagamento
        await addPaymentRecord(subscription._id.toString(), {
          paymentId: notificationId,
          amount: payment.transaction_amount || 0,
          status: payment.status || 'approved',
          date: new Date(payment.date_created || new Date())
        });
        
        // Buscar usuário e plano
        const user = await getUserById(subscription.userId.toString());
        const plan = await getPlanById(subscription.planId.toString());
        
        if (user && plan) {
          console.log(`Processando créditos para usuário: ${user._id.toString()}, plano: ${plan.name}`);
          
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
          
          // Revalidar caminhos para atualizar dados na UI
          revalidatePath('/dashboard/subscription');
          revalidatePath('/dashboard/credits');
          revalidatePath('/dashboard');
        }
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        // Processar pagamento recusado
        await updateSubscriptionStatus(
          subscription._id.toString(),
          'cancelled',
          { endDate: new Date() }
        );
      }
      
      console.log(`Processamento da notificação ${notificationId} concluído com sucesso.`);
    } catch (error) {
      console.error(`Erro ao processar pagamento ${notificationId}:`, error);
    }
    
    // Sempre retornar 200 para o Mercado Pago
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar notificação do Mercado Pago:', error);
    return NextResponse.json({}, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
  }
} 