import crypto from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class QueryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Clean expired entries every minute
    setInterval(() => this.cleanExpired(), 60 * 1000);
  }

  private generateKey(sql: string, params?: any[]): string {
    const data = sql + (params ? JSON.stringify(params) : '');
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  get(sql: string, params?: any[]): any | null {
    const key = this.generateKey(sql, params);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(sql: string, data: any, params?: any[], ttl?: number): void {
    const key = this.generateKey(sql, params);
    
    // If cache is full, evict oldest entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, entry);
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      // Clear all cache
      this.cache.clear();
      return;
    }
    
    // Remove entries that match pattern (simple string contains check)
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateTable(tableName: string): void {
    // Invalidate all queries related to a specific table
    this.invalidate(tableName.toLowerCase());
  }

  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  shouldCache(sql: string): boolean {
    const trimmedSql = sql.trim().toLowerCase();
    
    // Only cache SELECT and SHOW operations
    return trimmedSql.startsWith('select') || 
           trimmedSql.startsWith('show') || 
           trimmedSql.startsWith('describe') ||
           trimmedSql.startsWith('desc');
  }
}