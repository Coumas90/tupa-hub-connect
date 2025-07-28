import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useLocationContext } from '@/contexts/LocationContext';
import { useAuthGuard, useAdminGuard } from '@/hooks/useAuthGuard';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';

// Import existing pages
import Dashboard from '@/pages/Dashboard';
import Recetas from '@/pages/Recetas';
import Academia from '@/pages/Academia';
import Consumo from '@/pages/Consumo';
import Recursos from '@/pages/Recursos';
import MiEquipo from '@/pages/MiEquipo';
import Reposicion from '@/pages/Reposicion';
import BaristaPool from '@/pages/BaristaPool';
import FAQ from '@/pages/FAQ';

interface TenantRouteWrapperProps {
  children: React.ReactNode;
}

function TenantRouteWrapper({ children }: TenantRouteWrapperProps) {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const { setActiveLocationBySlug, activeLocation, loading, error } = useLocationContext();
  const [locationSet, setLocationSet] = useState(false);
  
  // Ensure user is authenticated
  const { isAuthenticated, loading: authLoading } = useAuthGuard({ 
    requireAuth: true,
    redirectTo: '/auth'
  });

  useEffect(() => {
    if (locationSlug && !loading && !locationSet) {
      setActiveLocationBySlug(locationSlug).then(() => {
        setLocationSet(true);
      });
    }
  }, [locationSlug, setActiveLocationBySlug, loading, locationSet]);

  // Show loading while auth or location is being resolved
  if (authLoading || loading || (locationSlug && !locationSet)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, the auth guard will handle redirect
  if (!isAuthenticated) {
    return null;
  }

  // If location slug provided but no active location found
  if (locationSlug && !activeLocation && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Location Not Found</h1>
          <p className="text-muted-foreground">
            The location "{locationSlug}" could not be found or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { isAuthenticated } = useAuthGuard();
  const { isAdmin } = useAdminGuard();
  
  // For now, we'll implement basic role checking
  // This can be enhanced with more granular role management later
  const hasAccess = isAdmin || roles.includes('user'); // Simplified for initial implementation
  
  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function TenantRoutes() {
  return (
    <Routes>
      <Route path=":locationSlug" element={
        <TenantRouteWrapper>
          <Layout />
        </TenantRouteWrapper>
      }>
        {/* Dashboard Routes by Role */}
        <Route path="dashboard" element={<Navigate to="dashboard/overview" replace />} />
        <Route path="dashboard/overview" element={
          <RoleGuard roles={['owner', 'manager', 'barista', 'user']}>
            <Dashboard />
          </RoleGuard>
        } />
        <Route path="dashboard/owner" element={
          <RoleGuard roles={['owner', 'admin']}>
            <Dashboard />
          </RoleGuard>
        } />
        <Route path="dashboard/manager" element={
          <RoleGuard roles={['owner', 'manager', 'admin']}>
            <Dashboard />
          </RoleGuard>
        } />
        <Route path="dashboard/barista" element={
          <RoleGuard roles={['owner', 'manager', 'barista', 'admin']}>
            <Dashboard />
          </RoleGuard>
        } />

        {/* Operations Routes */}
        <Route path="operations">
          <Route path="consumption" element={
            <RoleGuard roles={['owner', 'manager', 'admin']}>
              <Consumo />
            </RoleGuard>
          } />
          <Route path="recipes" element={
            <RoleGuard roles={['owner', 'manager', 'barista', 'admin']}>
              <Recetas />
            </RoleGuard>
          } />
          <Route path="staff" element={
            <RoleGuard roles={['owner', 'manager', 'admin']}>
              <MiEquipo />
            </RoleGuard>
          } />
          <Route path="inventory" element={
            <RoleGuard roles={['owner', 'manager', 'admin']}>
              <Reposicion />
            </RoleGuard>
          } />
          <Route path="resources" element={
            <RoleGuard roles={['owner', 'manager', 'barista', 'admin']}>
              <Recursos />
            </RoleGuard>
          } />
        </Route>

        {/* Academy Routes */}
        <Route path="academy">
          <Route index element={
            <RoleGuard roles={['owner', 'manager', 'barista', 'admin']}>
              <Academia />
            </RoleGuard>
          } />
          <Route path="courses" element={
            <RoleGuard roles={['owner', 'manager', 'barista', 'admin']}>
              <Academia />
            </RoleGuard>
          } />
        </Route>

        {/* Other Routes */}
        <Route path="barista-pool" element={
          <RoleGuard roles={['owner', 'manager', 'admin']}>
            <BaristaPool />
          </RoleGuard>
        } />
        <Route path="faq" element={
          <RoleGuard roles={['owner', 'manager', 'barista', 'admin']}>
            <FAQ />
          </RoleGuard>
        } />

        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard/overview" replace />} />
      </Route>
    </Routes>
  );
}
