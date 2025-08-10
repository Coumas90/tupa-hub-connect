/**
 * Admin Panel Navigation Structure
 * Organized by functional domains with role-based access control
 */

import { 
  BarChart3, Users, Settings, Wrench, Heart, GraduationCap, 
  UserCheck, Shield, MapPin, Database, Sparkles, MessageSquare,
  Calendar, FileText, AlertTriangle, Activity, Home
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface AdminNavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  description?: string;
  roles?: string[];
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
  roles?: string[];
  description?: string;
}

export const ADMIN_NAVIGATION: Record<string, AdminNavGroup> = {
  DASHBOARD: {
    title: 'Dashboard',
    description: 'Vista general del sistema',
    items: [
      {
        title: 'Overview',
        path: '/admin/dashboard',
        icon: Home,
        description: 'Resumen general del sistema'
      },
      {
        title: 'Analytics',
        path: '/admin/dashboard/analytics',
        icon: BarChart3,
        description: 'Métricas y análisis de rendimiento'
      },
      {
        title: 'Alerts',
        path: '/admin/dashboard/alerts',
        icon: AlertTriangle,
        description: 'Alertas críticas del sistema'
      }
    ]
  },

  TENANTS: {
    title: 'Tenants & Locations',
    description: 'Gestión de ubicaciones y tenants',
    items: [
      {
        title: 'Location Management',
        path: '/admin/tenants/locations',
        icon: MapPin,
        description: 'Gestión de ubicaciones y cafeterías'
      },
      {
        title: 'Multi-tenant Migration',
        path: '/admin/tenants/migration',
        icon: Database,
        description: 'Migración de datos multi-tenant'
      },
      {
        title: 'Tenant Monitoring',
        path: '/admin/tenants/monitoring',
        icon: Activity,
        description: 'Monitoreo de rendimiento por tenant'
      }
    ]
  },

  OPERATIONS: {
    title: 'Operations',
    description: 'Operaciones y integraciones técnicas',
    items: [
      {
        title: 'Consumption Analytics',
        path: '/admin/operations/consumption',
        icon: BarChart3,
        description: 'Análisis de consumo por ubicación'
      },
      {
        title: 'POS Integrations',
        path: '/admin/operations/pos',
        icon: Wrench,
        description: 'Integraciones con sistemas POS'
      },
      {
        title: 'Odoo Management',
        path: '/admin/operations/odoo',
        icon: Settings,
        description: 'Configuración y gestión de Odoo'
      }
    ]
  },

  ENGAGEMENT: {
    title: 'Customer Engagement',
    description: 'Interacción y experiencia del cliente',
    items: [
      {
        title: 'Feedback Monitoring',
        path: '/admin/engagement/feedback',
        icon: MessageSquare,
        description: 'Monitoreo de feedback de clientes'
      },
      {
        title: 'Giveaways & Campaigns',
        path: '/admin/engagement/campaigns',
        icon: Sparkles,
        description: 'Gestión de sorteos y campañas'
      },
      {
        title: 'QR Management',
        path: '/admin/engagement/qr',
        icon: Activity,
        description: 'Generación y gestión de códigos QR'
      }
    ]
  },

  ACADEMY: {
    title: 'Academy',
    description: 'Gestión educativa y capacitación',
    items: [
      {
        title: 'Course Management',
        path: '/admin/academy/courses',
        icon: GraduationCap,
        description: 'Creación y gestión de cursos'
      },
      {
        title: 'Student Progress',
        path: '/admin/academy/progress',
        icon: BarChart3,
        description: 'Seguimiento del progreso estudiantil'
      },
      {
        title: 'Instructors',
        path: '/admin/academy/instructors',
        icon: UserCheck,
        description: 'Gestión de instructores'
      }
    ]
  },

  ADVISORY: {
    title: 'Advisory Services',
    description: 'Servicios de asesoría y consultoría',
    items: [
      {
        title: 'Requests',
        path: '/admin/advisory/requests',
        icon: FileText,
        description: 'Solicitudes de asesoría'
      },
      {
        title: 'Scheduling',
        path: '/admin/advisory/schedule',
        icon: Calendar,
        description: 'Programación de asesorías'
      },
      {
        title: 'Reports',
        path: '/admin/advisory/reports',
        icon: BarChart3,
        description: 'Reportes de servicios de asesoría'
      }
    ]
  },

  SYSTEM: {
    title: 'System',
    description: 'Configuración y administración del sistema',
    roles: ['admin'],
    items: [
      {
        title: 'Settings',
        path: '/admin/system/settings',
        icon: Settings,
        description: 'Configuración general del sistema'
      },
      {
        title: 'User Management',
        path: '/admin/system/users',
        icon: Users,
        description: 'Gestión de usuarios y roles'
      },
      {
        title: 'Audit Logs',
        path: '/admin/system/audit',
        icon: Shield,
        description: 'Logs de auditoría y seguridad'
      }
    ]
  }
};

// Helper function to get navigation items based on user role
export function getNavItemsForRole(userRole: string): AdminNavGroup[] {
  return Object.values(ADMIN_NAVIGATION).filter(group => 
    !group.roles || group.roles.includes(userRole)
  );
}

// Helper function to check if user can access a specific path
export function canAccessPath(path: string, userRole: string): boolean {
  for (const group of Object.values(ADMIN_NAVIGATION)) {
    const item = group.items.find(item => item.path === path);
    if (item) {
      const requiredRoles = item.roles || group.roles;
      return !requiredRoles || requiredRoles.includes(userRole);
    }
  }
  return false;
}