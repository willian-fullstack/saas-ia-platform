'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock } from 'lucide-react';

export default function PaymentPendingPage() {
  const router = useRouter();
  
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };
  
  const handleGoToSubscription = () => {
    router.push('/dashboard/subscription');
  };
  
  return (
    <div className="container max-w-3xl py-12">
      <Alert className="mb-8 bg-yellow-50 border-yellow-500 text-yellow-700">
        <Clock className="h-5 w-5 text-yellow-500" />
        <AlertTitle className="text-xl font-bold">Pagamento em processamento</AlertTitle>
        <AlertDescription className="text-yellow-600">
          Seu pagamento está sendo processado. A assinatura será ativada assim que confirmado.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Pagamento pendente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="mb-4">
              Seu pagamento foi recebido e está em análise. 
              Este processo pode levar até 48 horas para ser concluído, dependendo do método de pagamento escolhido.
            </p>
            <p className="font-medium">
              Você receberá uma notificação assim que o pagamento for aprovado e sua assinatura for ativada.
              Não é necessário realizar um novo pagamento.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-6">
            <h3 className="font-semibold mb-2">O que acontece agora:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Seu pagamento está sendo processado pelo Mercado Pago</li>
              <li>Assim que aprovado, sua assinatura será ativada automaticamente</li>
              <li>Os créditos serão adicionados à sua conta</li>
              <li>Você poderá utilizar todos os recursos do plano contratado</li>
              <li>Se o pagamento for recusado, você poderá tentar novamente</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={handleGoToDashboard}>
            Voltar ao Dashboard
          </Button>
          <Button onClick={handleGoToSubscription}>
            Ver status da assinatura
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 