import { useState, useEffect, useCallback } from 'react';

interface UseCreditsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface CreditsState {
  credits: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useCredits(options: UseCreditsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options;
  const [state, setState] = useState<CreditsState>({
    credits: 0,
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Função para buscar o saldo de créditos
  const fetchCredits = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/credits/balance');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar créditos');
      }
      
      setState({
        credits: data.credits,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      
      return data.credits;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      return null;
    }
  }, []);

  // Função para consumir créditos
  const consumeCredits = useCallback(async (featureId: string, description?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/credits/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ featureId, description })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Erro ao consumir créditos: ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao consumir créditos');
      }
      
      setState({
        credits: data.remainingCredits,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      
      return {
        success: true,
        remainingCredits: data.remainingCredits,
        consumed: data.consumed
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, []);

  // Função para verificar se há créditos suficientes
  const hasEnoughCredits = useCallback(async (featureId: string) => {
    try {
      // Buscar custo da feature
      const response = await fetch(`/api/credits/verify?featureId=${featureId}`);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        return {
          hasEnough: false,
          error: data.message || 'Erro ao verificar créditos'
        };
      }
      
      return {
        hasEnough: data.hasEnough,
        required: data.required,
        available: data.available
      };
    } catch (error) {
      return {
        hasEnough: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }, []);

  // Efeito para buscar créditos iniciais e configurar auto-refresh
  useEffect(() => {
    fetchCredits();
    
    if (autoRefresh) {
      const intervalId = setInterval(fetchCredits, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchCredits, autoRefresh, refreshInterval]);

  return {
    credits: state.credits,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    fetchCredits,
    consumeCredits,
    hasEnoughCredits
  };
} 