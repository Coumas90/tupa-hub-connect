import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLocationContext } from '@/contexts/LocationContext';

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
      '/app': `/tenants/${activeLocation.slug}/dashboard/overview`,
      '/app/recetas': `/tenants/${activeLocation.slug}/operations/recipes`,
      '/app/academia': `/tenants/${activeLocation.slug}/academy`,
      '/app/consumo': `/tenants/${activeLocation.slug}/operations/consumption`,
      '/app/recursos': `/tenants/${activeLocation.slug}/operations/resources`,
      '/app/mi-equipo': `/tenants/${activeLocation.slug}/operations/staff`,
      '/app/reposicion': `/tenants/${activeLocation.slug}/operations/inventory`,
      '/app/barista-pool': `/tenants/${activeLocation.slug}/barista-pool`,
      '/app/faq': `/tenants/${activeLocation.slug}/faq`,
      '/recipes': `/tenants/${activeLocation.slug}/operations/recipes`,
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
            const newPath = `/tenants/${locationData.slug}/dashboard/owner`;
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
    navigateToTenant(`dashboard/${role}`);
  };

  const navigateToOperation = (operation: 'consumption' | 'recipes' | 'staff' | 'inventory' | 'resources') => {
    navigateToTenant(`operations/${operation}`);
  };

  return {
    navigateToTenant,
    navigateToRole,
    navigateToOperation,
    canNavigate: !loading && !!activeLocation?.slug,
    currentTenantSlug: activeLocation?.slug,
  };
}