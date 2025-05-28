/**
 * Utilitários para medição e otimização de performance
 */

// Classe para medir e registrar desempenho
export class Performance {
  private static metrics: Record<string, number[]> = {};
  private timers: Record<string, number> = {};
  
  // Obter o tempo atual em milissegundos
  static now(): number {
    return performance.now();
  }
  
  // Registrar uma métrica de desempenho
  static record(name: string, duration: number): void {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }
    this.metrics[name].push(duration);
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  }
  
  // Versão de instância para iniciar um timer
  startTimer(name: string): void {
    this.timers[name] = Date.now();
    console.log(`[Performance] Iniciando timer: ${name}`);
  }
  
  // Versão de instância para finalizar um timer
  endTimer(name: string): number {
    const startTime = this.timers[name];
    if (!startTime) {
      console.warn(`[Performance] Timer não encontrado: ${name}`);
      return 0;
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    Performance.record(name, duration);
    
    // Limpar o timer
    delete this.timers[name];
    
    return duration;
  }
  
  // Obter estatísticas de uma métrica específica
  static getStats(name: string): { 
    avg: number; 
    min: number; 
    max: number; 
    count: number; 
    total: number; 
  } | null {
    const values = this.metrics[name];
    if (!values || values.length === 0) {
      return null;
    }
    
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      avg,
      min,
      max,
      count: values.length,
      total
    };
  }
  
  // Obter todas as métricas registradas
  static getAllMetrics(): Record<string, { 
    avg: number; 
    min: number; 
    max: number; 
    count: number; 
    total: number; 
  }> {
    const result: Record<string, any> = {};
    
    for (const name in this.metrics) {
      const stats = this.getStats(name);
      if (stats) {
        result[name] = stats;
      }
    }
    
    return result;
  }
  
  // Limpar métricas
  static clear(name?: string): void {
    if (name) {
      delete this.metrics[name];
    } else {
      this.metrics = {};
    }
  }
  
  // Registrar o tempo de execução de uma função
  static async measure<T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const start = this.now();
    try {
      return await fn();
    } finally {
      const end = this.now();
      this.record(name, end - start);
    }
  }
  
  // Versão de instância para medir o tempo de execução de uma função
  async measure<T>(
    name: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(name);
    try {
      return await fn();
    } finally {
      this.endTimer(name);
    }
  }
}

// Medir o tempo de execução de uma função
export function measureExecutionTime<T>(
  fn: () => T | Promise<T>,
  label: string = 'Execution time'
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const startTime = performance.now();
      const result = await fn();
      const endTime = performance.now();
      console.log(`${label}: ${endTime - startTime}ms`);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

// Função para limitar a frequência de chamadas (debounce)
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Função para limitar a taxa de chamadas (throttle)
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Cache em memória com suporte a TTL (Time-To-Live)
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T; expires: number | null }>;
  private defaultTTL: number | null;
  
  /**
   * Cria uma nova instância de MemoryCache
   * 
   * @param defaultTTL - Tempo de vida padrão em milissegundos (null para nunca expirar)
   */
  constructor(defaultTTL: number | null = null) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Define um valor no cache
   * 
   * @param key - Chave de identificação
   * @param value - Valor a ser armazenado
   * @param ttl - Tempo de vida em milissegundos (sobrescreve o padrão)
   */
  set(key: string, value: T, ttl?: number | null): void {
    const expires = ttl !== undefined 
      ? (ttl === null ? null : Date.now() + ttl)
      : (this.defaultTTL === null ? null : Date.now() + this.defaultTTL);
    
    this.cache.set(key, { value, expires });
  }
  
  /**
   * Obtém um valor do cache
   * 
   * @param key - Chave de identificação
   * @returns O valor armazenado ou undefined se não existir ou estiver expirado
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Verificar se o item expirou
    if (item.expires !== null && item.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * Remove um item do cache
   * 
   * @param key - Chave de identificação
   * @returns true se o item foi removido, false caso contrário
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Limpa o cache por completo
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Obtém o número de itens no cache
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * Limpa itens expirados do cache
   * 
   * @returns Número de itens removidos
   */
  cleanExpired(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expires !== null && item.expires < now) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Obtém um valor do cache, ou executa uma função para obter o valor se não existir
   * 
   * @param key - Chave de identificação
   * @param factory - Função para gerar o valor se não estiver em cache
   * @param ttl - Tempo de vida em milissegundos (sobrescreve o padrão)
   * @returns O valor armazenado ou o resultado da função factory
   */
  async getOrSet(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number | null
  ): Promise<T> {
    const cachedValue = this.get(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }
} 