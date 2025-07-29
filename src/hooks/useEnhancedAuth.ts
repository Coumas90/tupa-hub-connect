import { useCallback, useMemo } from 'react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { useLocationContext } from '@/contexts/LocationContext';
import { TestingMode } from '@/lib/config';

export interface EnhancedAuthState {
  // Auth state
  user: any;
  userRole: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Role checking utilities
  hasRole: (role: string | string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isRoleAtLeast: (minimumRole: string) => boolean;
  
  // Context utilities
  hasLocationAccess: boolean;
  canAccessTenantFeatures: boolean;
  canAccessAdminFeatures: boolean;
  
  // Performance utilities
  sessionTimeLeft: number;
  isSessionExpired: boolean;
  refreshUserData: () => Promise<void>;
}

// Role hierarchy for comparison
const ROLE_HIERARCHY = {
  'client': 1,
  'barista': 2,
  'manager': 3,
  'owner': 4,
  'admin': 5
};

/**
 * Enhanced auth hook with intelligent role checking and context awareness
 */
export function useEnhancedAuth(): EnhancedAuthState {
  const {
    user,
    userRole,
    isAdmin,
    loading,
    error,
    getSessionTimeLeft,
    isSessionExpired,
    refreshUserData
  } = useOptimizedAuth();

  const { activeLocation, loading: locationLoading } = useLocationContext();

  const isAuthenticated = !!user;
  const sessionTimeLeft = getSessionTimeLeft();
  const sessionExpired = isSessionExpired();

  // Enhanced role checking utilities
  const hasRole = useCallback((role: string | string[]) => {
    if (!userRole) return false;
    
    if (Array.isArray(role)) {
      return role.some(r => r.toLowerCase() === userRole.toLowerCase());
    }
    
    return role.toLowerCase() === userRole.toLowerCase();
  }, [userRole]);

  const hasAnyRole = useCallback((roles: string[]) => {
    return hasRole(roles);
  }, [hasRole]);

  const hasAllRoles = useCallback((roles: string[]) => {
    if (!userRole) return false;
    return roles.every(role => role.toLowerCase() === userRole.toLowerCase());
  }, [userRole]);

  const isRoleAtLeast = useCallback((minimumRole: string) => {
    if (!userRole) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[userRole.toLowerCase() as keyof typeof ROLE_HIERARCHY] || 0;
    const minimumRoleLevel = ROLE_HIERARCHY[minimumRole.toLowerCase() as keyof typeof ROLE_HIERARCHY] || 0;
    
    return userRoleLevel >= minimumRoleLevel;
  }, [userRole]);

  // Context-aware utilities
  const hasLocationAccess = useMemo(() => {
    return !locationLoading && !!activeLocation?.slug;
  }, [locationLoading, activeLocation]);

  const canAccessTenantFeatures = useMemo(() => {
    return isAuthenticated && hasLocationAccess && !isAdmin;
  }, [isAuthenticated, hasLocationAccess, isAdmin]);

  const canAccessAdminFeatures = useMemo(() => {
    return isAuthenticated && (isAdmin || TestingMode.enabled);
  }, [isAuthenticated, isAdmin]);

  return {
    // Auth state
    user,
    userRole,
    isAdmin,
    isAuthenticated,
    loading: loading || locationLoading,
    error,
    
    // Role checking utilities
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isRoleAtLeast,
    
    // Context utilities
    hasLocationAccess,
    canAccessTenantFeatures,
    canAccessAdminFeatures,
    
    // Performance utilities
    sessionTimeLeft,
    isSessionExpired: sessionExpired,
    refreshUserData,
  };
}