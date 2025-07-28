/**
 * Tenant context caching layer for improved performance
 * Reduces database calls by caching location context data
 * Enhanced with contamination detection and performance monitoring
 */

import { sentryUtils } from '@/lib/sentry';

interface CachedLocationContext {
  group: any;
  locations: any[];
  activeLocation: any;
  timestamp: number;
  userId: string;
  sessionId?: string;
  lastAccessed: number;
}

class TenantCache {
  private cache = new Map<string, CachedLocationContext>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
  };

  private getCacheKey(userId: string, preferredLocationId?: string): string {
    return `${userId}:${preferredLocationId || 'default'}`;
  }

  get(userId: string, preferredLocationId?: string): CachedLocationContext | null {
    const key = this.getCacheKey(userId, preferredLocationId);
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.stats.misses++;
      sentryUtils.logCacheEvent('miss', key, userId);
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      this.stats.misses++;
      sentryUtils.logCacheEvent('miss', key, userId);
      return null;
    }
    
    // Update last accessed time
    cached.lastAccessed = Date.now();
    this.stats.hits++;
    sentryUtils.logCacheEvent('hit', key, userId);
    
    return cached;
  }

  set(userId: string, data: Omit<CachedLocationContext, 'timestamp' | 'userId' | 'lastAccessed'>, preferredLocationId?: string): void {
    const key = this.getCacheKey(userId, preferredLocationId);
    const now = Date.now();
    
    // Detect potential contamination
    const existing = this.cache.get(key);
    if (existing && existing.userId !== userId) {
      sentryUtils.logContaminationAlert(
        userId, 
        existing.userId, 
        userId, 
        'cache_set'
      );
    }
    
    this.cache.set(key, {
      ...data,
      timestamp: now,
      lastAccessed: now,
      userId
    });
    
    this.stats.sets++;
    sentryUtils.logCacheEvent('set', key, userId);
  }

  invalidate(userId: string): void {
    let invalidatedCount = 0;
    // Remove all cached entries for this user
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    this.stats.invalidations += invalidatedCount;
    sentryUtils.logCacheEvent('invalidate', `user:${userId}`, userId);
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += size;
  }

  // Get cache statistics for monitoring
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100),
      cacheSize: this.cache.size,
    };
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Tenant cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  // Warm cache for specific tenant
  warmCache(userId: string, data: Omit<CachedLocationContext, 'timestamp' | 'userId' | 'lastAccessed'>, preferredLocationId?: string): void {
    this.set(userId, data, preferredLocationId);
  }

  // Check for potential data contamination
  validateTenantIntegrity(userId: string): boolean {
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`${userId}:`) && value.userId !== userId) {
        sentryUtils.logContaminationAlert(
          userId,
          value.userId,
          userId,
          'integrity_check'
        );
        return false;
      }
    }
    return true;
  }
}

export const tenantCache = new TenantCache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  tenantCache.cleanup();
}, 10 * 60 * 1000);