import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, Settings, BookOpen, Coffee, Users, Package, 
  TrendingUp, HelpCircle, GraduationCap, UserPlus,
  Menu, X
} from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { useSmartNavigation } from "@/utils/routing/redirects";
import { useAdminGuard } from "@/hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { activeLocation } = useLocationContext();
  const { isAdmin } = useAdminGuard();
  const { currentTenantSlug, canNavigate } = useSmartNavigation();

  // Determine if we're in tenant context or not
  const isInTenantContext = location.pathname.startsWith('/tenants/');
  const isInAdminContext = location.pathname.startsWith('/admin/');

  // Build navigation items based on context
  const getTenantNavItems = () => {
    if (!currentTenantSlug || !canNavigate) return [];

    return [
      {
        title: "Dashboard",
        url: `/tenants/${currentTenantSlug}/dashboard/overview`,
        icon: Home,
        group: "main"
      },
      {
        title: "Recetas",
        url: `/tenants/${currentTenantSlug}/operations/recipes`,
        icon: Coffee,
        group: "operations"
      },
      {
        title: "Consumo",
        url: `/tenants/${currentTenantSlug}/operations/consumption`,
        icon: TrendingUp,
        group: "operations"
      },
      {
        title: "Mi Equipo",
        url: `/tenants/${currentTenantSlug}/operations/staff`,
        icon: Users,
        group: "operations"
      },
      {
        title: "Reposición",
        url: `/tenants/${currentTenantSlug}/operations/inventory`,
        icon: Package,
        group: "operations"
      },
      {
        title: "Academia",
        url: `/tenants/${currentTenantSlug}/academy`,
        icon: GraduationCap,
        group: "learning"
      },
      {
        title: "Recursos",
        url: `/tenants/${currentTenantSlug}/operations/resources`,
        icon: BookOpen,
        group: "learning"
      },
      {
        title: "FAQ",
        url: `/tenants/${currentTenantSlug}/faq`,
        icon: HelpCircle,
        group: "support"
      }
    ];
  };

  const getAdminNavItems = () => [
    {
      title: "Integraciones",
      url: "/admin/integrations",
      icon: Settings,
      group: "admin"
    },
    {
      title: "Cursos",
      url: "/admin/courses", 
      icon: GraduationCap,
      group: "admin"
    },
    {
      title: "Asesorías",
      url: "/admin/advisory",
      icon: UserPlus,
      group: "admin"
    }
  ];

  const getLegacyNavItems = () => [
    {
      title: "Dashboard",
      url: "/app",
      icon: Home,
      group: "main"
    },
    {
      title: "Recetas", 
      url: "/app/recetas",
      icon: Coffee,
      group: "main"
    },
    {
      title: "Academia",
      url: "/app/academia", 
      icon: GraduationCap,
      group: "main"
    },
    {
      title: "Consumo",
      url: "/app/consumo",
      icon: TrendingUp,
      group: "main"
    },
    {
      title: "Recursos",
      url: "/app/recursos",
      icon: BookOpen,
      group: "secondary"
    },
    {
      title: "Mi Equipo",
      url: "/app/mi-equipo",
      icon: Users,
      group: "secondary"
    },
    {
      title: "Reposición",
      url: "/app/reposicion",
      icon: Package,
      group: "secondary"
    },
    {
      title: "FAQ",
      url: "/app/faq",
      icon: HelpCircle,
      group: "support"
    }
  ];

  // Select appropriate navigation items
  const navItems = isInTenantContext 
    ? getTenantNavItems()
    : isInAdminContext 
    ? getAdminNavItems()
    : getLegacyNavItems();

  return (
    <div className={cn(
      "bg-gradient-primary text-white transition-all duration-300 h-screen sticky top-0 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-secondary" />
              <span className="text-xl font-bold">TUPÁ Hub</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-white/10 ml-auto"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Location info for tenant context */}
        {isInTenantContext && activeLocation && !isCollapsed && (
          <div className="px-3 py-2 text-xs text-white/70 border-b border-white/10 mb-4">
            <div className="font-medium">{activeLocation.name}</div>
            {activeLocation.address && (
              <div className="truncate">{activeLocation.address}</div>
            )}
          </div>
        )}

        {/* Navigation items */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={({ isActive: linkActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                  "hover:bg-white/10",
                  (linkActive || isActive) && "bg-secondary shadow-warm",
                  isCollapsed && "justify-center"
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">{item.title}</span>
              )}
            </NavLink>
          );
        })}

        {/* Admin access */}
        {isAdmin && !isInAdminContext && (
          <div className="border-t border-white/10 pt-2 mt-2">
            <NavLink
              to="/admin"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/10"
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Admin</span>}
            </NavLink>
          </div>
        )}

        {/* Context switching for legacy routes */}
        {!isInTenantContext && !isInAdminContext && activeLocation?.slug && (
          <div className="border-t border-white/10 pt-2 mt-2">
            <NavLink
              to={`/tenants/${activeLocation.slug}/dashboard/overview`}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/10"
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Nueva Experiencia</span>}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed && (
          <div className="text-sm text-white/70">
            <p className="font-medium">
              {isInTenantContext && activeLocation ? activeLocation.name : 'Café TUPÁ'}
            </p>
            <p>Plan Premium</p>
          </div>
        )}
      </div>
    </div>
  );
}