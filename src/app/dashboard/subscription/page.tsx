"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, RefreshCw } from "lucide-react";
import { PlanCard } from "@/components/subscription/PlanCard";
import { CreditBadge } from "@/components/subscription/CreditBadge";
import { useCredits } from "@/lib/hooks/useCredits";
import { IPlan } from "@/lib/db/models/Plan";

// Interface estendida para IPlan com ID sendo uma string
interface IPlanWithId extends IPlan {
  _id: string;
}

// Interface para tipagem da assinatura
interface Subscription {
  _id: string;
  status: 'active' | 'pending' | 'cancelled';
  startDate?: string;
  renewalDate?: string;
  planId: {
    _id: string;
    name: string;
    credits: number;
  };
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const { credits, loading: loadingCredits, fetchCredits } = useCredits({ autoRefresh: true });
  const [plans, setPlans] = useState<IPlanWithId[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Função para buscar dados
  const fetchData = async (showRefreshingIndicator = false) => {
    if (showRefreshingIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Buscar planos disponíveis
      const plansResponse = await fetch("/api/subscription/plans");
      const plansData = await plansResponse.json();

      if (!plansData.success) {
        throw new Error(plansData.message || "Erro ao buscar planos");
      }

      setPlans(plansData.plans as IPlanWithId[]);

      // Buscar assinatura atual
      const subscriptionResponse = await fetch("/api/subscription/subscribe", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const subscriptionData = await subscriptionResponse.json();

      if (subscriptionData.success && subscriptionData.hasSubscription) {
        setSubscription(subscriptionData.subscription);
      } else {
        setSubscription(null);
      }
      
      // Atualizar créditos
      await fetchCredits();
      
      // Limpar erros
      setError("");
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar planos de assinatura"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  // Efeito para verificar se é necessário atualizar a interface após interação com plano gratuito
  useEffect(() => {
    // Se a assinatura estiver com status pendente mas for um plano gratuito (básico)
    // podemos forçar uma atualização para garantir que a interface reflita o estado correto
    if (subscription && 
        subscription.status === 'pending' && 
        subscription.planId.name.toLowerCase().includes('básico')) {
      
      // Primeiro tentar corrigir o plano gratuito com o endpoint fixfree
      const fixFreePlan = async () => {
        try {
          const response = await fetch("/api/subscription/fixfree", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          const data = await response.json();
          
          if (data.success) {
            console.log("Plano gratuito corrigido automaticamente");
            // Atualizar os dados imediatamente
            fetchData(true);
          } else {
            console.log("Falha ao corrigir plano gratuito:", data.message);
            // Fazer uma atualização após um breve atraso
            setTimeout(() => fetchData(true), 2000);
          }
        } catch (error) {
          console.error("Erro ao tentar corrigir plano gratuito:", error);
          // Fazer uma atualização após um breve atraso
          setTimeout(() => fetchData(true), 2000);
        }
      };
      
      // Executar a correção
      fixFreePlan();
    }
  }, [subscription]);

  // Função para forçar atualização dos dados
  const handleRefresh = () => {
    fetchData(true);
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao assinar plano");
      }

      if (data.isFree) {
        // Recarregar os dados em vez de recarregar a página
        await fetchData();
      } else if (data.paymentUrl) {
        // Redirecionar para o Mercado Pago
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error("Erro ao assinar plano:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao processar assinatura"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/subscription/subscribe", {
        method: "PATCH",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao cancelar assinatura");
      }

      setSubscription(data.subscription);
      alert("Assinatura cancelada com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao cancelar assinatura"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <p>Você precisa estar logado para acessar esta página.</p>
      </div>
    );
  }

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Planos de Assinatura</h1>
        <button 
          onClick={handleRefresh} 
          className="flex items-center gap-2 px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md text-sm transition-colors"
          disabled={refreshing}
        >
          <RefreshCw size={16} className={`${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>
      
      <div className="mb-6">
        <CreditBadge variant="default" className="text-lg" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {subscription && (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Sua Assinatura Atual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="mb-1">
                <span className="font-medium">Plano:</span>{" "}
                <span className="font-semibold text-primary">{subscription.planId.name}</span>
              </p>
              <p className="mb-1">
                <span className="font-medium">Créditos incluídos:</span>{" "}
                <span className="font-semibold">{subscription.planId.credits?.toLocaleString('pt-BR') || 0}</span>
              </p>
              <p className="mb-1">
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={`font-semibold ${
                    subscription.status === "active"
                      ? "text-green-600"
                      : subscription.status === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {subscription.status === "active"
                    ? "Ativo"
                    : subscription.status === "pending"
                    ? "Pendente"
                    : "Cancelado"}
                </span>
              </p>
            </div>
            <div>
              {subscription.startDate && (
                <p className="mb-1">
                  <span className="font-medium">Início:</span>{" "}
                  {new Date(subscription.startDate).toLocaleDateString("pt-BR")}
                </p>
              )}
              {subscription.renewalDate && (
                <p className="mb-1">
                  <span className="font-medium">Próxima renovação:</span>{" "}
                  {new Date(subscription.renewalDate).toLocaleDateString(
                    "pt-BR"
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {subscription.status === "active" && (
              <button
                onClick={handleCancelSubscription}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                ) : null}
                Cancelar Assinatura
              </button>
            )}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Planos Disponíveis</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            isCurrentPlan={subscription?.planId?._id === plan._id}
            onSelectPlan={() => handleSubscribe(plan._id)}
            loading={loading || refreshing}
          />
        ))}
      </div>
    </div>
  );
} 