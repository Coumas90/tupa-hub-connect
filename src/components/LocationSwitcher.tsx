import { useState } from 'react';
import { Check, ChevronDown, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationContext } from '@/hooks/useLocationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LocationSwitcher() {
  const { group, locations, activeLocation, refreshContext } = useLocationContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleLocationChange = async (locationId: string) => {
    if (locationId === activeLocation?.id || isLoading) return;

    const targetLocation = locations.find(loc => loc.id === locationId);
    if (!targetLocation) return;

    setIsLoading(true);
    setIsOpen(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const { data, error } = await supabase.functions.invoke('set-location', {
        body: { location_id: locationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to switch location');
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      // Store in session storage
      sessionStorage.setItem('activeLocationId', locationId);

      // Refresh the location context
      await refreshContext();

      toast({
        title: "Location Changed",
        description: `Switched to ${targetLocation.name}`,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to switch location';
      console.error('Location switch error:', error);
      
      toast({
        title: "Error Switching Location",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!group || locations.length === 0) {
    return null;
  }

  // If only one location, show it without dropdown
  if (locations.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{locations[0].name}</span>
      </div>
    );
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