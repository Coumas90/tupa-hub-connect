import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLocationContext } from '@/contexts/LocationContext';
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
 * Smart Route Handler
 * Determines the best route for a user based on their location context
 */
export function useSmartNavigation() {
  const { activeLocation, loading } = useLocationContext();
  const navigate = useNavigate();

  const navigateToTenant = (path: string = 'dashboard/overview') => {
    if (!activeLocation?.slug) {
      console.warn('No active location available for navigation');
      return;
    }

    const targetPath = `/tenants/${activeLocation.slug}/${path}`;
    navigate(targetPath);
  };

  const navigateToRole = (role: 'owner' | 'manager' | 'barista' | 'overview' = 'overview') => {
    if (!activeLocation?.slug) return;
    
    const routes = {
      overview: buildTenantRoute.dashboard.overview,
      owner: buildTenantRoute.dashboard.owner,
      manager: buildTenantRoute.dashboard.manager,
      barista: buildTenantRoute.dashboard.barista,
    };
    
    navigate(routes[role]({ locationSlug: activeLocation.slug }));
  };

  const navigateToOperation = (operation: 'consumption' | 'recipes' | 'staff' | 'inventory' | 'resources') => {
    if (!activeLocation?.slug) return;
    
    const routes = {
      consumption: buildTenantRoute.operations.consumption,
      recipes: buildTenantRoute.operations.recipes,
      staff: buildTenantRoute.operations.staff,
      inventory: buildTenantRoute.operations.inventory,
      resources: buildTenantRoute.operations.resources,
    };
    
    navigate(routes[operation]({ locationSlug: activeLocation.slug }));
  };

  return {
    navigateToTenant,
    navigateToRole,
    navigateToOperation,
    canNavigate: !loading && !!activeLocation?.slug,
    currentTenantSlug: activeLocation?.slug,
  };
}