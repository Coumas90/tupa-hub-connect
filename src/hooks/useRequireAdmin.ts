import { useEffect } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { useNavigate } from 'react-router-dom';

export function useRequireAdmin() {
  const { user, loading, isInitialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isInitialized) {
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user has admin role
      const userRole = user.user_metadata?.role || user.app_metadata?.role;
      if (userRole !== 'admin') {
        navigate('/dashboard');
        return;
      }
    }
  }, [user, loading, isInitialized, navigate]);

  return {
    user,
    loading,
    isAdmin: user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
  };
}