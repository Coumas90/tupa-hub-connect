import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { tenantCache } from '@/lib/cache/tenant-cache';

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
  slug?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

interface CafeMapping {
  cafe_id: string;
  cafe_name: string;
  owner_id: string;
  qr_code_url?: string;
  brand_color?: string;
  logo_url?: string;
}

interface LocationContextType {
  group: Group | null;
  locations: Location[];
  activeLocation: Location | null;
  loading: boolean;
  error: string | null;
  setActiveLocation: (locationId: string) => Promise<void>;
  setActiveLocationBySlug: (locationSlug: string) => Promise<void>;
  getCafeByLocationId: (locationId: string) => Promise<CafeMapping | null>;
  getLocationByCafeId: (cafeId: string) => Promise<Location | null>;
  refreshContext: () => Promise<void>;
  hasMultipleLocations: boolean;
  // Backward compatibility helpers
  activeCafe: CafeMapping | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocationState] = useState<Location | null>(null);
  const [activeCafe, setActiveCafe] = useState<CafeMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const fetchLocationContext = useCallback(async (preferredLocationId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // User not logged in, reset context
        setGroup(null);
        setLocations([]);
        setActiveLocationState(null);
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = tenantCache.get(session.user.id, preferredLocationId);
      if (cached) {
        setGroup(cached.group);
        setLocations(cached.locations);
        setActiveLocationState(cached.activeLocation);
        setLoading(false);
        console.log('Location context loaded from cache:', {
          group: cached.group?.name,
          locations: cached.locations?.length,
          activeLocation: cached.activeLocation?.name
        });
        return;
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

      setGroup(data.data.group);
      setLocations(data.data.locations);
      setActiveLocationState(data.data.activeLocation);

      // Cache the data for future requests
      tenantCache.set(session.user.id, {
        group: data.data.group,
        locations: data.data.locations,
        activeLocation: data.data.activeLocation
      }, preferredLocationId);

      // Store active location in session storage for persistence
      if (data.data.activeLocation) {
        sessionStorage.setItem('activeLocationId', data.data.activeLocation.id);
      }

      console.log('Location context loaded from API:', {
        group: data.data.group?.name,
        locations: data.data.locations?.length,
        activeLocation: data.data.activeLocation?.name
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      console.error('Location context error:', err);
      
      // Only show toast for actual errors, not when user is not logged in
      if (message !== 'Unauthorized: Missing auth header') {
        toast({
          title: "Location Context Error",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch cafe mapping when active location changes
  useEffect(() => {
    const fetchCafeMapping = async () => {
      if (activeLocation) {
        try {
          const { data, error } = await supabase
            .from('cafes_locations_mapping')
            .select('cafe_id, cafe_name, owner_id, qr_code_url, brand_color, logo_url')
            .eq('location_id', activeLocation.id)
            .maybeSingle();

          if (!error && data) {
            setActiveCafe(data);
          } else {
            setActiveCafe(null);
          }
        } catch (err) {
          console.error('Error fetching cafe mapping:', err);
          setActiveCafe(null);
        }
      } else {
        setActiveCafe(null);
      }
    };

    fetchCafeMapping();
  }, [activeLocation]);

  const setActiveLocation = useCallback(async (locationId: string) => {
    const targetLocation = locations.find(loc => loc.id === locationId);
    if (!targetLocation) {
      toast({
        title: "Invalid Location",
        description: "The requested location is not available",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    setActiveLocationState(targetLocation);

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

      // Update context with returned data
      if (data.data) {
        setGroup(data.data.group);
        setLocations(data.data.locations);
        setActiveLocationState(data.data.activeLocation);
      }

      // Store in session
      sessionStorage.setItem('activeLocationId', locationId);

      toast({
        title: "Location Changed",
        description: `Switched to ${targetLocation.name}`,
      });

    } catch (err) {
      // Revert optimistic update on error
      const previousLocation = locations.find(loc => 
        sessionStorage.getItem('activeLocationId') === loc.id
      ) || locations.find(loc => loc.is_main) || (locations.length > 0 ? locations[0] : null);
      
      setActiveLocationState(previousLocation);

      const message = err instanceof Error ? err.message : 'Failed to switch location';
      console.error('Location switch error:', err);
      
      toast({
        title: "Error Switching Location",
        description: message,
        variant: "destructive",
      });
    }
  }, [locations, toast]);

  const setActiveLocationBySlug = useCallback(async (locationSlug: string) => {
    const targetLocation = locations.find(loc => loc.slug === locationSlug);
    if (!targetLocation) {
      toast({
        title: "Invalid Location",
        description: `Location with slug "${locationSlug}" not found`,
        variant: "destructive",
      });
      return;
    }
    await setActiveLocation(targetLocation.id);
  }, [locations, setActiveLocation, toast]);

  const getCafeByLocationId = useCallback(async (locationId: string): Promise<CafeMapping | null> => {
    try {
      const { data, error } = await supabase
        .from('cafes_locations_mapping')
        .select('cafe_id, cafe_name, owner_id, qr_code_url, brand_color, logo_url')
        .eq('location_id', locationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cafe mapping:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getCafeByLocationId:', err);
      return null;
    }
  }, []);

  const getLocationByCafeId = useCallback(async (cafeId: string): Promise<Location | null> => {
    try {
      const { data, error } = await supabase
        .from('cafes_locations_mapping')
        .select('location_id, location_slug, location_name, group_id, address, is_main')
        .eq('cafe_id', cafeId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching location by cafe:', error);
        return null;
      }

      if (!data) return null;

      // Find the full location object
      return locations.find(loc => loc.id === data.location_id) || null;
    } catch (err) {
      console.error('Error in getLocationByCafeId:', err);
      return null;
    }
  }, [locations]);

  const refreshContext = useCallback(async () => {
    const storedLocationId = sessionStorage.getItem('activeLocationId');
    await fetchLocationContext(storedLocationId || undefined);
  }, [fetchLocationContext]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session) {
          // User just logged in, fetch location context
          tenantCache.invalidate(session.user.id); // Invalidate old cache
          const storedLocationId = sessionStorage.getItem('activeLocationId');
          await fetchLocationContext(storedLocationId || undefined);
        } else if (event === 'SIGNED_OUT') {
          // User logged out, clear context
          setGroup(null);
          setLocations([]);
          setActiveLocationState(null);
          setActiveCafe(null);
          setError(null);
          setLoading(false);
          sessionStorage.removeItem('activeLocationId');
          tenantCache.clear(); // Clear cache on logout
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchLocationContext]);

  // Initial load - check for existing session
  useEffect(() => {
    const initializeContext = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const storedLocationId = sessionStorage.getItem('activeLocationId');
        await fetchLocationContext(storedLocationId || undefined);
      } else {
        setLoading(false);
      }
    };

    initializeContext();
  }, [fetchLocationContext]);

  const hasMultipleLocations = locations.length > 1;

  const contextValue: LocationContextType = {
    group,
    locations,
    activeLocation,
    loading,
    error,
    setActiveLocation,
    setActiveLocationBySlug,
    getCafeByLocationId,
    getLocationByCafeId,
    refreshContext,
    hasMultipleLocations,
    activeCafe,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};