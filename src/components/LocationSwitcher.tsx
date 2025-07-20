import { useState } from 'react';
import { Check, ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationContext } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LocationSwitcher() {
  const { group, locations, activeLocation, setActiveLocation, hasMultipleLocations } = useLocationContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLocationChange = async (locationId: string) => {
    if (locationId === activeLocation?.id || isLoading) return;

    setIsLoading(true);
    setIsOpen(false);

    try {
      await setActiveLocation(locationId);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no locations or only one location
  if (!group || !hasMultipleLocations) {
    return null;
  }

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
          
          {locations.map((location) => (
            <DropdownMenuItem
              key={location.id}
              onClick={() => handleLocationChange(location.id)}
              className={cn(
                "flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm",
                "hover:bg-accent hover:text-accent-foreground",
                location.id === activeLocation?.id && "bg-accent text-accent-foreground"
              )}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{location.name}</span>
                  {location.address && (
                    <span className="text-xs text-muted-foreground truncate">
                      {location.address}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {location.is_main && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    Main
                  </span>
                )}
                {location.id === activeLocation?.id && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}