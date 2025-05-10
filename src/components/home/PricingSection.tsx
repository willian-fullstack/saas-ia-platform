"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Check, Star } from "lucide-react";

// Interface para planos de assinatura
interface IPlan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  credits: number;
  features: string[];
  active: boolean;
}

export function PricingSection() {
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Função para buscar os planos
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/subscription/plans");
        const data = await response.json();

        if (data.success) {
          // Ordenar os planos por preço
          const sortedPlans = data.plans.sort((a: IPlan, b: IPlan) => a.price - b.price);
          setPlans(sortedPlans);
        } else {
          throw new Error(data.message || "Erro ao buscar planos");
        }
      } catch (error) {
        console.error("Erro ao carregar planos:", error);
        // Se der erro, usamos planos de fallback para não quebrar a página
        setPlans([
          {
            _id: "free",
            name: "Básico",
            description: "Ideal para experimentar a plataforma",
            price: 0,
            credits: 100,
            features: ["Acesso a funcionalidades básicas", "Sem cobranças recorrentes"],
            active: true
          },
          {
            _id: "pro",
            name: "Médio",
            description: "Para criadores em crescimento",
            price: 97,
            credits: 1000,
            features: ["Acesso a todas as funcionalidades", "Renovação automática mensal", "Suporte por email"],
            active: true
          },
          {
            _id: "premium",
            name: "Avançado",
            description: "Para profissionais e times",
            price: 197,
            credits: 3000,
            features: ["Acesso a todas as funcionalidades", "Prioridade nas requisições", "Suporte prioritário"],
            active: true
          }
        ]);
        setError("Não foi possível carregar os planos atualizados. Mostrando informações aproximadas.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <section className="relative z-10 container mx-auto px-4 py-16 md:py-20 bg-background/50 backdrop-blur-sm rounded-3xl my-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal para você</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Temos opções para todos os perfis, desde iniciantes até criadores profissionais.
        </p>
        {error && (
          <p className="text-amber-500 mt-2 text-sm max-w-2xl mx-auto">
            {error}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            // Verificar se é o plano premium/avançado
            const isPremium = plan.name.toLowerCase().includes('avançado') || 
                            plan.name.toLowerCase().includes('premium') ||
                            plan.price >= 150;
            
            // Verificar se é o plano recomendado (normalmente o do meio)
            const isRecommended = plan.name.toLowerCase().includes('médio') || 
                                plan.name.toLowerCase().includes('pro') ||
                                (plans.length >= 3 && plans.indexOf(plan) === 1);
            
            // Verificar se é o plano gratuito
            const isFree = plan.price === 0;
            
            return (
              <div 
                key={plan._id} 
                className={`relative bg-card border rounded-xl shadow-sm p-6 flex flex-col hover:shadow-md transition-all
                  ${isRecommended ? 'border-primary/30 shadow-md' : ''}
                  ${isPremium ? 'border-amber-300/30 bg-gradient-to-b from-card to-card/90' : ''}
                `}
              >
                {isRecommended && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-primary/90 text-primary-foreground text-xs px-3 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                
                {isPremium && !isRecommended && (
                  <div className="absolute -top-3 left-4">
                    <span className="bg-amber-400 text-amber-950 text-xs font-bold py-1 px-3 rounded-full flex items-center">
                      <Star className="h-3 w-3 mr-1 fill-amber-950" /> Premium
                    </span>
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'R$0' : `R$${plan.price}`}
                    </span>
                    <span className="text-muted-foreground ml-1">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description || (isFree ? 'Ideal para experimentar a plataforma' : 
                     isPremium ? 'Para profissionais e times' : 'Para criadores em crescimento')}
                  </p>
                </div>
                
                <div className="space-y-3 flex-grow mb-6">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2" />
                    <span>{plan.credits.toLocaleString('pt-BR')} créditos/mês</span>
                  </div>
                  
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link 
                  href="/dashboard/subscription" 
                  className={`w-full px-4 py-2 rounded-md text-center 
                    ${isRecommended 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : isPremium 
                        ? 'border border-amber-300/50 bg-amber-50/10 hover:bg-amber-50/20' 
                        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    } transition-colors`}
                >
                  {isFree ? 'Começar Grátis' : 'Assinar Agora'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
} 