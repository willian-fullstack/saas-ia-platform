import React from 'react';
import { IPlan } from '@/lib/db/models/Plan';
import { Check, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanCardProps {
  plan: IPlan;
  isCurrentPlan?: boolean;
  onSelectPlan?: (plan: IPlan) => void;
  loading?: boolean;
}

export function PlanCard({ plan, isCurrentPlan = false, onSelectPlan, loading = false }: PlanCardProps) {
  // Formatar preço
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(plan.price);
  
  // Verificar se o plano é gratuito
  const isFree = plan.price === 0;
  
  // Classes CSS para o cartão
  const cardClasses = `
    relative flex flex-col h-full border rounded-xl shadow transition-all
    ${isCurrentPlan 
      ? 'border-primary bg-primary/5' 
      : 'border-border hover:border-primary/40 hover:shadow-lg'
    }
    ${plan.name.toLowerCase().includes('avançado') || plan.name.toLowerCase().includes('premium')
      ? 'shadow-md border-amber-300/50'
      : ''}
  `;
  
  // Variante do botão com base no status atual
  let buttonVariant: 'default' | 'outline' | 'secondary' = 'default';
  let buttonText = 'Assinar';
  
  if (isCurrentPlan) {
    buttonVariant = 'secondary';
    buttonText = 'Plano Atual';
  }
  
  return (
    <div className={cardClasses}>
      {/* Indicador de Plano Atual */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full">
            Atual
          </span>
        </div>
      )}
      
      {/* Destaque para plano Premium/Avançado */}
      {(plan.name.toLowerCase().includes('avançado') || plan.name.toLowerCase().includes('premium')) && (
        <div className="absolute -top-3 left-4">
          <span className="bg-amber-400 text-amber-950 text-xs font-bold py-1 px-3 rounded-full flex items-center">
            <Star className="h-3 w-3 mr-1 fill-amber-950" /> Recomendado
          </span>
        </div>
      )}
      
      {/* Cabeçalho */}
      <div className="text-center p-6 border-b">
        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-muted-foreground text-sm">{plan.description}</p>
        )}
      </div>
      
      {/* Preço */}
      <div className="text-center p-6 flex-grow">
        <div className="mb-4">
          <div className="text-4xl font-bold">{formattedPrice}</div>
          <div className="text-muted-foreground text-sm">por mês</div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="text-center font-medium">
            <span className="text-lg text-primary font-bold">{plan.credits.toLocaleString('pt-BR')}</span> créditos
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Renovados mensalmente
          </div>
        </div>
        
        <div className="text-left">
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start text-sm">
                <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
            
            {/* Recursos indisponíveis com base no plano */}
            {plan.name.toLowerCase().includes('básico') && (
              <>
                <li className="flex items-start text-sm text-muted-foreground">
                  <X size={16} className="text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                  <span>Prioridade no suporte</span>
                </li>
                <li className="flex items-start text-sm text-muted-foreground">
                  <X size={16} className="text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                  <span>Acesso antecipado a novos recursos</span>
                </li>
              </>
            )}
            
            {isFree && (
              <li className="flex items-start text-sm text-muted-foreground">
                <X size={16} className="text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                <span>Recursos premium</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Botão */}
      {onSelectPlan && (
        <div className="p-6 pt-0">
          <Button
            variant={buttonVariant}
            className="w-full py-6"
            disabled={isCurrentPlan || loading}
            onClick={() => onSelectPlan(plan)}
          >
            {loading ? 'Carregando...' : buttonText}
          </Button>
        </div>
      )}
    </div>
  );
} 