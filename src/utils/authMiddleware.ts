import { User, Session } from '@supabase/supabase-js';
import { getUserRole, getUserLocationContext, UserRole, RoleCheckResult } from './authRoleUtils';

export interface AuthValidationResult {
  isValid: boolean;
  redirectTo?: string;
  reason?: string;
  userRole?: RoleCheckResult;
  locationContext?: any;
}

export interface RedirectOptions {
  forceAdmin?: boolean;
  requireLocation?: boolean;
  allowedRoles?: UserRole[];
  fallbackRoute?: string;
}

/**
 * Unified auth middleware for validation and redirection
 */
export async function validateAndRedirectUser(
  user: User | null,
  session: Session | null,
  currentPath: string,
  options: RedirectOptions = {}
): Promise<AuthValidationResult> {
  // Not authenticated
  if (!user || !session) {
    return {
      isValid: false,
      redirectTo: determineLoginRoute(currentPath, options),
      reason: 'not_authenticated'
    };
  }

  // Get user role with priority system
  const userRole = await getUserRole(user);
  
  // Get location context if required
  let locationContext = null;
  if (options.requireLocation || userRole.role !== 'admin') {
    locationContext = await getUserLocationContext(user.id);
  }

  // Admin-only routes
  if (options.forceAdmin && !userRole.isAdmin) {
    return {
      isValid: false,
      redirectTo: '/app',
      reason: 'insufficient_privileges',
      userRole
    };
  }

  // Role-based validation
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    const hasRequiredRole = options.allowedRoles.some(role => 
      userRole.role === role || (userRole.isAdmin && role !== 'admin')
    );
    
    if (!hasRequiredRole) {
      return {
        isValid: false,
        redirectTo: options.fallbackRoute || '/app',
        reason: 'role_mismatch',
        userRole
      };
    }
  }

  // Location requirement check
  if (options.requireLocation && !locationContext && !userRole.isAdmin) {
    return {
      isValid: false,
      redirectTo: '/onboarding/location',
      reason: 'location_required',
      userRole
    };
  }

  // Determine optimal redirect for successful auth
  const redirectTo = determineOptimalRoute(userRole, locationContext, currentPath);

  return {
    isValid: true,
    redirectTo,
    userRole,
    locationContext
  };
}

/**
 * Determine login route based on current path and options
 */
function determineLoginRoute(currentPath: string, options: RedirectOptions): string {
  // Admin routes should go to admin login
  if (currentPath.startsWith('/admin') || options.forceAdmin) {
    return '/admin/login';
  }
  
  // Default client login
  return '/auth';
}

/**
 * Determine optimal route after successful authentication
 */
function determineOptimalRoute(
  roleResult: RoleCheckResult, 
  locationContext: any, 
  currentPath: string
): string {
  // Skip redirects for certain paths
  const skipRedirectPaths = ['/auth', '/admin/login', '/password-reset', '/onboarding'];
  if (skipRedirectPaths.some(path => currentPath.startsWith(path))) {
    return currentPath;
  }

  // Admin users go to admin dashboard
  if (roleResult.isAdmin) {
    return '/admin/dashboard';
  }

  // Users with location context go to their location-based app
  if (locationContext?.location_slug) {
    return `/app/${locationContext.location_slug}/dashboard/overview`;
  }

  // Default fallback
  return '/app';
}

/**
 * Quick route validation for guards
 */
export function validateRouteAccess(
  userRole: RoleCheckResult | null,
  routePath: string
): { allowed: boolean; redirectTo?: string } {
  if (!userRole) {
    return { 
      allowed: false, 
      redirectTo: routePath.startsWith('/admin') ? '/admin/login' : '/auth' 
    };
  }

  // Admin routes
  if (routePath.startsWith('/admin')) {
    if (!userRole.isAdmin) {
      return { allowed: false, redirectTo: '/app' };
    }
    return { allowed: true };
  }

  // Client routes - most roles allowed
  if (routePath.startsWith('/app')) {
    if (!userRole.role) {
      return { allowed: false, redirectTo: '/auth' };
    }
    return { allowed: true };
  }

  // Public routes
  return { allowed: true };
}

/**
 * Session validation with automatic refresh
 */
export function validateSession(session: Session | null): {
  isValid: boolean;
  needsRefresh: boolean;
  expiresIn: number;
} {
  if (!session) {
    return { isValid: false, needsRefresh: false, expiresIn: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at || 0;
  const expiresIn = expiresAt - now;

  // Session expired
  if (expiresIn <= 0) {
    return { isValid: false, needsRefresh: true, expiresIn: 0 };
  }

  // Session needs refresh soon (within 5 minutes)
  const needsRefresh = expiresIn < 300;

  return {
    isValid: true,
    needsRefresh,
    expiresIn
  };
}