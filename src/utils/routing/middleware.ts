import { NavigateFunction, Location } from 'react-router-dom';
import { routeUtils } from './helpers';

/**
 * Route middleware for logging, analytics, and monitoring
 */

interface RouteChangeEvent {
  from: string;
  to: string;
  timestamp: number;
  userAgent: string;
  locationSlug?: string;
  userId?: string;
}

interface RouteMiddleware {
  onRouteChange?: (event: RouteChangeEvent) => void;
  onTenantSwitch?: (event: { from: string; to: string; locationSlug: string }) => void;
  onAdminAccess?: (event: { route: string; userId?: string }) => void;
}

class RouteLogger {
  private static instance: RouteLogger;
  private middleware: RouteMiddleware[] = [];
  private lastRoute: string = '';

  static getInstance(): RouteLogger {
    if (!RouteLogger.instance) {
      RouteLogger.instance = new RouteLogger();
    }
    return RouteLogger.instance;
  }

  addMiddleware(middleware: RouteMiddleware) {
    this.middleware.push(middleware);
  }

  removeMiddleware(middleware: RouteMiddleware) {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
    }
  }

  logRouteChange(location: Location, userId?: string) {
    const currentRoute = location.pathname;
    const locationSlug = routeUtils.extractLocationSlug(currentRoute);
    
    const event: RouteChangeEvent = {
      from: this.lastRoute,
      to: currentRoute,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      locationSlug: locationSlug || undefined,
      userId,
    };

    // Execute middleware
    this.middleware.forEach(middleware => {
      try {
        // Route change logging
        middleware.onRouteChange?.(event);

        // Tenant switching detection
        if (locationSlug && this.lastRoute) {
          const lastLocationSlug = routeUtils.extractLocationSlug(this.lastRoute);
          if (lastLocationSlug && lastLocationSlug !== locationSlug) {
            middleware.onTenantSwitch?.({
              from: lastLocationSlug,
              to: locationSlug,
              locationSlug,
            });
          }
        }

        // Admin access logging
        if (routeUtils.isAdminRoute(currentRoute)) {
          middleware.onAdminAccess?.({
            route: currentRoute,
            userId,
          });
        }
      } catch (error) {
        console.error('Route middleware error:', error);
      }
    });

    this.lastRoute = currentRoute;
  }

  // Built-in analytics middleware
  static createAnalyticsMiddleware(): RouteMiddleware {
    return {
      onRouteChange: (event) => {
        // Send to analytics service
        if (window.gtag) {
          window.gtag('config', 'GA_MEASUREMENT_ID', {
            page_path: event.to,
            custom_map: {
              tenant: event.locationSlug,
            },
          });
        }

        // Send to custom analytics
        fetch('/api/analytics/route-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: event.to,
            previousRoute: event.from,
            timestamp: event.timestamp,
            locationSlug: event.locationSlug,
            userId: event.userId,
          }),
        }).catch(console.error);
      },

      onTenantSwitch: (event) => {
        console.log(`Tenant switched: ${event.from} → ${event.to}`);
        
        // Send tenant switch event
        fetch('/api/analytics/tenant-switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        }).catch(console.error);
      },

      onAdminAccess: (event) => {
        console.log(`Admin route accessed: ${event.route}`);
        
        // Log admin access for security monitoring
        fetch('/api/security/admin-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: event.route,
            userId: event.userId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
          }),
        }).catch(console.error);
      },
    };
  }

  // Built-in error tracking middleware
  static createErrorTrackingMiddleware(): RouteMiddleware {
    return {
      onRouteChange: (event) => {
        // Track route performance
        if ('performance' in window && 'mark' in performance) {
          performance.mark(`route-start-${event.to}`);
        }
      },
    };
  }

  // Built-in security middleware
  static createSecurityMiddleware(): RouteMiddleware {
    return {
      onAdminAccess: (event) => {
        // Enhanced security logging for admin routes
        if (window.Sentry) {
          window.Sentry.addBreadcrumb({
            message: 'Admin route accessed',
            category: 'navigation',
            level: 'info',
            data: {
              route: event.route,
              userId: event.userId,
            },
          });
        }
      },

      onTenantSwitch: (event) => {
        // Log tenant switches for potential security analysis
        console.log('Tenant context switch logged for security audit');
      },
    };
  }
}

export const routeLogger = RouteLogger.getInstance();

// Initialize default middleware
routeLogger.addMiddleware(RouteLogger.createAnalyticsMiddleware());
routeLogger.addMiddleware(RouteLogger.createErrorTrackingMiddleware());
routeLogger.addMiddleware(RouteLogger.createSecurityMiddleware());

/**
 * Hook to integrate route logging with React Router
 */
export function useRouteLogging(userId?: string) {
  return {
    logRouteChange: (location: Location) => {
      routeLogger.logRouteChange(location, userId);
    },
  };
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    Sentry?: {
      addBreadcrumb: (breadcrumb: any) => void;
    };
  }
}