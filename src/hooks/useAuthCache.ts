import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface AuthCacheOptions {
  defaultTtl?: number; // Time to live in milliseconds
  maxSize?: number;    // Maximum cache size
}

/**
 * Local cache hook for authentication data with TTL support
 * Implements memory-efficient caching with automatic cleanup
 */
export function useAuthCache<T>(options: AuthCacheOptions = {}) {
  const { defaultTtl = 5 * 60 * 1000, maxSize = 100 } = options; // 5 minutes default TTL
  
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [, forceUpdate] = useState({});

  // Force re-render when cache changes
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // Cleanup expired entries
  const cleanupExpired = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
      }
    }
    
    // If cache is too large, remove oldest entries
    if (cache.size > maxSize) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, cache.size - maxSize);
      toRemove.forEach(([key]) => cache.delete(key));
    }
  }, [maxSize]);

  // Get value from cache
  const get = useCallback((key: string): T | null => {
    const cache = cacheRef.current;
    const entry = cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }
    
    return entry.data;
  }, []);

  // Set value in cache with change detection
  const set = useCallback((key: string, data: T, ttl = defaultTtl) => {
    const cache = cacheRef.current;
    const existing = cache.get(key);
    
    // Check if data actually changed to prevent unnecessary re-renders
    const hasChanged = !existing || 
      JSON.stringify(existing.data) !== JSON.stringify(data) ||
      existing.ttl !== ttl;
    
    if (!hasChanged) {
      console.debug('🔄 AuthCache: No change detected for key:', key);
      return;
    }
    
    cleanupExpired();
    
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Only trigger update if data actually changed
    triggerUpdate();
    
    console.info('🔄 AuthCache: Cached data for key:', key, { ttl: `${ttl}ms` });
  }, [defaultTtl, cleanupExpired, triggerUpdate]);

  // Check if key exists and is valid
  const has = useCallback((key: string): boolean => {
    return get(key) !== null;
  }, [get]);

  // Remove specific key from cache
  const remove = useCallback((key: string) => {
    const cache = cacheRef.current;
    const deleted = cache.delete(key);
    
    if (deleted) {
      triggerUpdate();
      console.info('🗑️ AuthCache: Removed key:', key);
    }
    
    return deleted;
  }, [triggerUpdate]);

  // Clear entire cache
  const clear = useCallback(() => {
    const cache = cacheRef.current;
    const size = cache.size;
    cache.clear();
    
    if (size > 0) {
      triggerUpdate();
      console.info('🗑️ AuthCache: Cleared cache, removed', size, 'entries');
    }
  }, [triggerUpdate]);

  // Get cache statistics
  const getStats = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    let expired = 0;
    
    for (const entry of cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    }
    
    return {
      total: cache.size,
      valid: cache.size - expired,
      expired,
      maxSize
    };
  }, [maxSize]);

  return {
    get,
    set,
    has,
    remove,
    clear,
    getStats,
    cleanupExpired
  };
}