/**
 * Centralized route constants for type-safe navigation
 * Organized by functional domain with consistent naming conventions
 */

// ===== PUBLIC ROUTES =====
export const PUBLIC_ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth',
    RESET: '/auth/reset',
    ACTIVATE: '/activate-account',
  },
  FEEDBACK: '/public/feedback/:locationSlug',
} as const;

// ===== TENANT ROUTES =====
export const TENANT_ROUTES = {
  ROOT: '/tenants/:locationSlug',
  DASHBOARD: {
    ROOT: '/tenants/:locationSlug/dashboard',
    OVERVIEW: '/tenants/:locationSlug/dashboard/overview',
    OWNER: '/tenants/:locationSlug/dashboard/owner',
    MANAGER: '/tenants/:locationSlug/dashboard/manager',
    BARISTA: '/tenants/:locationSlug/dashboard/barista',
  },
  OPERATIONS: {
    ROOT: '/tenants/:locationSlug/operations',
    CONSUMPTION: '/tenants/:locationSlug/operations/consumption',
    RECIPES: '/tenants/:locationSlug/operations/recipes',
    STAFF: '/tenants/:locationSlug/operations/staff',
    INVENTORY: '/tenants/:locationSlug/operations/inventory',
    RESOURCES: '/tenants/:locationSlug/operations/resources',
  },
  ACADEMY: {
    ROOT: '/tenants/:locationSlug/academy',
    COURSES: '/tenants/:locationSlug/academy/courses',
  },
  BARISTA_POOL: '/tenants/:locationSlug/barista-pool',
  FAQ: '/tenants/:locationSlug/faq',
} as const;

// ===== ADMIN ROUTES =====
export const ADMIN_ROUTES = {
  ROOT: '/admin',
  DASHBOARD: {
    ROOT: '/admin/dashboard',
    ANALYTICS: '/admin/dashboard/analytics',
    ALERTS: '/admin/dashboard/alerts',
  },
  TENANTS: {
    ROOT: '/admin/tenants',
    LOCATIONS: '/admin/tenants/locations',
    MIGRATION: '/admin/tenants/migration',
    MONITORING: '/admin/tenants/monitoring',
  },
  OPERATIONS: {
    ROOT: '/admin/operations',
    CONSUMPTION: '/admin/operations/consumption',
    POS: '/admin/operations/pos',
    ODOO: '/admin/operations/odoo',
  },
  ENGAGEMENT: {
    ROOT: '/admin/engagement',
    FEEDBACK: '/admin/engagement/feedback',
    CAMPAIGNS: '/admin/engagement/campaigns',
    QR: '/admin/engagement/qr',
  },
  ACADEMY: {
    ROOT: '/admin/academy',
    COURSES: '/admin/academy/courses',
    PROGRESS: '/admin/academy/progress',
    INSTRUCTORS: '/admin/academy/instructors',
  },
  ADVISORY: {
    ROOT: '/admin/advisory',
    REQUESTS: '/admin/advisory/requests',
    SCHEDULE: '/admin/advisory/schedule',
    REPORTS: '/admin/advisory/reports',
  },
  SYSTEM: {
    ROOT: '/admin/system',
    SETTINGS: '/admin/system/settings',
    USERS: '/admin/system/users',
    AUDIT: '/admin/system/audit',
  },
  // Legacy compatibility
  INTEGRATIONS: '/admin/operations/pos',
  COURSES: '/admin/academy/courses',
  MONITORING: '/admin/tenants/monitoring',
} as const;

// ===== LEGACY ROUTES (for redirects only) =====
export const LEGACY_ROUTES = {
  APP: '/app',
  RECIPES: '/recipes',
  LOCATION_DASHBOARD: '/location/dashboard/:locationId',
  FEEDBACK_LEGACY: '/feedback/:locationId',
} as const;

// ===== ROLE DEFINITIONS =====
export const USER_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  BARISTA: 'barista',
  USER: 'user',
} as const;

// ===== ROLE PERMISSIONS =====
export const ROUTE_PERMISSIONS = {
  PUBLIC: [],
  ALL_AUTHENTICATED: [USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.MANAGER, USER_ROLES.BARISTA, USER_ROLES.USER],
  MANAGEMENT: [USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.MANAGER],
  ADMIN_ONLY: [USER_ROLES.ADMIN],
  OWNER_ONLY: [USER_ROLES.ADMIN, USER_ROLES.OWNER],
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type RoutePermission = typeof ROUTE_PERMISSIONS[keyof typeof ROUTE_PERMISSIONS];