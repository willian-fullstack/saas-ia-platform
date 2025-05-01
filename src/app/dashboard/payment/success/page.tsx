'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Atualizar status no backend
    const updatePaymentStatus = async () => {
      try {
        // Chamada opcional para atualizar status, mas o webhook já deve ter tratado isso
        await fetch('/api/subscription/payment-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'success' }),
        });
      } catch (error) {
        console.error('Erro ao atualizar status do pagamento:', error);
      }
    };
    
    updatePaymentStatus();
  }, []);
  
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };
  
  const handleGoToSubscription = () => {
    router.push('/dashboard/subscription');
  };
  
  return (
    <div className="container max-w-3xl py-12">
      <Alert className="mb-8 bg-green-50 border-green-500 text-green-700">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <AlertTitle className="text-xl font-bold">Pagamento realizado com sucesso!</AlertTitle>
        <AlertDescription className="text-green-600">
          Sua assinatura foi ativada e seus créditos já estão disponíveis para uso.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Obrigado pela sua assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="mb-4">
              Seu pagamento foi confirmado e sua assinatura foi ativada com sucesso.
              Agora você tem acesso a todos os recursos da plataforma conforme o plano contratado.
            </p>
            <p className="font-medium">
              Os créditos do seu plano já foram adicionados à sua conta e estão disponíveis para uso imediato.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleGoToSubscription}>
            Ver minha assinatura
          </Button>
          <Button onClick={handleGoToDashboard}>
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 