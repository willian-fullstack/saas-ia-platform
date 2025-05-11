'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IPlan } from '@/lib/db/models/Plan';
import { ISubscription } from '@/lib/db/models/Subscription';
import { PlanCard } from '@/components/subscription/PlanCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface SubscriptionClientProps {
  plans: IPlan[];
  currentSubscription: ISubscription | null;
  currentCredits: number;
}

export default function SubscriptionClient({
  plans,
  currentSubscription,
  currentCredits
}: SubscriptionClientProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<IPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Obter informações do plano atual
  const currentPlanId = currentSubscription?.planId;
  const currentPlan = currentPlanId 
    ? plans.find(p => p._id?.toString() === currentPlanId.toString()) 
    : null;
    
  // Status da assinatura
  const subscriptionStatus = currentSubscription?.status || 'none';
  
  // Data de início formatada
  const startDateFormatted = currentSubscription?.startDate 
    ? new Date(currentSubscription.startDate).toLocaleDateString('pt-BR') 
    : '-';
    
  // Data de renovação formatada
  const renewalDateFormatted = currentSubscription?.renewalDate 
    ? new Date(currentSubscription.renewalDate).toLocaleDateString('pt-BR') 
    : '-';
  
  // Função para assinar um plano
  const handleSubscribe = async (plan: IPlan) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log(`Iniciando assinatura para plano: ${plan.name} (${plan._id})`);
      
      const response = await fetchWithAuth('/api/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId: plan._id })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`Erro na resposta: ${response.status} - ${JSON.stringify(data)}`);
        throw new Error(data.message || `Erro ao processar assinatura (${response.status})`);
      }
      
      if (!data.success) {
        console.error(`Resposta com sucesso=false: ${JSON.stringify(data)}`);
        throw new Error(data.message || 'Erro ao processar assinatura');
      }
      
      console.log(`Resposta da API: ${JSON.stringify(data)}`);
      
      // Se for plano gratuito ou tiver URL de pagamento
      if (data.isFree) {
        setSuccess('Plano ativado com sucesso! Seus créditos foram adicionados.');
        // Recarregar dados da página
        router.refresh();
      } else if (data.paymentUrl) {
        console.log(`Redirecionando para pagamento: ${data.paymentUrl}`);
        // Redirecionar para o Mercado Pago
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      console.error('Erro ao assinar plano:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para cancelar assinatura
  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('Iniciando cancelamento de assinatura');
      
      const response = await fetchWithAuth('/api/subscription/subscribe', {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`Erro na resposta: ${response.status} - ${JSON.stringify(data)}`);
        throw new Error(data.message || `Erro ao cancelar assinatura (${response.status})`);
      }
      
      if (!data.success) {
        console.error(`Resposta com sucesso=false: ${JSON.stringify(data)}`);
        throw new Error(data.message || 'Erro ao cancelar assinatura');
      }
      
      console.log('Assinatura cancelada com sucesso');
      setSuccess('Assinatura cancelada com sucesso!');
      // Recarregar dados da página
      router.refresh();
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Mensagens de erro ou sucesso */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-500 text-green-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {/* Cartão de assinatura atual */}
      {currentPlan && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Sua Assinatura Atual
            </CardTitle>
            <CardDescription>
              Detalhes do seu plano atual e status da assinatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-sm mb-1 text-gray-500">Plano</h3>
                <p className="text-lg font-medium">{currentPlan.name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1 text-gray-500">Status</h3>
                <div className="flex items-center">
                  {subscriptionStatus === 'active' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">Ativo</span>
                    </>
                  ) : subscriptionStatus === 'pending' ? (
                    <>
                      <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-yellow-600 font-medium">Pendente</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-600 font-medium">Cancelado</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1 text-gray-500">Créditos</h3>
                <p className="text-lg font-medium">{currentCredits.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1 text-gray-500">Data de início</h3>
                <p>{startDateFormatted}</p>
              </div>
              {subscriptionStatus === 'active' && (
                <div>
                  <h3 className="font-semibold text-sm mb-1 text-gray-500">Próxima renovação</h3>
                  <p>{renewalDateFormatted}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {subscriptionStatus === 'active' && (
              <Button 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleCancelSubscription}
                disabled={loading}
              >
                Cancelar Assinatura
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
      
      {/* Seleção de planos */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Planos Disponíveis</h2>
        
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard 
              key={plan._id?.toString()} 
              plan={plan}
              isCurrentPlan={currentPlan?._id?.toString() === plan._id?.toString()}
              onSelectPlan={setSelectedPlan}
            />
          ))}
        </div>
      </div>
      
      {/* Confirmação de assinatura */}
      {selectedPlan && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Confirmar Assinatura</CardTitle>
            <CardDescription>
              Você está prestes a assinar o plano <strong>{selectedPlan.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Ao continuar, você concorda com os termos e condições da assinatura.
              {selectedPlan.price > 0 
                ? ' Você será redirecionado para o Mercado Pago para concluir o pagamento.' 
                : ' O plano gratuito será ativado imediatamente.'
              }
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPlan(null)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="default"
              onClick={() => handleSubscribe(selectedPlan)}
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Confirmar Assinatura'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 