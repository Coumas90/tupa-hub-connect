import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { 
  Home, Coffee, TrendingUp, Users, Package, BookOpen, 
  HelpCircle, GraduationCap, Settings, Crown, Shield
} from "lucide-react";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useLocationContext } from '@/contexts/LocationContext';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ElementType;
}

export function SmartBreadcrumbs() {
  const location = useLocation();
  const { userRole, isAdmin } = useEnhancedAuth();
  const { activeLocation } = useLocationContext();

  const getIconForPath = (path: string): React.ElementType => {
    if (path.includes('dashboard')) return Home;
    if (path.includes('recipes')) return Coffee;
    if (path.includes('consumption')) return TrendingUp;
    if (path.includes('staff')) return Users;
    if (path.includes('inventory')) return Package;
    if (path.includes('resources')) return BookOpen;
    if (path.includes('academy')) return GraduationCap;
    if (path.includes('faq')) return HelpCircle;
    if (path.includes('admin')) return Settings;
    if (path.includes('owner')) return Crown;
    if (path.includes('manager')) return Shield;
    return Home;
  };

  const getRoleBasedLabel = (segment: string): string => {
    const labelMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'overview': 'Resumen General',
      'owner': 'Vista Propietario',
      'manager': 'Vista Encargado',
      'barista': 'Vista Barista',
      'operations': 'Operaciones',
      'recipes': 'Recetas',
      'consumption': 'Consumo',
      'staff': 'Mi Equipo',
      'inventory': 'Reposición',
      'resources': 'Recursos',
      'academy': 'Academia',
      'faq': 'FAQ',
      'admin': 'Administración',
      'tenants': 'Ubicaciones',
      'app': 'Aplicación'
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push({
      label: 'Inicio',
      path: '/',
      icon: Home
    });

    // Handle different route structures
    if (pathSegments[0] === 'tenants' && pathSegments[1]) {
      // Tenant routes: /tenants/:slug/...
      const locationSlug = pathSegments[1];
      const locationName = activeLocation?.name || locationSlug;

      breadcrumbs.push({
        label: locationName,
        path: `/tenants/${locationSlug}`,
        icon: getIconForPath('location')
      });

      // Add subsequent segments
      let currentPath = `/tenants/${locationSlug}`;
      for (let i = 2; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        
        breadcrumbs.push({
          label: getRoleBasedLabel(segment),
          path: currentPath,
          icon: getIconForPath(currentPath)
        });
      }
    } else if (pathSegments[0] === 'admin') {
      // Admin routes: /admin/...
      breadcrumbs.push({
        label: 'Administración',
        path: '/admin',
        icon: Settings
      });

      let currentPath = '/admin';
      for (let i = 1; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        
        breadcrumbs.push({
          label: getRoleBasedLabel(segment),
          path: currentPath,
          icon: getIconForPath(currentPath)
        });
      }
    } else if (pathSegments[0] === 'app') {
      // Legacy app routes: /app/...
      breadcrumbs.push({
        label: 'Dashboard',
        path: '/app',
        icon: Home
      });

      let currentPath = '/app';
      for (let i = 1; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        
        breadcrumbs.push({
          label: getRoleBasedLabel(segment),
          path: currentPath,
          icon: getIconForPath(currentPath)
        });
      }
    } else {
      // Other routes
      let currentPath = '';
      for (const segment of pathSegments) {
        currentPath += `/${segment}`;
        
        breadcrumbs.push({
          label: getRoleBasedLabel(segment),
          path: currentPath,
          icon: getIconForPath(currentPath)
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbItems = buildBreadcrumbs();

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }

    switch (userRole?.toLowerCase()) {
      case 'owner':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Crown className="h-3 w-3 mr-1" />
            Propietario
          </Badge>
        );
      case 'manager':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Users className="h-3 w-3 mr-1" />
            Encargado
          </Badge>
        );
      case 'barista':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            <Coffee className="h-3 w-3 mr-1" />
            Barista
          </Badge>
        );
      case 'client':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Cliente
          </Badge>
        );
      default:
        return null;
    }
  };

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumbs for root page
  }

  return (
    <div className="flex items-center justify-between py-3 px-6 bg-background border-b">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const IconComponent = item.icon;

            return (
              <React.Fragment key={item.path}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center space-x-2">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      href={item.path}
                      className="flex items-center space-x-2 hover:text-primary transition-colors"
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center space-x-3">
        {getRoleBadge()}
        {activeLocation && (
          <Badge variant="outline" className="text-xs">
            {activeLocation.name}
          </Badge>
        )}
      </div>
    </div>
  );
}
