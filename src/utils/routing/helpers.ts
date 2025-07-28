import { TENANT_ROUTES, ADMIN_ROUTES, PUBLIC_ROUTES } from '@/constants/routes';

/**
 * Type-safe route building helpers
 * Provides consistent URL construction with parameter substitution
 */

interface TenantRouteParams {
  locationSlug: string;
}

interface ClientRouteParams {
  clientId: string;
}

interface FeedbackRouteParams {
  locationSlug: string;
}

// ===== TENANT ROUTE BUILDERS =====
export const buildTenantRoute = {
  dashboard: {
    overview: (params: TenantRouteParams) => 
      TENANT_ROUTES.DASHBOARD.OVERVIEW.replace(':locationSlug', params.locationSlug),
    owner: (params: TenantRouteParams) => 
      TENANT_ROUTES.DASHBOARD.OWNER.replace(':locationSlug', params.locationSlug),
    manager: (params: TenantRouteParams) => 
      TENANT_ROUTES.DASHBOARD.MANAGER.replace(':locationSlug', params.locationSlug),
    barista: (params: TenantRouteParams) => 
      TENANT_ROUTES.DASHBOARD.BARISTA.replace(':locationSlug', params.locationSlug),
  },
  operations: {
    consumption: (params: TenantRouteParams) => 
      TENANT_ROUTES.OPERATIONS.CONSUMPTION.replace(':locationSlug', params.locationSlug),
    recipes: (params: TenantRouteParams) => 
      TENANT_ROUTES.OPERATIONS.RECIPES.replace(':locationSlug', params.locationSlug),
    staff: (params: TenantRouteParams) => 
      TENANT_ROUTES.OPERATIONS.STAFF.replace(':locationSlug', params.locationSlug),
    inventory: (params: TenantRouteParams) => 
      TENANT_ROUTES.OPERATIONS.INVENTORY.replace(':locationSlug', params.locationSlug),
    resources: (params: TenantRouteParams) => 
      TENANT_ROUTES.OPERATIONS.RESOURCES.replace(':locationSlug', params.locationSlug),
  },
  academy: {
    root: (params: TenantRouteParams) => 
      TENANT_ROUTES.ACADEMY.ROOT.replace(':locationSlug', params.locationSlug),
    courses: (params: TenantRouteParams) => 
      TENANT_ROUTES.ACADEMY.COURSES.replace(':locationSlug', params.locationSlug),
  },
  baristaPool: (params: TenantRouteParams) => 
    TENANT_ROUTES.BARISTA_POOL.replace(':locationSlug', params.locationSlug),
  faq: (params: TenantRouteParams) => 
    TENANT_ROUTES.FAQ.replace(':locationSlug', params.locationSlug),
};

// ===== ADMIN ROUTE BUILDERS =====
export const buildAdminRoute = {
  integrations: {
    root: () => ADMIN_ROUTES.INTEGRATIONS.ROOT,
    logs: (params: ClientRouteParams) => 
      ADMIN_ROUTES.INTEGRATIONS.LOGS.replace(':clientId', params.clientId),
    client: (params: ClientRouteParams) => 
      ADMIN_ROUTES.INTEGRATIONS.CLIENT.replace(':clientId', params.clientId),
  },
  courses: () => ADMIN_ROUTES.COURSES,
  advisory: () => ADMIN_ROUTES.ADVISORY,
  monitoring: () => ADMIN_ROUTES.MONITORING,
};

// ===== PUBLIC ROUTE BUILDERS =====
export const buildPublicRoute = {
  feedback: (params: FeedbackRouteParams) => 
    PUBLIC_ROUTES.FEEDBACK.replace(':locationSlug', params.locationSlug),
  auth: {
    login: () => PUBLIC_ROUTES.AUTH.LOGIN,
    reset: () => PUBLIC_ROUTES.AUTH.RESET,
    activate: () => PUBLIC_ROUTES.AUTH.ACTIVATE,
  },
  home: () => PUBLIC_ROUTES.HOME,
};

// ===== ROUTE ANALYSIS HELPERS =====
export const routeUtils = {
  /**
   * Checks if current route is within tenant context
   */
  isTenantRoute: (pathname: string): boolean => {
    return pathname.startsWith('/tenants/');
  },

  /**
   * Checks if current route is within admin context
   */
  isAdminRoute: (pathname: string): boolean => {
    return pathname.startsWith('/admin/');
  },

  /**
   * Checks if current route is public (no auth required)
   */
  isPublicRoute: (pathname: string): boolean => {
    const publicPaths = ['/', '/auth', '/auth/reset', '/activate-account', '/public/'];
    return publicPaths.some(path => pathname === path || pathname.startsWith(path));
  },

  /**
   * Extracts location slug from tenant route
   */
  extractLocationSlug: (pathname: string): string | null => {
    const match = pathname.match(/^\/tenants\/([^\/]+)/);
    return match ? match[1] : null;
  },

  /**
   * Extracts client ID from admin integration route
   */
  extractClientId: (pathname: string): string | null => {
    const match = pathname.match(/^\/admin\/integrations\/(?:logs\/)?([^\/]+)/);
    return match ? match[1] : null;
  },

  /**
   * Builds breadcrumb trail from current route
   */
  buildBreadcrumbs: (pathname: string, locationSlug?: string): Array<{ label: string; path: string }> => {
    const breadcrumbs: Array<{ label: string; path: string }> = [];
    
    if (routeUtils.isTenantRoute(pathname) && locationSlug) {
      breadcrumbs.push({ label: 'Dashboard', path: buildTenantRoute.dashboard.overview({ locationSlug }) });
      
      if (pathname.includes('/operations/')) {
        breadcrumbs.push({ label: 'Operations', path: `${TENANT_ROUTES.OPERATIONS.ROOT.replace(':locationSlug', locationSlug)}` });
      } else if (pathname.includes('/academy/')) {
        breadcrumbs.push({ label: 'Academy', path: buildTenantRoute.academy.root({ locationSlug }) });
      }
    } else if (routeUtils.isAdminRoute(pathname)) {
      breadcrumbs.push({ label: 'Admin', path: ADMIN_ROUTES.ROOT });
      
      if (pathname.includes('/integrations/')) {
        breadcrumbs.push({ label: 'Integrations', path: buildAdminRoute.integrations.root() });
      } else if (pathname.includes('/courses')) {
        breadcrumbs.push({ label: 'Courses', path: buildAdminRoute.courses() });
      }
    }
    
    return breadcrumbs;
  },
};