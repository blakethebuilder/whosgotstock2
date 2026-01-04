// Enhanced in-memory cache with LRU eviction and memory management
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

class LRUCache {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;
  private maxMemoryMB: number;

  constructor(maxSize = 1000, maxMemoryMB = 100) {
    this.maxSize = maxSize;
    this.maxMemoryMB = maxMemoryMB;
    
    // Clean up expired items every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    // If still over size limit, remove least recently used items
    if (this.cache.size > this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const toDelete = sortedEntries.slice(0, this.cache.size - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
      deletedCount += toDelete.length;
    }
    
    if (deletedCount > 0) {
      console.log(`Cache cleanup: removed ${deletedCount} items, ${this.cache.size} remaining`);
    }
  }

  private getMemoryUsageMB(): number {
    const jsonString = JSON.stringify(Array.from(this.cache.values()));
    return Buffer.byteLength(jsonString, 'utf8') / (1024 * 1024);
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;
    
    return item.data;
  }

  set(key: string, data: any, ttlMs: number = 60000): void {
    const now = Date.now();
    
    // Check memory usage before adding
    if (this.getMemoryUsageMB() > this.maxMemoryMB) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttlMs,
      accessCount: 0,
      lastAccessed: now
    });
    
    // Enforce size limit
    if (this.cache.size > this.maxSize) {
      this.cleanup();
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; memoryMB: number; hitRate?: number } {
    return {
      size: this.cache.size,
      memoryMB: this.getMemoryUsageMB(),
    };
  }
}

const cache = new LRUCache(1000, 100); // Max 1000 items, 100MB

export function getCached(key: string): any | null {
  return cache.get(key);
}

export function setCache(key: string, data: any, ttlMs: number = 60000): void {
  cache.set(key, data, ttlMs);
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats() {
  return cache.getStats();
}