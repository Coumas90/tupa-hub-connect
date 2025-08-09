import { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { Roles, Role, isRole } from '@/constants/roles';

export interface UserWithRole {
  user: User | null;
  role: Role | null;
  orgId: string | null;
  locationId: string | null;
  groupName: string | null;
  locationName: string | null;
  isAdmin: boolean;
  permissions: string[];
  isLoading: boolean;
  canAccessAdmin: boolean;
  canAccessTenant: boolean;
  orgSlug: string | null;
}

interface UserContext {
  user_id: string;
  email: string;
  role: string;
  org_id: string;
  location_id: string;
  group_name: string;
  location_name: string;
  is_admin: boolean;
}

/**
 * Hook principal para obtener usuario con rol y contexto organizacional
 * Reemplaza lógica dispersa de autenticación y roles
 */
export function useUserWithRole(): UserWithRole {
  const { user, loading: authLoading } = useAuth();
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user context when user changes
  useEffect(() => {
    async function fetchUserContext() {
      if (!user) {
        setUserContext(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Call the new Supabase function to get full user context
        const { data, error } = await supabase
          .rpc('get_user_full_context', { _user_id: user.id });

        if (error) {
          console.error('Error fetching user context:', error);
          setUserContext(null);
        } else if (data && data.length > 0) {
          setUserContext(data[0] as UserContext);
        } else {
          setUserContext(null);
        }
      } catch (error) {
        console.error('Error in fetchUserContext:', error);
        setUserContext(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserContext();
  }, [user]);

  // Memoized computed values
  const computedValues = useMemo(() => {
    // Quick admin check from metadata while DB loads
    const metadataAdmin = user?.user_metadata?.role === Roles.ADMIN || user?.app_metadata?.role === Roles.ADMIN;
    const role = userContext && isRole(userContext.role) ? userContext.role as Role : null;
    const isAdmin = userContext?.is_admin || role === Roles.ADMIN || metadataAdmin;
    const orgId = userContext?.org_id || null;
    const locationId = userContext?.location_id || null;
    
    // Generate org slug from group name
    const orgSlug = userContext?.group_name 
      ? userContext.group_name.toLowerCase().replace(/\s+/g, '-')
      : null;

    // Permissions based on role
    const permissions: string[] = [];
    if (isAdmin) {
      permissions.push('admin:all', 'tenant:all', 'user:all');
    } else if (role === Roles.OWNER) {
      permissions.push('tenant:manage', 'user:manage', 'data:read');
    } else if (role === Roles.MANAGER) {
      permissions.push('tenant:read', 'user:read', 'data:read');
    } else if (role === Roles.BARISTA) {
      permissions.push('recipes:read', 'consumption:create');
    }

    return {
      role,
      orgId,
      locationId,
      groupName: userContext?.group_name || null,
      locationName: userContext?.location_name || null,
      isAdmin,
      permissions,
      canAccessAdmin: isAdmin,
    canAccessTenant: !!orgId && !isAdmin,
      orgSlug,
      isLoading: authLoading || (loading && !metadataAdmin)
    };
  }, [userContext, authLoading, loading, user]);

  return {
    user,
    ...computedValues
  };
}

/**
 * Hook para validar si el usuario puede acceder a una organización específica
 */
export function useOrgAccess(targetOrgId: string | null) {
  const { orgId, isAdmin, isLoading } = useUserWithRole();
  
  return useMemo(() => ({
    canAccess: isAdmin || (orgId === targetOrgId),
    isLoading,
    reason: !isAdmin && orgId !== targetOrgId ? 'wrong_org' : null
  }), [orgId, targetOrgId, isAdmin, isLoading]);
}

/**
 * Hook para obtener la URL de redirección correcta según el rol del usuario
 */
export function useUserRedirectUrl(): string | null {
  const { role, isAdmin, orgSlug, isLoading } = useUserWithRole();
  
  return useMemo(() => {
    if (isLoading) return null;
    
    if (isAdmin) {
      return '/admin/dashboard';
    }
    
    if (!orgSlug) {
      return '/onboarding'; // Usuario sin organización asignada
    }
    
    switch (role) {
      case Roles.OWNER:
        return `/org/${orgSlug}/owner/dashboard`;
      case Roles.MANAGER:
        return `/org/${orgSlug}/staff/dashboard`;
      case Roles.BARISTA:
        return `/org/${orgSlug}/staff/dashboard`;
      default:
        return `/org/${orgSlug}/dashboard`;
    }
  }, [role, isAdmin, orgSlug, isLoading]);
}