import React, { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

interface SessionHealth {
  isHealthy: boolean;
  expiresIn: number;
  refreshedAt: number | null;
  warningThreshold: number;
  needsRefresh: boolean;
}

interface CacheStats {
  userCached: boolean;
  sessionCached: boolean;
  permissionsCached: boolean;
}

interface OptimizedAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  sessionHealth: SessionHealth;
  cacheStats: CacheStats;
  clearError: () => void;
}

const OptimizedAuthContext = createContext<OptimizedAuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(OptimizedAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}

interface OptimizedAuthProviderProps {
  children: React.ReactNode;
}

export function OptimizedAuthProvider({ children }: OptimizedAuthProviderProps) {
  const auth = useOptimizedAuth();

  return (
    <OptimizedAuthContext.Provider value={auth}>
      {children}
    </OptimizedAuthContext.Provider>
  );
}