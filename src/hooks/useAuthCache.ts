import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface AuthCacheState {
  user: CacheEntry<User> | null;
  session: CacheEntry<Session> | null;
  permissions: CacheEntry<string[]> | null;
}

export function useAuthCache() {
  const [cache, setCache] = useState<AuthCacheState>({
    user: null,
    session: null,
    permissions: null
  });

  const isExpired = useCallback((entry: CacheEntry<any> | null): boolean => {
    if (!entry) return true;
    return Date.now() - entry.timestamp > entry.ttl;
  }, []);

  const setUserCache = useCallback((user: User, ttl: number = 5 * 60 * 1000) => {
    setCache(prev => ({
      ...prev,
      user: {
        data: user,
        timestamp: Date.now(),
        ttl
      }
    }));
  }, []);

  const setSessionCache = useCallback((session: Session, ttl: number = 10 * 60 * 1000) => {
    setCache(prev => ({
      ...prev,
      session: {
        data: session,
        timestamp: Date.now(),
        ttl
      }
    }));
  }, []);

  const setPermissionsCache = useCallback((permissions: string[], ttl: number = 15 * 60 * 1000) => {
    setCache(prev => ({
      ...prev,
      permissions: {
        data: permissions,
        timestamp: Date.now(),
        ttl
      }
    }));
  }, []);

  const getCachedUser = useCallback((): User | null => {
    return !isExpired(cache.user) ? cache.user?.data || null : null;
  }, [cache.user, isExpired]);

  const getCachedSession = useCallback((): Session | null => {
    return !isExpired(cache.session) ? cache.session?.data || null : null;
  }, [cache.session, isExpired]);

  const getCachedPermissions = useCallback((): string[] | null => {
    return !isExpired(cache.permissions) ? cache.permissions?.data || null : null;
  }, [cache.permissions, isExpired]);

  const clearCache = useCallback(() => {
    setCache({
      user: null,
      session: null,
      permissions: null
    });
  }, []);

  const preloadUserData = useCallback(async (userId: string) => {
    // Simulate preloading user permissions and profile data
    setTimeout(() => {
      const mockPermissions = ['read', 'write', 'admin'];
      setPermissionsCache(mockPermissions);
    }, 100);
  }, [setPermissionsCache]);

  return {
    setUserCache,
    setSessionCache,
    setPermissionsCache,
    getCachedUser,
    getCachedSession,
    getCachedPermissions,
    clearCache,
    preloadUserData,
    cacheStats: {
      userCached: !isExpired(cache.user),
      sessionCached: !isExpired(cache.session),
      permissionsCached: !isExpired(cache.permissions)
    }
  };
}