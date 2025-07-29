import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserRoleData {
  role: string | null;
  isAdmin: boolean;
  userId: string;
}

/**
 * Optimized single query to get user role and admin status from user_metadata
 * Uses Supabase auth.getUser() to access metadata directly
 */
export async function getUserRoleAndAdmin(userId: string): Promise<UserRoleData> {
  try {
    console.info('🔍 AuthQuery: Getting role from user_metadata:', userId);
    
    // Get user data including metadata from auth
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.id !== userId) {
      console.error('❌ AuthQuery: Error fetching user metadata:', error);
      return { role: null, isAdmin: false, userId };
    }

    // Extract role from user_metadata
    const role = user.user_metadata?.role || null;
    const isAdmin = role === 'admin';
    
    console.info('✅ AuthQuery: Role from metadata:', { role, isAdmin, userId, metadata: user.user_metadata });
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