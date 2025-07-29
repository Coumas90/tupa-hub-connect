import React, { useState } from 'react';
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, Settings, BookOpen, Coffee, Users, Package, 
  TrendingUp, HelpCircle, GraduationCap, UserPlus,
  Menu, X, ChevronDown, Building, MapPin, Crown, Shield
} from "lucide-react";
import { useLocationContext } from "@/contexts/LocationContext";
import { useSmartNavigation } from "@/utils/routing/redirects";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  group?: string;
  badge?: string;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export function AdaptiveSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    main: true,
    operations: true,
    learning: false,
    support: false
  });
  
  const location = useLocation();
  const { activeLocation } = useLocationContext();
  const { 
    userRole, 
    isAdmin, 
    canAccessTenantFeatures, 
    canAccessAdminFeatures 
  } = useEnhancedAuth();
  const { currentTenantSlug, canNavigate } = useSmartNavigation();

  // Determine current context
  const isInTenantContext = location.pathname.startsWith('/tenants/');
  const isInAdminContext = location.pathname.startsWith('/admin/');

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const getRoleIcon = () => {
    if (isAdmin) return <Shield className="h-3 w-3" />;
    switch (userRole?.toLowerCase()) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'manager': return <Users className="h-3 w-3" />;
      case 'barista': return <Coffee className="h-3 w-3" />;
      default: return <Building className="h-3 w-3" />;
    }
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrador';
    switch (userRole?.toLowerCase()) {
      case 'owner': return 'Propietario';
      case 'manager': return 'Encargado';
      case 'barista': return 'Barista';
      case 'client': return 'Cliente';
      default: return 'Usuario';
    }
  };

  const getNavGroups = (): NavGroup[] => {
    if (isInAdminContext || canAccessAdminFeatures) {
      return [
        {
          label: "Administración",
          defaultOpen: true,
          items: [
            {
              title: "Dashboard",
              url: "/admin/dashboard",
              icon: Home,
            },
            {
              title: "Operaciones",
              url: "/admin/operations",
              icon: Settings,
              children: [
                { title: "POS Systems", url: "/admin/operations/pos", icon: Package },
                { title: "Odoo Integration", url: "/admin/operations/odoo", icon: Package },
                { title: "Integraciones", url: "/admin/operations/integrations", icon: Package }
              ]
            },
            {
              title: "Academia",
              url: "/admin/academy",
              icon: GraduationCap,
              children: [
                { title: "Cursos", url: "/admin/academy/courses", icon: BookOpen },
                { title: "Instructores", url: "/admin/academy/instructors", icon: Users }
              ]
            },
            {
              title: "Asesorías",
              url: "/admin/advisory",
              icon: UserPlus,
              badge: "3"
            }
          ]
        }
      ];
    }

    if (isInTenantContext && canNavigate) {
      const baseItems: NavItem[] = [
        {
          title: "Dashboard",
          url: `/tenants/${currentTenantSlug}/dashboard/overview`,
          icon: Home,
        }
      ];

      // Add role-specific dashboard views
      if (userRole?.toLowerCase() === 'owner') {
        baseItems.push({
          title: "Vista Propietario",
          url: `/tenants/${currentTenantSlug}/dashboard/owner`,
          icon: Crown,
        });
      } else if (userRole?.toLowerCase() === 'manager') {
        baseItems.push({
          title: "Vista Encargado",
          url: `/tenants/${currentTenantSlug}/dashboard/manager`,
          icon: Users,
        });
      } else if (userRole?.toLowerCase() === 'barista') {
        baseItems.push({
          title: "Vista Barista",
          url: `/tenants/${currentTenantSlug}/dashboard/barista`,
          icon: Coffee,
        });
      }

      const operationsItems: NavItem[] = [
        {
          title: "Recetas",
          url: `/tenants/${currentTenantSlug}/operations/recipes`,
          icon: Coffee,
        },
        {
          title: "Consumo",
          url: `/tenants/${currentTenantSlug}/operations/consumption`,
          icon: TrendingUp,
        }
      ];

      // Add management-only items
      if (['owner', 'manager'].includes(userRole?.toLowerCase() || '')) {
        operationsItems.push(
          {
            title: "Mi Equipo",
            url: `/tenants/${currentTenantSlug}/operations/staff`,
            icon: Users,
          },
          {
            title: "Reposición",
            url: `/tenants/${currentTenantSlug}/operations/inventory`,
            icon: Package,
          }
        );
      }

      operationsItems.push({
        title: "Recursos",
        url: `/tenants/${currentTenantSlug}/operations/resources`,
        icon: BookOpen,
      });

      return [
        {
          label: "Principal",
          defaultOpen: true,
          items: baseItems
        },
        {
          label: "Operaciones",
          defaultOpen: true,
          items: operationsItems
        },
        {
          label: "Aprendizaje",
          defaultOpen: false,
          items: [
            {
              title: "Academia",
              url: `/tenants/${currentTenantSlug}/academy`,
              icon: GraduationCap,
              badge: userRole?.toLowerCase() === 'barista' ? "3" : undefined
            }
          ]
        },
        {
          label: "Soporte",
          defaultOpen: false,
          items: [
            {
              title: "FAQ",
              url: `/tenants/${currentTenantSlug}/faq`,
              icon: HelpCircle,
            }
          ]
        }
      ];
    }

    // Legacy navigation
    return [
      {
        label: "Principal",
        defaultOpen: true,
        items: [
          {
            title: "Dashboard",
            url: "/app",
            icon: Home,
          }
        ]
      },
      {
        label: "Operaciones",
        defaultOpen: true,
        items: [
          {
            title: "Recetas",
            url: "/app/recetas",
            icon: Coffee,
          },
          {
            title: "Consumo",
            url: "/app/consumo",
            icon: TrendingUp,
          },
          {
            title: "Mi Equipo",
            url: "/app/mi-equipo",
            icon: Users,
          },
          {
            title: "Reposición",
            url: "/app/reposicion",
            icon: Package,
          },
          {
            title: "Recursos",
            url: "/app/recursos",
            icon: BookOpen,
          }
        ]
      },
      {
        label: "Aprendizaje",
        defaultOpen: false,
        items: [
          {
            title: "Academia",
            url: "/app/academia",
            icon: GraduationCap,
          }
        ]
      },
      {
        label: "Soporte",
        defaultOpen: false,
        items: [
          {
            title: "FAQ",
            url: "/app/faq",
            icon: HelpCircle,
          }
        ]
      }
    ];
  };

  const navGroups = getNavGroups();

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = location.pathname === item.url || 
      (item.children && item.children.some(child => location.pathname === child.url));
    
    const hasChildren = item.children && item.children.length > 0;
    const itemId = `nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`;

    if (hasChildren) {
      return (
        <Collapsible key={item.title} open={expandedGroups[itemId]} onOpenChange={() => toggleGroup(itemId)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left font-normal",
                level > 0 && "pl-8",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center space-x-3 flex-1">
                <item.icon className="h-4 w-4" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      expandedGroups[itemId] && "transform rotate-180"
                    )} />
                  </>
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <NavLink
        key={item.title}
        to={item.url}
        className={({ isActive }) =>
          cn(
            "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:accent-foreground",
            level > 0 && "pl-8",
            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
          )
        }
      >
        <item.icon className="h-4 w-4" />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <div className={cn(
      "flex h-screen bg-background border-r transition-all duration-300",
      isCollapsed ? "w-14" : "w-64"
    )}>
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* User Context */}
        {!isCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                {getRoleIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {getRoleLabel()}
                </div>
                {activeLocation && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{activeLocation.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                  {group.label}
                </h2>
              )}
              <div className="space-y-1">
                {group.items.map(item => renderNavItem(item))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-xs font-medium">TUPÁ Hub</div>
                <div className="text-xs text-muted-foreground">
                  {isInTenantContext ? activeLocation?.name || 'Ubicación' : 'Sistema Integral'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Coffee className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}