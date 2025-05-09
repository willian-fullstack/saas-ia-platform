import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { revalidatePath } from "next/cache";
import { mercadopago, validateMercadoPagoNotification } from "@/services/mercadopago";
import { getSubscriptionByMPId, updateSubscriptionStatus, addPaymentRecord } from "@/lib/db/models/Subscription";
import { getUserById, updateUserCredits, updateUserSubscription } from "@/lib/db/models/User";
import { getPlanById } from "@/lib/db/models/Plan";
import { recordCreditAddition } from "@/lib/db/models/CreditHistory";

// Processa notificações de pagamento do Mercado Pago
export async function POST(req: NextRequest) {
  try {
    // Obter dados da requisição
    const body = await req.json();
    
    console.log('Notificação do Mercado Pago recebida (endpoint principal):', JSON.stringify(body, null, 2));
    
    // Verificar o formato da notificação
    if (!body.data || !body.data.id) {
      console.error('ID do pagamento não encontrado na requisição:', body);
      return NextResponse.json({}, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
    }
    
    // Buscar detalhes do pagamento
    const paymentId = body.data.id;
    console.log(`Processando pagamento: ${paymentId}`);
    
    try {
      // Obter dados do pagamento diretamente
      const payment = await new Payment(mercadopago).get({ id: paymentId });
      
      if (payment.status === "approved") {
        console.log(`Pagamento ${paymentId} aprovado!`);
        
        // Buscar identificadores do metadata
        const userId = payment.metadata?.userId || payment.external_reference;
        const subscriptionId = payment.metadata?.external_reference || userId;
        
        if (!subscriptionId) {
          console.error('ID da assinatura não encontrado no pagamento:', payment);
          return NextResponse.json({}, { status: 200 });
        }
        
        // Buscar a assinatura pelo ID
        const subscription = await getSubscriptionByMPId(subscriptionId);
        
        if (subscription) {
          console.log(`Assinatura encontrada: ${subscription._id.toString()}`);
          
          // Atualizar status da assinatura
          await updateSubscriptionStatus(
            subscription._id.toString(),
            'active',
            { 
              mercadoPagoId: paymentId,
              startDate: new Date(),
              renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
            }
          );
          
          // Registrar pagamento
          await addPaymentRecord(subscription._id.toString(), {
            paymentId: paymentId,
            amount: payment.transaction_amount || 0,
            status: payment.status || 'approved',
            date: new Date(payment.date_created || new Date())
          });
          
          // Buscar usuário e plano
          const user = await getUserById(subscription.userId.toString());
          const plan = await getPlanById(subscription.planId.toString());
          
          if (user && plan) {
            // Atualizar referência da assinatura no usuário
            await updateUserSubscription(user._id.toString(), subscription._id.toString());
            
            // Adicionar créditos ao usuário
            await updateUserCredits(user._id.toString(), plan.credits, false);
            
            // Registrar adição de créditos
            await recordCreditAddition(
              user._id.toString(),
              plan.credits,
              `Créditos do plano ${plan.name}`
            );
          }
          
          // Revalidar caminhos relevantes
          revalidatePath('/dashboard/subscription');
          revalidatePath('/dashboard/credits');
          revalidatePath('/dashboard');
        } else {
          console.error(`Assinatura não encontrada para o pagamento: ${paymentId}`);
        }
      } else {
        console.log(`Pagamento ${paymentId} com status: ${payment.status}`);
      }
    } catch (error) {
      console.error(`Erro ao processar pagamento ${paymentId}:`, error);
    }
    
    // Sempre responder com sucesso para o Mercado Pago
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar notificação do Mercado Pago:', error);
    return NextResponse.json({}, { status: 200 }); // Sempre retornar 200 para o Mercado Pago
  }
} 