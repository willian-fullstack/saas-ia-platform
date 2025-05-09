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
    console.log(`Processando notificação de pagamento: ${notificationId}`);
    
    try {
      // Obter dados direto da API do Mercado Pago
      const paymentResponse = await new Payment(mercadopago).get({ id: notificationId });
      
      console.log('Dados do pagamento obtidos do Mercado Pago:', JSON.stringify(paymentResponse, null, 2));
      
      // Verificar os dados obtidos
      const payment = paymentResponse;
      
      // Encontrar a referência da assinatura nos metadados ou referência externa
      let subscriptionId: string | undefined;
      let userId: string | undefined;
      
      // Verificar primeiro em metadata.external_reference (preferência da v2)
      if (payment.metadata && payment.metadata.external_reference) {
        subscriptionId = payment.metadata.external_reference;
        console.log(`Encontrado ID da assinatura nos metadados: ${subscriptionId}`);
      }
      
      // Se não encontrou, verificar em external_reference
      if (!subscriptionId && payment.external_reference) {
        subscriptionId = payment.external_reference;
        console.log(`Encontrado ID da assinatura na external_reference: ${subscriptionId}`);
      }
      
      // Verificar o userId nos metadados
      if (payment.metadata && payment.metadata.userId) {
        userId = payment.metadata.userId;
        console.log(`Encontrado ID do usuário nos metadados: ${userId}`);
      }
      
      // Se não tem subscriptionId e nem userId, não podemos prosseguir
      if (!subscriptionId && !userId) {
        console.error('Não foi possível identificar a assinatura ou usuário nos dados do pagamento:', payment);
        return NextResponse.json({}, { status: 200 });
      }
      
      // Buscar assinatura pelo ID
      console.log(`Buscando assinatura pelo ID: ${subscriptionId || userId}`);
      let subscription = subscriptionId 
        ? await getSubscriptionByMPId(subscriptionId)
        : undefined;
      
      // Se não encontrou pelo subscriptionId, tenta pelo userId
      if (!subscription && userId) {
        console.log(`Assinatura não encontrada com ID ${subscriptionId}, tentando buscar pelo userId: ${userId}`);
        subscription = await getSubscriptionByMPId(userId);
      }
      
      if (!subscription) {
        console.error(`Assinatura não encontrada para: ${subscriptionId || userId}`);
        return NextResponse.json({}, { status: 200 });
      }
      
      console.log(`Assinatura encontrada: ${subscription._id.toString()}, status atual: ${subscription.status}`);
      
      // Verificar se o pagamento já foi processado (evitar duplicação)
      const paymentExists = subscription.paymentHistory.some(
        ph => ph.paymentId === notificationId
      );
      
      if (paymentExists) {
        console.log(`Pagamento ${notificationId} já processado anteriormente. Ignorando.`);
        return NextResponse.json({}, { status: 200 });
      }
      
      // Processar pagamento de acordo com o status
      if (payment.status === 'approved') {
        console.log(`Pagamento ${notificationId} aprovado! Atualizando assinatura e créditos...`);
        
        // Atualizar mercadoPagoId se ainda não definido
        const updateData: any = {
          mercadoPagoId: notificationId,
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
        };
        
        // Atualizar status da assinatura para ativo
        const updatedSubscription = await updateSubscriptionStatus(
          subscription._id.toString(),
          'active',
          updateData
        );
        
        console.log(`Assinatura atualizada para status 'active': ${updatedSubscription?._id.toString()}`);
        
        // Registrar pagamento no histórico
        await addPaymentRecord(subscription._id.toString(), {
          paymentId: notificationId,
          amount: payment.transaction_amount || 0,
          status: payment.status || 'approved',
          date: new Date(payment.date_created || new Date())
        });
        
        console.log(`Registro de pagamento adicionado ao histórico da assinatura`);
        
        // Buscar usuário e plano para atualizar créditos
        const user = await getUserById(subscription.userId.toString());
        const plan = await getPlanById(subscription.planId.toString());
        
        if (user && plan) {
          console.log(`Processando créditos para usuário: ${user._id.toString()}, plano: ${plan.name}, créditos a adicionar: ${plan.credits}`);
          
          // Atualizar referência da assinatura no usuário
          await updateUserSubscription(user._id.toString(), subscription._id.toString());
          console.log(`Referência da assinatura atualizada no perfil do usuário`);
          
          // Adicionar créditos ao usuário (usar updateUserCredits com replace=false para garantir adição)
          const updatedUser = await updateUserCredits(user._id.toString(), plan.credits, false);
          console.log(`Créditos adicionados ao usuário. Total atual: ${updatedUser?.credits}`);
          
          // Registrar adição de créditos
          await recordCreditAddition(
            user._id.toString(), 
            plan.credits, 
            `Créditos do plano ${plan.name} - Pagamento ${notificationId}`
          );
          
          console.log(`Adição de créditos registrada no histórico`);
          
          // Revalidar caminhos para atualizar dados na UI
          revalidatePath('/dashboard/subscription');
          revalidatePath('/dashboard/credits');
          revalidatePath('/dashboard');
          
          // Força atualização do cache em todos os caminhos relacionados
          try {
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/revalidate?path=/dashboard/subscription&secret=${process.env.REVALIDATION_SECRET}`, { method: 'POST' });
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/revalidate?path=/dashboard/credits&secret=${process.env.REVALIDATION_SECRET}`, { method: 'POST' });
            await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/revalidate?path=/dashboard&secret=${process.env.REVALIDATION_SECRET}`, { method: 'POST' });
            console.log('Cache revalidado com sucesso');
          } catch (revalidateError) {
            console.error('Erro ao revalidar cache:', revalidateError);
          }
        } else {
          console.error(`Usuário ou plano não encontrado. UserId: ${subscription.userId}, PlanId: ${subscription.planId}`);
        }
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        // Processar pagamento recusado ou cancelado
        console.log(`Pagamento ${notificationId} ${payment.status}. Atualizando status da assinatura...`);
        
        await updateSubscriptionStatus(
          subscription._id.toString(),
          'cancelled',
          { endDate: new Date() }
        );
        
        // Registrar pagamento no histórico mesmo sendo rejeitado
        await addPaymentRecord(subscription._id.toString(), {
          paymentId: notificationId,
          amount: payment.transaction_amount || 0,
          status: payment.status || 'rejected',
          date: new Date(payment.date_created || new Date())
        });
        
        console.log(`Assinatura marcada como cancelada devido a pagamento ${payment.status}`);
      } else {
        // Para outros status como 'pending', 'in_process', etc.
        console.log(`Pagamento ${notificationId} com status '${payment.status}'. Nenhuma ação tomada.`);
        
        // Registrar no histórico mesmo assim
        await addPaymentRecord(subscription._id.toString(), {
          paymentId: notificationId,
          amount: payment.transaction_amount || 0,
          status: payment.status || 'unknown',
          date: new Date(payment.date_created || new Date())
        });
      }
      
      console.log(`Processamento da notificação ${notificationId} concluído com sucesso.`);
    } catch (error) {
      console.error(`Erro ao processar pagamento ${notificationId}:`, error);
    }
    
    // Sempre retornar 200 para o Mercado Pago
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar notificação do Mercado Pago:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
  }
}