import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { validateMercadoPagoNotification } from "@/services/mercadopago";
import { getSubscriptionByMPId, updateSubscriptionStatus, addPaymentRecord } from "@/lib/db/models/Subscription";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById, getActivePlans } from "@/lib/db/models/Plan";
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

// Função de diagnóstico para registrar informações adicionais
function logDebugInfo(message: string, data?: any) {
  console.log(`[MP Webhook] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Processar notificações de pagamento do Mercado Pago
export async function POST(req: NextRequest) {
  try {
    // Obter dados da requisição
    const body = await req.json();
    
    logDebugInfo('Notificação do Mercado Pago recebida (webhook):', body);
    
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
      logDebugInfo('ID da notificação não encontrado na requisição:', body);
      return NextResponse.json({}, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
    }
    
    logDebugInfo(`Processando notificação de pagamento: ${notificationId}`);
    
    try {
      // Obter dados direto da API do Mercado Pago
      const paymentResponse = await new Payment(mercadopago).get({ id: notificationId });
      
      logDebugInfo('Dados do pagamento obtidos do Mercado Pago:', paymentResponse);
      
      // Verificar os dados obtidos
      const payment = paymentResponse;
      
      // Encontrar a referência da assinatura nos metadados ou referência externa
      let subscriptionId: string | undefined;
      let userId: string | undefined;
      let planName: string | undefined;
      
      // Extrair metadados para diagnóstico
      logDebugInfo('Metadados do pagamento:', payment.metadata);
      logDebugInfo('External reference:', payment.external_reference);
      
      // Verificar primeiro em metadata.external_reference (preferência da v2)
      if (payment.metadata && payment.metadata.external_reference) {
        subscriptionId = payment.metadata.external_reference;
        logDebugInfo(`Encontrado ID da assinatura nos metadados: ${subscriptionId}`);
      }
      
      // Se não encontrou, verificar em external_reference
      if (!subscriptionId && payment.external_reference) {
        subscriptionId = payment.external_reference;
        logDebugInfo(`Encontrado ID da assinatura na external_reference: ${subscriptionId}`);
      }
      
      // Verificar o userId nos metadados
      if (payment.metadata && payment.metadata.userId) {
        userId = payment.metadata.userId;
        logDebugInfo(`Encontrado ID do usuário nos metadados: ${userId}`);
      }
      
      // Verificar o planName nos metadados
      if (payment.metadata && payment.metadata.planName) {
        planName = payment.metadata.planName;
        logDebugInfo(`Encontrado nome do plano nos metadados: ${planName}`);
      }
      
      // Se não tem subscriptionId e nem userId, não podemos prosseguir
      if (!subscriptionId && !userId) {
        logDebugInfo('Não foi possível identificar a assinatura ou usuário nos dados do pagamento:', payment);
        return NextResponse.json({}, { status: 200 });
      }
      
      // Buscar assinatura pelo ID
      logDebugInfo(`Buscando assinatura pelo ID: ${subscriptionId || userId}`);
      let subscription = subscriptionId 
        ? await getSubscriptionByMPId(subscriptionId)
        : undefined;
      
      // Se não encontrou pelo subscriptionId, tenta pelo userId
      if (!subscription && userId) {
        logDebugInfo(`Assinatura não encontrada com ID ${subscriptionId}, tentando buscar pelo userId: ${userId}`);
        subscription = await getSubscriptionByMPId(userId);
      }
      
      if (!subscription) {
        logDebugInfo(`Assinatura não encontrada para: ${subscriptionId || userId}`);
        return NextResponse.json({}, { status: 200 });
      }
      
      logDebugInfo(`Assinatura encontrada: ${subscription._id.toString()}, status atual: ${subscription.status}`);
      
      // Verificar se o pagamento já foi processado (evitar duplicação)
      const paymentExists = subscription.paymentHistory.some(
        ph => ph.paymentId === notificationId
      );
      
      if (paymentExists) {
        logDebugInfo(`Pagamento ${notificationId} já processado anteriormente. Ignorando.`);
        return NextResponse.json({}, { status: 200 });
      }
      
      // Processar pagamento de acordo com o status
      if (payment.status === 'approved') {
        logDebugInfo(`Pagamento ${notificationId} aprovado! Atualizando assinatura e créditos...`);
        
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
        
        logDebugInfo(`Assinatura atualizada para status 'active': ${updatedSubscription?._id.toString()}`);
        
        // Registrar pagamento no histórico
        await addPaymentRecord(subscription._id.toString(), {
          paymentId: notificationId,
          amount: payment.transaction_amount || 0,
          status: payment.status || 'approved',
          date: new Date(payment.date_created || new Date())
        });
        
        logDebugInfo(`Registro de pagamento adicionado ao histórico da assinatura`);
        
        // Buscar usuário para atualizar créditos
        const user = await getUserById(subscription.userId.toString());
        
        // Buscar plano primeiramente pelo ID da assinatura
        let plan = await getPlanById(subscription.planId.toString());
        
        // Se não encontrou o plano ou se o nome do plano nos metadados não corresponde ao plano encontrado,
        // tenta buscar pelo nome nos metadados
        if (!plan || (planName && plan.name !== planName)) {
          logDebugInfo(`Plano não encontrado ou não corresponde ao nome nos metadados. Buscando pelo nome: ${planName}`);
          
          // Buscar todos os planos ativos
          const allPlans = await getActivePlans();
          
          // Tentar encontrar pelo nome exato
          const matchingPlan = allPlans.find(p => p.name === planName);
          
          if (matchingPlan) {
            logDebugInfo(`Plano encontrado pelo nome: ${matchingPlan.name}, ID: ${matchingPlan._id}`);
            plan = matchingPlan;
            
            // Atualizar o planId da assinatura para o correto
            await updateSubscriptionStatus(
              subscription._id.toString(),
              'active',
              { planId: matchingPlan._id }
            );
            
            logDebugInfo(`ID do plano da assinatura atualizado para: ${matchingPlan._id}`);
          }
        }
        
        if (user && plan) {
          logDebugInfo(`Processando créditos para usuário: ${user._id.toString()}, plano: ${plan.name}, créditos a adicionar: ${plan.credits}`);
          
          // Atualizar referência da assinatura no usuário
          await updateUserSubscription(user._id.toString(), subscription._id.toString());
          logDebugInfo(`Referência da assinatura atualizada no perfil do usuário`);
          
          // Adicionar créditos ao usuário (usar updateUserCredits com replace=false para garantir adição)
          const updatedUser = await updateUserCredits(user._id.toString(), plan.credits, false);
          logDebugInfo(`Créditos adicionados ao usuário. Total atual: ${updatedUser?.credits}`);
          
          // Registrar adição de créditos
          await recordCreditAddition(
            user._id.toString(), 
            plan.credits, 
            `Créditos do plano ${plan.name} - Pagamento ${notificationId}`
          );
          
          logDebugInfo(`Adição de créditos registrada no histórico`);
          
          // Revalidar caminhos para atualizar dados na UI
          revalidatePath('/dashboard/subscription');
          revalidatePath('/dashboard/credits');
          revalidatePath('/dashboard');
          
          // Força atualização do cache em todos os caminhos relacionados
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const secret = process.env.REVALIDATION_SECRET || '';
            
            await fetch(`${baseUrl}/api/revalidate?path=/dashboard/subscription&secret=${secret}`, { method: 'POST' });
            await fetch(`${baseUrl}/api/revalidate?path=/dashboard/credits&secret=${secret}`, { method: 'POST' });
            await fetch(`${baseUrl}/api/revalidate?path=/dashboard&secret=${secret}`, { method: 'POST' });
            logDebugInfo('Cache revalidado com sucesso');
          } catch (revalidateError) {
            logDebugInfo('Erro ao revalidar cache:', revalidateError);
          }
        } else {
          logDebugInfo(`Usuário ou plano não encontrado. UserId: ${subscription.userId}, PlanId: ${subscription.planId}`);
        }
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        // Processar pagamento recusado ou cancelado
        logDebugInfo(`Pagamento ${notificationId} ${payment.status}. Atualizando status da assinatura...`);
        
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
        
        logDebugInfo(`Assinatura marcada como cancelada devido a pagamento ${payment.status}`);
      } else {
        // Para outros status como 'pending', 'in_process', etc.
        logDebugInfo(`Pagamento ${notificationId} com status '${payment.status}'. Nenhuma ação tomada.`);
        
        // Registrar no histórico mesmo assim
        await addPaymentRecord(subscription._id.toString(), {
          paymentId: notificationId,
          amount: payment.transaction_amount || 0,
          status: payment.status || 'unknown',
          date: new Date(payment.date_created || new Date())
        });
      }
      
      logDebugInfo(`Processamento da notificação ${notificationId} concluído com sucesso.`);
    } catch (error) {
      logDebugInfo(`Erro ao processar pagamento ${notificationId}:`, error);
    }
    
    // Sempre retornar 200 para o Mercado Pago
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logDebugInfo('Erro ao processar notificação do Mercado Pago:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
  }
}