import { useEffect } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { useNavigate } from 'react-router-dom';

export function useRequireAuth() {
  const { user, loading, isInitialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isInitialized && !user) {
      navigate('/login');
    }
  }, [user, loading, isInitialized, navigate]);

  return {
    user,
    loading,
    isAuthenticated: !!user
  };
}