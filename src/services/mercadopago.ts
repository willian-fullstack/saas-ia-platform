// Importamos o SDK do Mercado Pago usando a nova API
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Inicializar o Mercado Pago diretamente na importação (como no checkout-pro)
const accessToken = 
  process.env.MP_ACCESS_TOKEN || 
  process.env.MERCADO_PAGO_ACCESS_TOKEN || 
  process.env.MERCADOPAGO_ACCESS_TOKEN;

// Criar instância do cliente MercadoPago
export const mercadopago = new MercadoPagoConfig({
  accessToken: accessToken || '',
});

// Console log para diagnóstico
console.log('Mercado Pago inicializado com accessToken:', accessToken ? 'Token configurado' : 'Token NÃO configurado');

// Interface para dados de assinatura
interface SubscriptionData {
  planName: string;
  planPrice: number;
  userId: string;
  external_reference?: string; // ID da assinatura no banco de dados
  userEmail?: string;
  description?: string;
  callbackUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
}

/**
 * Cria uma nova assinatura no Mercado Pago
 * @param subscriptionData Dados para criação da assinatura
 * @returns Resultado da criação da assinatura
 */
export async function createSubscription(subscriptionData: SubscriptionData) {
  try {
    // Se plano gratuito, retornar sem chamar o Mercado Pago
    if (subscriptionData.planPrice === 0) {
      return {
        id: 'free-plan',
        init_point: null,
        free: true
      };
    }

    // Obter o host base a partir da URL de callback ou usar o padrão
    const baseUrl = subscriptionData.callbackUrls?.success 
      ? subscriptionData.callbackUrls.success.split('/dashboard')[0]
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    console.log(`Criando preferência com baseUrl: ${baseUrl}`);
    
    // Referência externa (usada para identificar a assinatura no retorno)
    const externalReference = subscriptionData.external_reference || subscriptionData.userId;

    // Criar instância da preferência
    const preference = new Preference(mercadopago);
    
    // Verificar URLs de callback
    const successUrl = subscriptionData.callbackUrls?.success || `${baseUrl}/dashboard/payment/success`;
    const failureUrl = subscriptionData.callbackUrls?.failure || `${baseUrl}/dashboard/payment/failure`;
    const pendingUrl = subscriptionData.callbackUrls?.pending || `${baseUrl}/dashboard/payment/pending`;
    
    console.log(`URLs de retorno: 
      - Success: ${successUrl}
      - Failure: ${failureUrl}
      - Pending: ${pendingUrl}`);

    // Dados para a criação da preferência - SIMPLIFICADO como o checkout-pro
    const preferenceData = {
      items: [
        {
          id: `plan-${subscriptionData.planName.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Assinatura do plano ${subscriptionData.planName}`,
          description: subscriptionData.description || `Assinatura do plano ${subscriptionData.planName} - SaaS IA Platform`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: subscriptionData.planPrice
        }
      ],
      metadata: {
        userId: subscriptionData.userId,
        planName: subscriptionData.planName,
        external_reference: externalReference
      }
    };

    console.log('Dados da preferência:', JSON.stringify(preferenceData, null, 2));

    // Criar preferência no Mercado Pago
    const response = await preference.create({ body: preferenceData });
    
    console.log('Preferência criada:', JSON.stringify(response, null, 2));

    return {
      id: response.id,
      init_point: response.init_point,
      free: false
    };
  } catch (error) {
    console.error('Erro ao criar assinatura no Mercado Pago:', error);
    throw error;
  }
}

/**
 * Valida uma notificação de pagamento do Mercado Pago
 * @param notificationId ID da notificação
 * @returns Dados do pagamento
 */
export async function validateMercadoPagoNotification(notificationId: string) {
  try {
    // Criar instância de pagamento
    const payment = new Payment(mercadopago);
    
    // Obter dados do pagamento
    const response = await payment.get({ id: notificationId });
    
    return response;
  } catch (error) {
    console.error('Erro ao validar notificação do Mercado Pago:', error);
    throw error;
  }
}

// Interface para resposta de cancelamento
interface CancelResponse {
  status: string;
}

// Função para cancelar uma assinatura no Mercado Pago
export async function cancelSubscription(mercadoPagoId: string): Promise<CancelResponse> {
  // Para assinaturas simuladas ou gratuitas
  if (mercadoPagoId === 'free-plan' || mercadoPagoId.startsWith('simulated-')) {
    return { status: 'cancelled' };
  }
  
  // No momento estamos usando pagamentos únicos, não assinaturas
  // Não há uma forma direta de "cancelar" um pagamento no Mercado Pago
  // Mas podemos retornar um status de cancelado para fins de consistência
  return { status: 'cancelled' };
}

// Interface para resposta de status
interface StatusResponse {
  status: string;
  last_modified?: string;
  reason?: string;
}

// Função para verificar o status de um pagamento no Mercado Pago
export async function getSubscriptionStatus(mercadoPagoId: string): Promise<StatusResponse> {
  // Para planos gratuitos ou simulados
  if (mercadoPagoId === 'free-plan' || mercadoPagoId.startsWith('simulated-')) {
    return { status: 'authorized' };
  }
  
  // Se não tiver token configurado
  if (!accessToken) {
    return { status: 'authorized' };
  }

  try {
    // A implementação atual não suporta obter status diretamente
    // Seria necessário implementar usando a nova API
    // Por enquanto, retornamos um status simulado
    return {
      status: 'authorized',
      last_modified: new Date().toISOString(),
      reason: 'Manual verification required'
    };
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    throw new Error(`Erro ao verificar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
} 