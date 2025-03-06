/**
 * Serviço de cache para armazenar dados frequentemente utilizados
 * Isso reduz o número de requisições a APIs externas e melhora o desempenho
 */

// Interface para os itens armazenados no cache
interface CacheItem<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

// Tipo para as coordenadas geográficas
export interface Coordinates {
  lat: number;
  lng: number;
}

// Cache para coordenadas geográficas
class CoordinatesCache {
  private cache: Map<string, CacheItem<Coordinates>>;
  private readonly DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  /**
   * Carrega o cache do localStorage, se disponível
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedCache = localStorage.getItem('coordinates_cache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        
        // Converte o objeto em um Map
        this.cache = new Map(Object.entries(parsedCache));
        
        // Limpa entradas expiradas
        this.cleanExpired();
      }
    } catch (error) {
      console.error('Erro ao carregar cache de coordenadas:', error);
      // Em caso de erro, reinicia o cache
      this.cache = new Map();
    }
  }

  /**
   * Salva o cache no localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Converte o Map em um objeto para armazenar no localStorage
      const cacheObject = Object.fromEntries(this.cache.entries());
      localStorage.setItem('coordinates_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Erro ao salvar cache de coordenadas:', error);
    }
  }

  /**
   * Remove entradas expiradas do cache
   */
  private cleanExpired(): void {
    const now = Date.now();
    let hasExpired = false;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        hasExpired = true;
      }
    }

    // Se alguma entrada foi removida, salva o cache atualizado
    if (hasExpired) {
      this.saveToStorage();
    }
  }

  /**
   * Obtém coordenadas do cache
   * @param address Endereço a ser buscado
   * @returns Coordenadas ou null se não estiver no cache
   */
  get(address: string): Coordinates | null {
    // Normaliza o endereço para usar como chave
    const key = this.normalizeAddress(address);
    
    // Limpa entradas expiradas antes de verificar
    this.cleanExpired();
    
    const item = this.cache.get(key);
    
    if (item && item.expiresAt > Date.now()) {
      console.log(`🔍 Cache HIT para endereço: ${address}`);
      return item.value;
    }
    
    console.log(`🔍 Cache MISS para endereço: ${address}`);
    return null;
  }

  /**
   * Armazena coordenadas no cache
   * @param address Endereço a ser armazenado
   * @param coordinates Coordenadas a serem armazenadas
   * @param ttlMs Tempo de vida em milissegundos (opcional)
   */
  set(address: string, coordinates: Coordinates, ttlMs?: number): void {
    // Normaliza o endereço para usar como chave
    const key = this.normalizeAddress(address);
    
    const now = Date.now();
    const ttl = ttlMs || this.DEFAULT_TTL_MS;
    
    this.cache.set(key, {
      value: coordinates,
      timestamp: now,
      expiresAt: now + ttl
    });
    
    console.log(`💾 Coordenadas armazenadas em cache para: ${address}`);
    
    // Salva o cache atualizado
    this.saveToStorage();
  }

  /**
   * Normaliza um endereço para usar como chave no cache
   * @param address Endereço a ser normalizado
   * @returns Endereço normalizado
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,-]/g, ''); // Remove caracteres especiais exceto espaços, vírgulas e hífens
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
    console.log('🧹 Cache de coordenadas limpo');
  }

  /**
   * Retorna o tamanho atual do cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Instância única do cache de coordenadas
export const coordinatesCache = new CoordinatesCache();

// Cache para distâncias calculadas
class DistanceCache {
  private cache: Map<string, CacheItem<number>>;
  private readonly DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  /**
   * Carrega o cache do localStorage, se disponível
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedCache = localStorage.getItem('distance_cache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        
        // Converte o objeto em um Map
        this.cache = new Map(Object.entries(parsedCache));
        
        // Limpa entradas expiradas
        this.cleanExpired();
      }
    } catch (error) {
      console.error('Erro ao carregar cache de distâncias:', error);
      // Em caso de erro, reinicia o cache
      this.cache = new Map();
    }
  }

  /**
   * Salva o cache no localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Converte o Map em um objeto para armazenar no localStorage
      const cacheObject = Object.fromEntries(this.cache.entries());
      localStorage.setItem('distance_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Erro ao salvar cache de distâncias:', error);
    }
  }

  /**
   * Remove entradas expiradas do cache
   */
  private cleanExpired(): void {
    const now = Date.now();
    let hasExpired = false;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        hasExpired = true;
      }
    }

    // Se alguma entrada foi removida, salva o cache atualizado
    if (hasExpired) {
      this.saveToStorage();
    }
  }

  /**
   * Gera uma chave única para o par origem-destino
   * @param origin Origem
   * @param destination Destino
   * @returns Chave única
   */
  private generateKey(origin: string | Coordinates, destination: string | Coordinates): string {
    // Converte coordenadas para string
    const originStr = typeof origin === 'string' 
      ? origin 
      : `${origin.lat},${origin.lng}`;
    
    const destinationStr = typeof destination === 'string'
      ? destination
      : `${destination.lat},${destination.lng}`;
    
    // Normaliza e combina origem e destino para formar a chave
    return `${this.normalizeAddress(originStr)}|${this.normalizeAddress(destinationStr)}`;
  }

  /**
   * Normaliza um endereço para usar como parte da chave no cache
   * @param address Endereço a ser normalizado
   * @returns Endereço normalizado
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,-\.]/g, ''); // Remove caracteres especiais exceto espaços, vírgulas, pontos e hífens
  }

  /**
   * Obtém distância do cache
   * @param origin Origem
   * @param destination Destino
   * @returns Distância em km ou null se não estiver no cache
   */
  get(origin: string | Coordinates, destination: string | Coordinates): number | null {
    const key = this.generateKey(origin, destination);
    
    // Limpa entradas expiradas antes de verificar
    this.cleanExpired();
    
    const item = this.cache.get(key);
    
    if (item && item.expiresAt > Date.now()) {
      console.log(`🔍 Cache HIT para distância`);
      return item.value;
    }
    
    console.log(`🔍 Cache MISS para distância`);
    return null;
  }

  /**
   * Armazena distância no cache
   * @param origin Origem
   * @param destination Destino
   * @param distance Distância em km
   * @param ttlMs Tempo de vida em milissegundos (opcional)
   */
  set(
    origin: string | Coordinates, 
    destination: string | Coordinates, 
    distance: number, 
    ttlMs?: number
  ): void {
    const key = this.generateKey(origin, destination);
    
    const now = Date.now();
    const ttl = ttlMs || this.DEFAULT_TTL_MS;
    
    this.cache.set(key, {
      value: distance,
      timestamp: now,
      expiresAt: now + ttl
    });
    
    console.log(`💾 Distância armazenada em cache: ${distance} km`);
    
    // Salva o cache atualizado
    this.saveToStorage();
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
    console.log('🧹 Cache de distâncias limpo');
  }

  /**
   * Retorna o tamanho atual do cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Instância única do cache de distâncias
export const distanceCache = new DistanceCache(); 