import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserRoleData {
  role: string | null;
  isAdmin: boolean;
  userId: string;
}

/**
 * Optimized single query to get user role and admin status
 * Combines both role fetching and admin checking in one query
 */
export async function getUserRoleAndAdmin(userId: string): Promise<UserRoleData> {
  try {
    console.info('🔍 AuthQuery: Single query for role and admin status:', userId);
    
    // Single query to get role information
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ AuthQuery: Error fetching user role:', error);
      return { role: null, isAdmin: false, userId };
    }

    const role = data?.role || null;
    const isAdmin = role === 'admin';
    
    console.info('✅ AuthQuery: Single query result:', { role, isAdmin, userId });
    return { role, isAdmin, userId };
  } catch (error) {
    console.error('❌ AuthQuery: Error in getUserRoleAndAdmin:', error);
    return { role: null, isAdmin: false, userId };
  }
}

/**
 * React Query hook for cached user role and admin status
 * Implements 5-minute TTL cache with automatic deduplication
 */
export function useUserRoleQuery(userId: string | null) {
  return useQuery({
    queryKey: ['userRole', userId],
    queryFn: () => getUserRoleAndAdmin(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes TTL
    gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to invalidate user role cache when needed
 */
export function useInvalidateUserRole() {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    console.info('🔄 AuthQuery: Invalidating cache for user:', userId);
    queryClient.invalidateQueries({ queryKey: ['userRole', userId] });
  };
}

/**
 * Hook to prefetch user role data
 */
export function usePrefetchUserRole() {
  const queryClient = useQueryClient();
  
  return (userId: string) => {
    console.info('🔄 AuthQuery: Prefetching role for user:', userId);
    queryClient.prefetchQuery({
      queryKey: ['userRole', userId],
      queryFn: () => getUserRoleAndAdmin(userId),
      staleTime: 5 * 60 * 1000,
    });
  };
}