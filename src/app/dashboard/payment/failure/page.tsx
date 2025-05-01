'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function PaymentFailurePage() {
  const router = useRouter();
  
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };
  
  const handleGoToSubscription = () => {
    router.push('/dashboard/subscription');
  };
  
  return (
    <div className="container max-w-3xl py-12">
      <Alert variant="error" className="mb-8 bg-red-50 border-red-500 text-red-700">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <AlertTitle className="text-xl font-bold">Falha no processamento do pagamento</AlertTitle>
        <AlertDescription className="text-red-600">
          Não foi possível concluir o processo de pagamento. Sua assinatura não foi ativada.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Erro no pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="mb-4">
              Infelizmente, ocorreu um erro durante o processamento do seu pagamento.
              Sua assinatura não foi ativada e nenhum valor foi cobrado em seu cartão.
            </p>
            <p className="font-medium">
              Por favor, tente novamente ou escolha outra forma de pagamento.
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-6">
            <h3 className="font-semibold mb-2">Possíveis causas:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cartão de crédito recusado ou com problemas</li>
              <li>Saldo insuficiente</li>
              <li>Erro de comunicação com a operadora</li>
              <li>Dados de pagamento inválidos</li>
              <li>Cancelamento durante o processo</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleGoToDashboard}>
            Voltar ao Dashboard
          </Button>
          <Button onClick={handleGoToSubscription}>
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 