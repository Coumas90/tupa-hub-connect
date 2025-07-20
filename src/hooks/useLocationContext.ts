import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Group {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Location {
  id: string;
  group_id: string;
  name: string;
  address?: string;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

interface LocationContext {
  group: Group | null;
  locations: Location[];
  activeLocation: Location | null;
}

interface UseLocationContextReturn extends LocationContext {
  loading: boolean;
  error: string | null;
  setActiveLocation: (locationId: string) => Promise<void>;
  refreshContext: () => Promise<void>;
}

export const useLocationContext = (): UseLocationContextReturn => {
  const [context, setContext] = useState<LocationContext>({
    group: null,
    locations: [],
    activeLocation: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLocationContext = useCallback(async (preferredLocationId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const { data, error: functionError } = await supabase.functions.invoke('location-context', {
        body: preferredLocationId ? { preferredLocationId } : {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch location context');
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      setContext(data.data);

      // Store active location in session storage for persistence
      if (data.data.activeLocation) {
        sessionStorage.setItem('activeLocationId', data.data.activeLocation.id);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      console.error('Location context error:', err);
      
      toast({
        title: "Location Context Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const setActiveLocation = useCallback(async (locationId: string) => {
    const targetLocation = context.locations.find(loc => loc.id === locationId);
    if (!targetLocation) {
      toast({
        title: "Invalid Location",
        description: "The requested location is not available",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    setContext(prev => ({
      ...prev,
      activeLocation: targetLocation,
    }));

    // Store in session
    sessionStorage.setItem('activeLocationId', locationId);

    // Refresh context to ensure consistency
    await fetchLocationContext(locationId);

    toast({
      title: "Location Changed",
      description: `Switched to ${targetLocation.name}`,
    });
  }, [context.locations, fetchLocationContext, toast]);

  const refreshContext = useCallback(async () => {
    const storedLocationId = sessionStorage.getItem('activeLocationId');
    await fetchLocationContext(storedLocationId || undefined);
  }, [fetchLocationContext]);

  useEffect(() => {
    // Initialize with stored location preference
    const storedLocationId = sessionStorage.getItem('activeLocationId');
    fetchLocationContext(storedLocationId || undefined);
  }, [fetchLocationContext]);

  return {
    ...context,
    loading,
    error,
    setActiveLocation,
    refreshContext,
  };
};