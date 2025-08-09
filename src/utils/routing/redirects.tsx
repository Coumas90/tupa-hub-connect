import { useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLocationContext } from '@/contexts/LocationContext';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { supabase } from '@/integrations/supabase/client';
import { buildTenantRoute, buildPublicRoute } from './helpers';

/**
 * Legacy Route Redirector
 * Handles redirects from old route patterns to new tenant-based routes
 */
export function LegacyRouteRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeLocation } = useLocationContext();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Only redirect if we have an active location and we're on a legacy route
    if (!activeLocation?.slug) return;

    const redirectMappings: Record<string, string> = {
      '/app': buildTenantRoute.dashboard.overview({ locationSlug: activeLocation.slug }),
      '/app/recetas': buildTenantRoute.operations.recipes({ locationSlug: activeLocation.slug }),
      '/app/academia': buildTenantRoute.academy.root({ locationSlug: activeLocation.slug }),
      '/app/consumo': buildTenantRoute.operations.consumption({ locationSlug: activeLocation.slug }),
      '/app/recursos': buildTenantRoute.operations.resources({ locationSlug: activeLocation.slug }),
      '/app/mi-equipo': buildTenantRoute.operations.staff({ locationSlug: activeLocation.slug }),
      '/app/reposicion': buildTenantRoute.operations.inventory({ locationSlug: activeLocation.slug }),
      '/app/barista-pool': buildTenantRoute.baristaPool({ locationSlug: activeLocation.slug }),
      '/app/faq': buildTenantRoute.faq({ locationSlug: activeLocation.slug }),
      '/recipes': buildTenantRoute.operations.recipes({ locationSlug: activeLocation.slug }),
    };

    const targetPath = redirectMappings[currentPath];
    if (targetPath) {
      console.log(`Redirecting from ${currentPath} to ${targetPath}`);
      navigate(targetPath, { replace: true });
    }
  }, [location.pathname, activeLocation, navigate]);

  return null;
}

/**
 * Location ID to slug redirector
 * Handles redirects from location-based routes to slug-based tenant routes
 */
export function LocationRouteRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locationId } = useParams<{ locationId: string }>();

  const fetchLocation = async (id: string) => {
    const { data } = await supabase.from('locations').select('slug').eq('id', id).single();
    return data;
  };

  useEffect(() => {
    const handleLocationRedirect = async () => {
      if (!locationId) return;

      const currentPath = location.pathname;

      if (currentPath.includes('/location/dashboard/')) {
        try {
          const loc = await fetchLocation(locationId);
          if (loc?.slug) {
            const newPath = buildTenantRoute.dashboard.owner({ locationSlug: loc.slug });
            console.log(`Redirecting location dashboard from ${currentPath} to ${newPath}`);
            navigate(newPath, { replace: true });
          }
        } catch (error) {
          console.error('Error redirecting location route:', error);
        }
      }
    };

    handleLocationRedirect();
  }, [locationId, location.pathname, navigate]);

  return null;
}

/**
 * Enhanced Smart Route Handler with preloading and caching
 */
export function useSmartNavigation() {
  const { activeLocation, loading } = useLocationContext();
  const { userRole, isAdmin } = useEnhancedAuth();
  const navigate = useNavigate();

  const navigateToTenant = useCallback((path: string = 'dashboard/overview') => {
    if (!activeLocation?.slug) {
      console.warn('No active location available for navigation');
      return;
    }

    const targetPath = `/tenants/${activeLocation.slug}/${path}`;
    console.info('🔄 SmartNavigation: Navigating to tenant path', { 
      path: targetPath,
      userRole 
    });
    navigate(targetPath);
  }, [activeLocation?.slug, userRole, navigate]);

  const navigateToRole = useCallback((role: 'owner' | 'manager' | 'barista' | 'overview' = 'overview') => {
    if (!activeLocation?.slug) {
      console.warn('No active location for role navigation, using fallback');
      
      // Intelligent fallback based on user role
      switch (userRole?.toLowerCase()) {
        case 'admin':
          navigate('/admin/dashboard');
          return;
        case 'barista':
          navigate('/recipes');
          return;
        case 'client':
        case 'manager':
        case 'owner':
        default:
          navigate('/app');
          return;
      }
    }
    
    const routes = {
      overview: buildTenantRoute.dashboard.overview,
      owner: buildTenantRoute.dashboard.owner,
      manager: buildTenantRoute.dashboard.manager,
      barista: buildTenantRoute.dashboard.barista,
    };
    
    const targetPath = routes[role]({ locationSlug: activeLocation.slug });
    console.info('🔄 SmartNavigation: Role-based navigation', { 
      role, 
      targetPath,
      userRole 
    });
    navigate(targetPath);
  }, [activeLocation?.slug, userRole, navigate]);

  const navigateToOperation = useCallback((operation: 'consumption' | 'recipes' | 'staff' | 'inventory' | 'resources') => {
    if (!activeLocation?.slug) {
      console.warn('No active location for operation navigation');
      return;
    }
    
    const routes = {
      consumption: buildTenantRoute.operations.consumption,
      recipes: buildTenantRoute.operations.recipes,
      staff: buildTenantRoute.operations.staff,
      inventory: buildTenantRoute.operations.inventory,
      resources: buildTenantRoute.operations.resources,
    };
    
    const targetPath = routes[operation]({ locationSlug: activeLocation.slug });
    console.info('🔄 SmartNavigation: Operation navigation', { 
      operation, 
      targetPath,
      userRole 
    });
    navigate(targetPath);
  }, [activeLocation?.slug, userRole, navigate]);

  // Smart navigation that considers user role and context
  const navigateToOptimalRoute = useCallback(() => {
    // Prioritize client/manager/owner routes over admin
    if (activeLocation?.slug) {
      navigateToRole('overview');
      return;
    }

    // Only go to admin dashboard if explicitly admin role
    if (isAdmin && userRole?.toLowerCase() === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    // Default fallback prioritizes client routes
    switch (userRole?.toLowerCase()) {
      case 'barista':
        navigate('/recipes');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'client':
      case 'manager':
      case 'owner':
      default:
        navigate('/app');
        break;
    }
  }, [isAdmin, activeLocation?.slug, userRole, navigate, navigateToRole]);

  return {
    navigateToTenant,
    navigateToRole,
    navigateToOperation,
    navigateToOptimalRoute,
    canNavigate: !loading && !!activeLocation?.slug,
    currentTenantSlug: activeLocation?.slug,
    hasLocationContext: !!activeLocation?.slug,
    isLocationLoading: loading,
  };
}