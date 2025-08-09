import React from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserRole } from '@/utils/authRoleUtils';
import { Roles, Role } from '@/constants/roles';

export interface AuthValidationResult {
  isValid: boolean;
  redirectTo?: string;
  reason?: string;
  userRole?: Role | null;
  orgId?: string;
}

export interface RouteProtection {
  requireAuth?: boolean;
  allowedRoles?: Role[];
  requireOrgAccess?: boolean;
  adminOnly?: boolean;
  tenantOnly?: boolean;
}

/**
 * Middleware central para validación de autenticación y roles
 * Similar a Next.js middleware pero para React SPA
 */
export class AuthMiddleware {
  private static userContextCache = new Map<string, any>();
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Valida si el usuario puede acceder a una ruta específica
   */
  static async validateRouteAccess(
    user: User | null,
    session: Session | null,
    routePath: string,
    protection: RouteProtection = {}
  ): Promise<AuthValidationResult> {
    // No auth required
    if (!protection.requireAuth) {
      return { isValid: true };
    }

    // Not authenticated
    if (!user || !session) {
      return {
        isValid: false,
        redirectTo: routePath.startsWith('/admin') ? '/admin/login' : '/login',
        reason: 'not_authenticated'
      };
    }

    // Determine admin route and role early
    const isAdminRoute = routePath.startsWith('/admin') || !!protection.adminOnly;
    const roleResult = await (async () => {
      try {
        return await getUserRole(user);
      } catch {
        return { isAdmin: false, role: null } as any;
      }
    })();

    // If accessing admin routes and user is admin, bypass org/location checks
    if (isAdminRoute && roleResult?.isAdmin) {
      if (routePath.startsWith('/admin/login')) {
        return { isValid: true, redirectTo: '/admin/dashboard', userRole: Roles.ADMIN };
      }
      return { isValid: true, userRole: Roles.ADMIN };
    }

    // For non-admins or non-admin routes, fetch user context
    const userContext = await this.getUserContext(user.id);
    if (!userContext) {
      // Never send admins to onboarding; non-admins only
      return {
        isValid: false,
        redirectTo: isAdminRoute ? '/admin/login' : '/onboarding',
        reason: 'no_user_context'
      };
    }

    const { role, org_id: orgId, is_admin: isAdmin } = userContext;

    // Admin-only routes
    if (protection.adminOnly && !isAdmin) {
      return {
        isValid: false,
        redirectTo: orgId ? `/org/${this.getOrgSlug(userContext)}/dashboard` : '/dashboard',
        reason: 'insufficient_permissions'
      };
    }

    // Tenant-only routes (non-admin users)
    if (protection.tenantOnly && isAdmin) {
      return {
        isValid: false,
        redirectTo: '/admin/dashboard',
        reason: 'admin_redirect'
      };
    }

    // Role-based access
    if (protection.allowedRoles && !protection.allowedRoles.includes(role)) {
      return {
        isValid: false,
        redirectTo: this.getDefaultRouteForRole(role, orgId, userContext),
        reason: 'role_not_allowed'
      };
    }

    // Org access validation for tenant routes
    if (protection.requireOrgAccess) {
      const orgSlugFromPath = this.extractOrgSlugFromPath(routePath);
      const userOrgSlug = this.getOrgSlug(userContext);
      
      if (orgSlugFromPath && userOrgSlug !== orgSlugFromPath && !isAdmin) {
        return {
          isValid: false,
          redirectTo: `/org/${userOrgSlug}/dashboard`,
          reason: 'wrong_organization'
        };
      }
    }

    return {
      isValid: true,
      userRole: role,
      orgId
    };
  }

  /**
   * Obtiene el contexto completo del usuario (con caché)
   */
  private static async getUserContext(userId: string): Promise<any> {
    const cacheKey = `user_context_${userId}`;
    const cached = this.userContextCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_full_context', { _user_id: userId });

      if (error) {
        console.error('Error fetching user context:', error);
        return null;
      }

      const context = data?.[0] || null;
      
      // Cache the result
      this.userContextCache.set(cacheKey, {
        data: context,
        timestamp: Date.now()
      });

      return context;
    } catch (error) {
      console.error('Error in getUserContext:', error);
      return null;
    }
  }

  /**
   * Obtiene el slug de la organización desde el contexto del usuario
   */
  private static getOrgSlug(userContext: any): string {
    return userContext?.group_name?.toLowerCase().replace(/\s+/g, '-') || '';
  }

  /**
   * Extrae el orgSlug de la ruta
   */
  private static extractOrgSlugFromPath(path: string): string | null {
    const match = path.match(/^\/org\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Obtiene la ruta por defecto según el rol del usuario
   */
  private static getDefaultRouteForRole(role: string, orgId: string, userContext: any): string {
    if (role === Roles.ADMIN) {
      return '/admin/dashboard';
    }

    if (!orgId) {
      return '/onboarding';
    }

    const orgSlug = this.getOrgSlug(userContext);

    switch (role) {
      case Roles.OWNER:
        return `/org/${orgSlug}/owner/dashboard`;
      case Roles.MANAGER:
      case Roles.BARISTA:
        return `/org/${orgSlug}/staff/dashboard`;
      default:
        return `/org/${orgSlug}/dashboard`;
    }
  }

  /**
   * Limpia la caché del usuario (útil para logout)
   */
  static clearUserCache(userId?: string) {
    if (userId) {
      this.userContextCache.delete(`user_context_${userId}`);
    } else {
      this.userContextCache.clear();
    }
  }

  /**
   * Registra eventos de seguridad
   */
  static async logSecurityEvent(
    eventType: string,
    userId: string | null,
    details: Record<string, any>
  ) {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_user_id: userId,
        p_details: details,
        p_severity: 'medium'
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}
