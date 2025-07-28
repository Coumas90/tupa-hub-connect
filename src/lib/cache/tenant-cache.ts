/**
 * Tenant context caching layer for improved performance
 * Reduces database calls by caching location context data
 */

interface CachedLocationContext {
  group: any;
  locations: any[];
  activeLocation: any;
  timestamp: number;
  userId: string;
}

class TenantCache {
  private cache = new Map<string, CachedLocationContext>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(userId: string, preferredLocationId?: string): string {
    return `${userId}:${preferredLocationId || 'default'}`;
  }

  get(userId: string, preferredLocationId?: string): CachedLocationContext | null {
    const key = this.getCacheKey(userId, preferredLocationId);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  set(userId: string, data: Omit<CachedLocationContext, 'timestamp' | 'userId'>, preferredLocationId?: string): void {
    const key = this.getCacheKey(userId, preferredLocationId);
    this.cache.set(key, {
      ...data,
      timestamp: Date.now(),
      userId
    });
  }

  invalidate(userId: string): void {
    // Remove all cached entries for this user
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

export const tenantCache = new TenantCache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  tenantCache.cleanup();
}, 10 * 60 * 1000);