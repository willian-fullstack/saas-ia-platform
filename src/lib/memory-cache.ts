/**
 * Classe para gerenciamento de cache em memória com suporte a TTL
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T, expires: number | null }>;
  private defaultTTL: number | null;

  constructor(defaultTTL: number | null = null) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Define um valor no cache
   * @param key Chave do item
   * @param value Valor a ser armazenado
   * @param ttl Tempo de vida em milissegundos (ou null para não expirar)
   */
  set(key: string, value: T, ttl: number | null = this.defaultTTL): void {
    const expires = ttl !== null ? Date.now() + ttl : null;
    this.cache.set(key, { value, expires });
  }

  /**
   * Obtém um valor do cache
   * @param key Chave do item
   * @returns O valor armazenado ou undefined se não existir ou estiver expirado
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;
    
    // Verificar se expirou
    if (item.expires !== null && item.expires < Date.now()) {
      this.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  /**
   * Verifica se uma chave existe no cache e não está expirada
   * @param key Chave do item
   * @returns Verdadeiro se a chave existir e não estiver expirada
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    // Verificar se expirou
    if (item.expires !== null && item.expires < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove um item do cache
   * @param key Chave do item a ser removido
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna todas as chaves válidas no cache
   */
  keys(): string[] {
    const validKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (item.expires === null || item.expires >= Date.now()) {
        validKeys.push(key);
      }
    });
    
    return validKeys;
  }

  /**
   * Retorna o número de itens válidos no cache
   */
  size(): number {
    return this.keys().length;
  }

  /**
   * Limpa itens expirados do cache
   * @returns Número de itens removidos
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();
    
    this.cache.forEach((item, key) => {
      if (item.expires !== null && item.expires < now) {
        this.cache.delete(key);
        count++;
      }
    });
    
    return count;
  }
} 