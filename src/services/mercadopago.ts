// Importamos o SDK do Mercado Pago usando a nova API
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Variável para armazenar a instância configurada do cliente
let mpClient: MercadoPagoConfig | null = null;

// Função para inicializar o Mercado Pago com o token de acesso
export function initMercadoPago(): boolean {
  // Se já configurado, não fazer nada
  if (mpClient) {
    return true;
  }
  
  // Tentar vários nomes possíveis da variável de ambiente
  const accessToken = 
    process.env.MP_ACCESS_TOKEN || 
    process.env.MERCADO_PAGO_ACCESS_TOKEN || 
    process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  console.log('Tentando configurar Mercado Pago...');
  
  if (!accessToken) {
    console.warn('Token de acesso do Mercado Pago não configurado. Funcionamento em modo simulado.');
    return false;
  }
  
  try {
    // Criar uma nova instância do cliente Mercado Pago
    mpClient = new MercadoPagoConfig({
      accessToken: accessToken
    });
    
    console.log('Mercado Pago configurado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao configurar Mercado Pago:', error);
    return false;
  }
}

// Interface para dados de assinatura
interface SubscriptionData {
  planName: string;
  planPrice: number;
  userEmail: string;
  description?: string;
  userId: string;
}

// Interface para resposta de assinatura
interface SubscriptionResponse {
  id: string;
  init_point: string | null;
  status: string;
  free: boolean;
}

// Função para criar uma assinatura no Mercado Pago
export async function createSubscription(subscriptionData: SubscriptionData): Promise<SubscriptionResponse> {
  const isConfigured = initMercadoPago();
  const { planName, planPrice, userEmail, userId } = subscriptionData;
  
  // Se plano for gratuito, não criar assinatura no MP
  if (planPrice <= 0) {
    return {
      id: 'free-plan',
      init_point: null,
      status: 'authorized',
      free: true
    };
  }
  
  // Se o MP não estiver configurado, retornar uma resposta simulada
  if (!isConfigured || !mpClient) {
    return {
      id: `simulated-${Date.now()}`,
      init_point: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/payment/simulation?plan=${encodeURIComponent(planName)}`,
      status: 'pending',
      free: false
    };
  }

  try {
    // Criar uma instância de Preference
    const preference = new Preference(mpClient);
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Criando o objeto de configuração
    const preferenceData = {
      items: [{
        id: `subscription-${planName}`,
        title: `Assinatura ${planName} - SaaS IA Platform`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: planPrice,
        category_id: "subscription"
      }],
      payer: {
        email: userEmail
      },
      back_urls: {
        success: `${baseUrl}/dashboard/payment/success`,
        failure: `${baseUrl}/dashboard/payment/failure`,
        pending: `${baseUrl}/dashboard/payment/pending`
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      external_reference: userId
    };
    
    // Removendo auto_return para testar se é esse o problema
    // De acordo com a documentação, ele só funciona com URLs de retorno configuradas
    
    console.log('Dados da preferência:', JSON.stringify(preferenceData, null, 2));
    
    // Configuração da preferência de pagamento
    const createdPreference = await preference.create({
      body: preferenceData
    });
    
    console.log('Preferência criada com sucesso:', JSON.stringify(createdPreference, null, 2));
    
    if (!createdPreference.id) {
      throw new Error("Falha ao criar preferência: ID não recebido");
    }
    
    return {
      id: createdPreference.id,
      init_point: createdPreference.init_point || null,
      status: 'pending',
      free: false
    };
  } catch (error) {
    console.error('Erro ao criar pagamento no Mercado Pago:', error);
    throw new Error(`Erro na integração com Mercado Pago: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
  
  // Se o MP não estiver configurado
  if (!mpClient) {
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
  
  // Se o MP não estiver configurado
  if (!mpClient) {
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

// Função para validar uma notificação do Mercado Pago
export async function validateMercadoPagoNotification(notificationId: string): Promise<Record<string, unknown>> {
  if (!mpClient) {
    return { status: 'approved', simulation: true };
  }

  try {
    // A implementação atual não suporta validar notificações diretamente
    // Seria necessário implementar usando a nova API
    // Por enquanto, retornamos uma resposta simulada
    return { 
      status: 'approved',
      external_reference: notificationId,
      date_created: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao validar notificação do Mercado Pago:', error);
    throw new Error(`Erro ao validar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
} 