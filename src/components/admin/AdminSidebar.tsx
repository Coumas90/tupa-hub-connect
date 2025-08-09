import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Coffee, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_NAVIGATION, getNavItemsForRole } from "@/constants/adminNavigation";
import { useRequireAdmin } from "@/hooks/useOptimizedAuth";
import { Roles } from "@/constants/roles";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['DASHBOARD']);
  const location = useLocation();
  const { isAdmin } = useRequireAdmin();
  
  // Mock user role - in real app this would come from auth context
  const userRole = isAdmin ? Roles.ADMIN : Roles.USER;
  const navGroups = getNavItemsForRole(userRole);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupKey) 
        ? prev.filter(key => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  const isGroupExpanded = (groupKey: string) => expandedGroups.includes(groupKey);
  
  const isPathActive = (path: string) => {
    if (path === '/admin/dashboard' && location.pathname === '/admin') return true;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getActiveGroupKey = () => {
    for (const [groupKey, group] of Object.entries(ADMIN_NAVIGATION)) {
      if (group.items.some(item => isPathActive(item.path))) {
        return groupKey;
      }
    }
    return null;
  };

  // Ensure active group is expanded
  const activeGroupKey = getActiveGroupKey();
  if (activeGroupKey && !expandedGroups.includes(activeGroupKey)) {
    setExpandedGroups(prev => [...prev, activeGroupKey]);
  }

  return (
    <div className={cn(
      "bg-gradient-primary text-white transition-all duration-300 h-screen sticky top-0 flex flex-col border-r border-white/10",
      isCollapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-secondary" />
              <div>
                <span className="text-xl font-bold block">TUPÁ Hub</span>
                <span className="text-xs text-white/70">Admin Panel</span>
              </div>
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
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navGroups.map(group => {
          const groupKey = Object.keys(ADMIN_NAVIGATION).find(
            key => ADMIN_NAVIGATION[key] === group
          ) || '';
          
          const isExpanded = isGroupExpanded(groupKey);
          const hasActiveItem = group.items.some(item => isPathActive(item.path));

          if (isCollapsed) {
            // Collapsed view - show icons only
            return (
              <div key={groupKey} className="space-y-1">
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-center p-2.5 rounded-lg transition-colors",
                        "hover:bg-white/10 group relative",
                        (isActive || isPathActive(item.path)) && "bg-secondary shadow-warm"
                      )
                    }
                    title={item.title}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {/* Tooltip on hover */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                      {item.title}
                    </div>
                  </NavLink>
                ))}
              </div>
            );
          }

          return (
            <Collapsible
              key={groupKey}
              open={isExpanded}
              onOpenChange={() => toggleGroup(groupKey)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between p-3 h-auto text-left hover:bg-white/10",
                    hasActiveItem && "bg-white/5"
                  )}
                >
                  <div>
                    <div className="font-medium text-sm">{group.title}</div>
                    {group.description && (
                      <div className="text-xs text-white/70 mt-0.5">
                        {group.description}
                      </div>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-white/70" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-1 mt-1 ml-3">
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                        "hover:bg-white/10",
                        (isActive || isPathActive(item.path)) && "bg-secondary shadow-warm font-medium"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <div>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-white/60 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <div className="text-sm text-white/70">
            <p className="font-medium">Admin Panel</p>
            <p>Sistema TUPÁ Hub</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Coffee className="h-5 w-5 text-white/70" />
          </div>
        )}
      </div>
    </div>
  );
}