import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  location_id: string;
  locations?: {
    id: string;
    name: string;
    group_id: string;
  };
}

interface UseRecipesOptions {
  allLocations?: boolean;
  locationId?: string;
  autoFetch?: boolean;
}

interface UseRecipesReturn {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  total: number;
  fetchRecipes: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useRecipes = (options: UseRecipesOptions = {}): UseRecipesReturn => {
  const { allLocations = false, locationId, autoFetch = true } = options;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (allLocations) {
        params.append('all_locations', 'true');
      }
      if (locationId) {
        params.append('location_id', locationId);
      }

      const queryString = params.toString();
      const url = queryString ? `recipes?${queryString}` : 'recipes';

      const { data, error: functionError } = await supabase.functions.invoke(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch recipes');
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      setRecipes(data.data);
      setTotal(data.meta?.total || data.data.length);

      console.log(`Fetched ${data.data.length} recipes`, {
        allLocations,
        locationId,
        filteredByLocation: data.meta?.filtered_by_location,
        activeLocationId: data.meta?.active_location_id,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      console.error('Recipes fetch error:', err);
      
      toast({
        title: "Error Loading Recipes",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [allLocations, locationId, toast]);

  const refetch = useCallback(() => {
    return fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (autoFetch) {
      fetchRecipes();
    }
  }, [fetchRecipes, autoFetch]);

  return {
    recipes,
    loading,
    error,
    total,
    fetchRecipes,
    refetch,
  };
};