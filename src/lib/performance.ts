/**
 * Utilitários para medição e otimização de performance
 */

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

// Cache simples em memória
export class MemoryCache<T> {
  private cache: Map<string, { value: T, expiry: number | null }> = new Map();
  
  set(key: string, value: T, ttlMs?: number): void {
    const expiry = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { value, expiry });
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;
    
    // Se expirou, remove do cache e retorna undefined
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    // Se expirou, remove do cache e retorna false
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
} 