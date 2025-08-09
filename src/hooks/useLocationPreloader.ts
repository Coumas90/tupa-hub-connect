import { useEffect, useCallback } from 'react';
import { useEnhancedAuth } from './useEnhancedAuth';
import { useLocationContext } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { Roles } from '@/constants/roles';

interface LocationCacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class LocationCache {
  private cache = new Map<string, LocationCacheEntry>();
  private defaultTtl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.defaultTtl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

const locationCache = new LocationCache();

export function useLocationPreloader() {
  const { user, userRole, isAuthenticated } = useEnhancedAuth();
  const { setActiveLocationBySlug, activeLocation } = useLocationContext();

  // Preload user's primary location for client/barista roles
  const preloadUserLocation = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    const cacheKey = `user_location_${user.id}`;
    
    // Check cache first
    const cachedLocation = locationCache.get(cacheKey);
    if (cachedLocation && !activeLocation) {
      console.info('🔍 LocationPreloader: Using cached location data');
      setActiveLocationBySlug(cachedLocation.slug);
      return;
    }

    // Skip preloading for admin users or if we already have an active location
    if (userRole === Roles.ADMIN || activeLocation) return;

    try {
      console.info('🔄 LocationPreloader: Preloading user location...', { userRole });

      // Get user's location context
      const { data: locationContext, error } = await supabase
        .rpc('get_user_location_context', { _user_id: user.id });

      if (error) {
        console.warn('⚠️ LocationPreloader: Error fetching location context:', error);
        return;
      }

      if (locationContext && locationContext.length > 0) {
        const location = {
          id: locationContext[0].location_id,
          name: locationContext[0].location_name,
          slug: locationContext[0].location_slug,
          address: locationContext[0].location_address,
          group_id: locationContext[0].group_id,
          is_main: locationContext[0].is_main_location
        };

        // Cache the location
        locationCache.set(cacheKey, location);
        
        console.info('✅ LocationPreloader: Location preloaded successfully', {
          locationSlug: location.slug,
          userRole
        });
        
        // Set active location using the slug
        await setActiveLocationBySlug(location.slug);
      } else {
        console.info('📍 LocationPreloader: No location found for user');
      }
    } catch (error) {
      console.error('❌ LocationPreloader: Failed to preload location:', error);
    }
  }, [isAuthenticated, user?.id, userRole, activeLocation, setActiveLocationBySlug]);

  // Preload frequently accessed routes for better UX
  const preloadRoutes = useCallback(async () => {
    if (!isAuthenticated || !userRole) return;

    const routesToPreload = [];

      switch (userRole.toLowerCase()) {
        case 'client':
        case Roles.MANAGER:
        case Roles.OWNER:
          routesToPreload.push('/dashboard', '/app/consumo', '/app/recetas');
          break;
        case Roles.BARISTA:
          routesToPreload.push('/recipes', '/app/academia');
          break;
        case Roles.ADMIN:
          routesToPreload.push('/admin/dashboard', '/admin/operations');
          break;
    }

    // Preload routes using link prefetch (browser native)
    routesToPreload.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    console.info('🚀 LocationPreloader: Routes preloaded for role:', userRole, routesToPreload);
  }, [isAuthenticated, userRole]);

  // Smart cache management
  const manageCacheLifecycle = useCallback(() => {
    // Clear cache when user logs out
    if (!isAuthenticated) {
      locationCache.clear();
      console.info('🧹 LocationPreloader: Cache cleared on logout');
    }
  }, [isAuthenticated]);

  // Effect to run preloading
  useEffect(() => {
    if (isAuthenticated && userRole) {
      // Small delay to avoid blocking initial render
      const timer = setTimeout(() => {
        preloadUserLocation();
        preloadRoutes();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userRole, preloadUserLocation, preloadRoutes]);

  // Effect for cache management
  useEffect(() => {
    manageCacheLifecycle();
  }, [manageCacheLifecycle]);

  // Return cache utilities for external use
  return {
    locationCache: {
      get: (key: string) => locationCache.get(key),
      set: (key: string, data: any, ttl?: number) => locationCache.set(key, data, ttl),
      has: (key: string) => locationCache.has(key),
      clear: () => locationCache.clear()
    },
    preloadUserLocation,
    preloadRoutes
  };
}