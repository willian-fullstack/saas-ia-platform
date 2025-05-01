"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentSimulationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planName = searchParams.get("plan") || "selecionado";
  
  const [countdown, setCountdown] = useState(10);
  const [simulationComplete, setSimulationComplete] = useState(false);
  
  // Simulador de processamento de pagamento
  useEffect(() => {
    if (countdown > 0 && !simulationComplete) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        
        // Quando o contador chegar a zero, simular pagamento completo
        if (countdown === 1) {
          setSimulationComplete(true);
          
          // Redirecionar para o dashboard após 2 segundos
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [countdown, simulationComplete, router]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-950 shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Simulação de Pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Ambiente de desenvolvimento sem integração real com Mercado Pago
          </p>
        </div>
        
        <div className="border rounded-lg p-4 mb-6">
          <h2 className="font-medium text-lg mb-2">Detalhes do Plano</h2>
          <p className="mb-1">
            <span className="font-medium">Plano:</span> {planName}
          </p>
          <p className="text-sm text-muted-foreground">
            Você está em um ambiente de simulação. Nenhum pagamento real será processado.
          </p>
        </div>
        
        {!simulationComplete ? (
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
            <p className="mb-2">Simulando processamento de pagamento...</p>
            <p className="text-sm text-muted-foreground">
              Redirecionamento automático em <span className="font-medium">{countdown}</span> segundos
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-600">Pagamento Aprovado!</h2>
            <p className="mb-4">Sua assinatura foi ativada com sucesso.</p>
            <div className="flex justify-center">
              <Button className="flex items-center" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t text-xs text-center text-muted-foreground">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
            <span>Ambiente de simulação</span>
          </div>
          <p>
            Para habilitar a integração real, configure a variável 
            <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">MERCADO_PAGO_ACCESS_TOKEN</code>
            no arquivo .env.local
          </p>
        </div>
      </div>
      
      <div className="mt-4">
        <Link href="/dashboard/subscription" className="text-sm text-primary hover:underline">
          Voltar para Planos de Assinatura
        </Link>
      </div>
    </div>
  );
} 