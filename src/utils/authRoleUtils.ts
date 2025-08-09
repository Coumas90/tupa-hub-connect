import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Roles, Role, isRole } from '@/constants/roles';

export type UserRole = Role | null;

export interface RoleCheckResult {
  role: UserRole;
  source: 'user_roles_table' | 'user_metadata' | 'app_metadata' | 'none';
  isAdmin: boolean;
  hasLocationAccess: boolean;
  locationId?: string;
}

/**
 * Standardized role detection with clear priority:
 * 1. user_roles table (highest priority)
 * 2. user_metadata 
 * 3. app_metadata
 * 4. null (lowest priority)
 */
export async function getUserRole(user: User | null): Promise<RoleCheckResult> {
  if (!user) {
    return {
      role: null,
      source: 'none',
      isAdmin: false,
      hasLocationAccess: false
    };
  }

  try {
    // Priority 1: Check user_roles table
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1);

    if (!error && userRoles && userRoles.length > 0) {
      const role = userRoles[0].role;
      const validRole = isRole(role) ? role : null;
      return {
        role: validRole,
        source: 'user_roles_table',
        isAdmin: validRole === Roles.ADMIN,
        hasLocationAccess: validRole !== null
      };
    }

    // Priority 2: Check user_metadata
    if (user.user_metadata?.role && isRole(user.user_metadata.role)) {
      const role = user.user_metadata.role as Role;
      return {
        role,
        source: 'user_metadata',
        isAdmin: role === Roles.ADMIN,
        hasLocationAccess: role !== null
      };
    }

    // Priority 3: Check app_metadata
    if (user.app_metadata?.role && isRole(user.app_metadata.role)) {
      const role = user.app_metadata.role as Role;
      return {
        role,
        source: 'app_metadata',
        isAdmin: role === Roles.ADMIN,
        hasLocationAccess: role !== null
      };
    }

    // Default: No role found
    return {
      role: null,
      source: 'none',
      isAdmin: false,
      hasLocationAccess: false
    };

  } catch (error) {
    console.error('Error fetching user role:', error);
    
    // Fallback to metadata if DB query fails
    const metadataRole = user.user_metadata?.role || user.app_metadata?.role || null;
    const validRole = metadataRole && isRole(metadataRole) ? metadataRole : null;
    return {
      role: validRole,
      source: validRole ? 'user_metadata' : 'none',
      isAdmin: validRole === Roles.ADMIN,
      hasLocationAccess: validRole !== null
    };
  }
}

/**
 * Get user's location context
 */
export async function getUserLocationContext(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_location_context', { _user_id: userId });

    if (error) {
      console.error('Error fetching user location context:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getUserLocationContext:', error);
    return null;
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(roleResult: RoleCheckResult, requiredRole: UserRole): boolean {
  if (!roleResult.role || !requiredRole) return false;
  
  const roleHierarchy = {
    [Roles.ADMIN]: 5,
    [Roles.OWNER]: 4,
    [Roles.MANAGER]: 3,
    [Roles.BARISTA]: 2,
    [Roles.USER]: 1
  } as const;

  return roleHierarchy[roleResult.role] >= roleHierarchy[requiredRole];
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(roleResult: RoleCheckResult, roles: UserRole[]): boolean {
  return roles.some(role => hasRole(roleResult, role));
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(roleResult: RoleCheckResult): boolean {
  return roleResult.isAdmin;
}

/**
 * Simple role check for components (cached)
 */
export function quickRoleCheck(user: User | null): { role: UserRole; isAdmin: boolean } {
  if (!user) return { role: null, isAdmin: false };

  // Quick check using metadata (for immediate UI decisions)
  const role = user.user_metadata?.role || user.app_metadata?.role || null;
  const validRole = role && isRole(role) ? role : null;
  return {
    role: validRole,
    isAdmin: validRole === Roles.ADMIN
  };
}