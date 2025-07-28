import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useLocationContext } from '@/contexts/LocationContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { RouteGuard, ManagementGuard, AuthenticatedGuard } from './guards';
import { ROUTE_PERMISSIONS } from '@/constants/routes';

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

// RoleGuardProps moved to guards.tsx

// RoleGuard moved to guards.tsx for better organization

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
          <AuthenticatedGuard>
            <Dashboard />
          </AuthenticatedGuard>
        } />
        <Route path="dashboard/owner" element={
          <RouteGuard permission="OWNER_ONLY">
            <Dashboard />
          </RouteGuard>
        } />
        <Route path="dashboard/manager" element={
          <ManagementGuard>
            <Dashboard />
          </ManagementGuard>
        } />
        <Route path="dashboard/barista" element={
          <AuthenticatedGuard>
            <Dashboard />
          </AuthenticatedGuard>
        } />

        {/* Operations Routes */}
        <Route path="operations">
          <Route path="consumption" element={
            <ManagementGuard>
              <Consumo />
            </ManagementGuard>
          } />
          <Route path="recipes" element={
            <AuthenticatedGuard>
              <Recetas />
            </AuthenticatedGuard>
          } />
          <Route path="staff" element={
            <ManagementGuard>
              <MiEquipo />
            </ManagementGuard>
          } />
          <Route path="inventory" element={
            <ManagementGuard>
              <Reposicion />
            </ManagementGuard>
          } />
          <Route path="resources" element={
            <AuthenticatedGuard>
              <Recursos />
            </AuthenticatedGuard>
          } />
        </Route>

        {/* Academy Routes */}
        <Route path="academy">
          <Route index element={
            <AuthenticatedGuard>
              <Academia />
            </AuthenticatedGuard>
          } />
          <Route path="courses" element={
            <AuthenticatedGuard>
              <Academia />
            </AuthenticatedGuard>
          } />
        </Route>

        {/* Other Routes */}
        <Route path="barista-pool" element={
          <ManagementGuard>
            <BaristaPool />
          </ManagementGuard>
        } />
        <Route path="faq" element={
          <AuthenticatedGuard>
            <FAQ />
          </AuthenticatedGuard>
        } />

        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard/overview" replace />} />
      </Route>
    </Routes>
  );
}
