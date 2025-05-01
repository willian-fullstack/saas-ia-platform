import React, { useEffect, useState } from 'react';
import { useCredits } from '@/lib/hooks/useCredits';
import { Loader2, CreditCard, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

interface CreditBadgeProps {
  variant?: 'default' | 'compact' | 'menu' | 'large';
  className?: string;
  showBuyButton?: boolean;
  [key: string]: unknown;
}

// Classes de estilo fixas para garantir a mesma renderização no servidor e cliente
const variantClassMap = {
  default: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/15",
  compact: "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary dark:bg-primary/15",
  menu: "inline-flex flex-col items-start p-2 rounded-md hover:bg-accent hover:text-accent-foreground",
  large: "inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-foreground/90 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
};

export function CreditBadge({ 
  variant = 'default', 
  className = '', 
  showBuyButton = false,
  ...props 
}: CreditBadgeProps) {
  const { credits, loading, error, lastUpdated, fetchCredits } = useCredits({ autoRefresh: true });
  const [isClient, setIsClient] = useState(false);
  
  // Flag para saber se estamos no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Atualizar créditos quando o evento personalizado for disparado
  useEffect(() => {
    if (!isClient) return;
    
    const handleCreditsUpdated = () => {
      // Forçar atualização do saldo de créditos
      fetchCredits();
    };
    
    // Adicionar listener para o evento personalizado
    window.addEventListener('credits-updated', handleCreditsUpdated as EventListener);
    
    // Remover listener ao desmontar
    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdated as EventListener);
    };
  }, [fetchCredits, isClient]);
  
  // Valor formatado dos créditos - garante consistência tanto no servidor quanto no cliente
  const formattedCredits = loading || !isClient ? '-' : new Intl.NumberFormat('pt-BR').format(credits);
  
  // Formatação da data - só ocorre no cliente
  const formattedDate = isClient && lastUpdated 
    ? new Date(lastUpdated).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : '-';
  
  // Usar a classe de variante fixa com a classe adicional
  const buttonClassName = `${variantClassMap[variant]} ${className}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => fetchCredits()} 
            className={buttonClassName}
            disabled={loading}
            {...props}
          >
            {loading ? (
              <Loader2 size={variant === 'compact' ? 12 : variant === 'large' ? 20 : 16} className="mr-2 animate-spin" />
            ) : (
              variant === 'large' ? 
                <Sparkles size={20} className="mr-2" /> : 
                <CreditCard size={variant === 'compact' ? 12 : 16} className="mr-1" />
            )}
            
            {variant === 'menu' ? (
              <div>
                <div className="text-sm font-medium">Créditos</div>
                <div className={`text-xs ${error ? 'text-red-600' : ''}`}>
                  {error ? 'Erro ao carregar' : formattedCredits}
                </div>
              </div>
            ) : (
              <span>{formattedCredits} créditos</span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="z-50">
          <div className="text-sm p-1">
            <div className="font-medium">Saldo atual: {formattedCredits} créditos</div>
            {error ? (
              <div className="text-red-600 text-xs mt-1">Erro: {error}</div>
            ) : (
              <div className="text-xs text-gray-500 mt-1">Atualizado em: {formattedDate}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">Clique para atualizar</div>
            
            {showBuyButton && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Link 
                  href="/dashboard/subscription" 
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded inline-block mt-1"
                >
                  Obter mais créditos
                </Link>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 