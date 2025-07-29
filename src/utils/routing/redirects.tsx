import { useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLocationContext } from '@/contexts/LocationContext';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
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
 * Cafe-to-Location Route Redirector
 * Handles redirects from cafe-based routes to location-based routes
 */
export function CafeRouteRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cafeId } = useParams<{ cafeId: string }>();
  const { getLocationByCafeId } = useLocationContext();

  useEffect(() => {
    const handleCafeRedirect = async () => {
      if (!cafeId) return;

      const currentPath = location.pathname;
      
      // Handle cafe dashboard redirects
      if (currentPath.includes('/cafe/dashboard/')) {
        try {
          const locationData = await getLocationByCafeId(cafeId);
          if (locationData?.slug) {
            const newPath = buildTenantRoute.dashboard.owner({ locationSlug: locationData.slug });
            console.log(`Redirecting cafe dashboard from ${currentPath} to ${newPath}`);
            navigate(newPath, { replace: true });
          }
        } catch (error) {
          console.error('Error redirecting cafe route:', error);
        }
      }
    };

    handleCafeRedirect();
  }, [cafeId, location.pathname, getLocationByCafeId, navigate]);

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
    if (isAdmin) {
      navigate('/admin/dashboard');
      return;
    }

    if (activeLocation?.slug) {
      navigateToRole('overview');
      return;
    }

    // Fallback based on role when no location context
    switch (userRole?.toLowerCase()) {
      case 'barista':
        navigate('/recipes');
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