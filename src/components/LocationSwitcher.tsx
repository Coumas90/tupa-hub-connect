import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationContext } from '@/contexts/LocationContext';
import { useSmartNavigation } from "@/utils/routing/redirects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LocationSwitcher() {
  const { 
    group, 
    locations, 
    activeLocation, 
    setActiveLocation,
    hasMultipleLocations,
    loading 
  } = useLocationContext();
  const { navigateToTenant, currentTenantSlug } = useSmartNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Handle location change with smart navigation
  const handleLocationChange = async (locationId: string, locationSlug?: string) => {
    if (switching || locationId === activeLocation?.id) return;
    
    setSwitching(true);
    setIsOpen(false);
    
    try {
      await setActiveLocation(locationId);
      
      // If we have a slug and we're in tenant context, navigate to preserve the current page
      if (locationSlug && location.pathname.startsWith('/tenants/')) {
        const currentPath = location.pathname;
        const pathAfterSlug = currentPath.split('/').slice(3).join('/'); // Remove /tenants/:oldSlug
        const newPath = `/tenants/${locationSlug}/${pathAfterSlug || 'dashboard/overview'}`;
        navigate(newPath, { replace: true });
      }
      // If we're on legacy routes, optionally redirect to new tenant experience
      else if (locationSlug && location.pathname.startsWith('/app')) {
        // Could optionally redirect to new experience
        // navigateToTenant('dashboard/overview');
      }
    } catch (error) {
      console.error('Failed to switch location:', error);
    } finally {
      setSwitching(false);
    }
  };

  // Don't render if no group or only one location
  if (!group || !hasMultipleLocations) {
    return null;
  }

  const isLoading = loading || switching;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="justify-between min-w-[200px]"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {activeLocation?.name || 'Select location...'}
            </span>
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-[200px] p-0 bg-background border border-border" 
        align="start"
      >
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {group.name}
          </div>
          
          {locations.map((loc) => {
            const isActive = loc.id === activeLocation?.id;
            return (
              <DropdownMenuItem
                key={loc.id}
                className={cn(
                  "flex items-center cursor-pointer justify-between px-2 py-2 rounded-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleLocationChange(loc.id, loc.slug)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{loc.name}</span>
                    {loc.address && (
                      <span className="text-xs text-muted-foreground truncate">
                        {loc.address}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {loc.is_main && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Main
                    </span>
                  )}
                  {isActive && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}