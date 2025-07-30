import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect } from 'react';
import { initializeAuthListeners } from '@/utils/authConfig';
import { LocationProvider } from '@/contexts/LocationContext';
import { SentryErrorBoundary } from '@/lib/sentry';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { useLocationPreloader } from '@/hooks/useLocationPreloader';
import { productionGuard } from '@/lib/security/production-guard';
import { Layout } from "./components/Layout";
import { TenantRoutes } from "./utils/routing/tenantRoutes";
import { LegacyRouteRedirector, CafeRouteRedirector } from "./utils/routing/redirects";
import { AdminGuard } from "./utils/routing/guards";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Recetas from "./pages/Recetas";
import Academia from "./pages/Academia";
import Consumo from "./pages/Consumo";
import Recursos from "./pages/Recursos";
import MiEquipo from "./pages/MiEquipo";
import Reposicion from "./pages/Reposicion";
import BaristaPool from "./pages/BaristaPool";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import ActivateAccount from "./pages/ActivateAccount";
import FriendlyLoginPage from "./pages/FriendlyLoginPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminOperationsPage from "@/pages/admin/AdminOperationsPage";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminCourses from "./pages/AdminCourses";
import ClientLogs from "./pages/ClientLogs";
import ClientConfiguration from "./pages/ClientConfiguration";
import FeedbackForm from "./pages/FeedbackForm";
import CafeDashboard from "./pages/CafeDashboard";
import { FriendlyAuthProvider } from "./contexts/FriendlyAuthProvider";
import AdvisoryAdmin from "./pages/AdvisoryAdmin";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";

const queryClient = new QueryClient();

// Component to initialize preloading
function AppInitializer() {
  useLocationPreloader(); // Initialize location preloading and smart caching
  return null;
}

const App = () => {
  // Initialize security monitoring
  useSecurityMonitor();
  
  // Initialize auth listeners and production security monitoring
  useEffect(() => {
    const cleanup = initializeAuthListeners();
    
    // Start production security monitoring
    productionGuard.startProductionMonitoring();
    
    return cleanup;
  }, []);

  return (
    <SentryErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LocationProvider>
            <Toaster />
            <Sonner />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          <BrowserRouter>
            <FriendlyAuthProvider>
              {/* Initialize enhanced features */}
              <AppInitializer />
              
              {/* Legacy route redirectors */}
              <LegacyRouteRedirector />
              <CafeRouteRedirector />
              
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<FriendlyLoginPage />} />
                <Route path="/auth/reset" element={<PasswordResetPage />} />
                <Route path="/activate-account" element={<ActivateAccount />} />
                
                {/* New Tenant Routes */}
                <Route path="/tenants/*" element={<TenantRoutes />} />
                
                {/* Admin Routes - Protected */}
                <Route path="/admin" element={
                  <AdminGuard>
                    <Layout />
                  </AdminGuard>
                }>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="operations/:section?" element={<AdminOperationsPage />} />
                  <Route path="academy/courses" element={<AdminCourses />} />
                  <Route path="advisory" element={<AdvisoryAdmin />} />
                  <Route path="integrations/logs/:clientId" element={<ClientLogs />} />
                  <Route path="integrations/:clientId" element={<ClientConfiguration />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  
                  {/* Legacy redirects */}
                  <Route path="integrations" element={<Navigate to="/admin/operations/pos" replace />} />
                  <Route path="courses" element={<Navigate to="/admin/academy/courses" replace />} />
                </Route>
                
                {/* Legacy Routes (will be redirected) */}
                <Route path="/recipes" element={<Layout />}>
                  <Route index element={<Recetas />} />
                </Route>
                
                <Route path="/app" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="recetas" element={<Recetas />} />
                  <Route path="academia" element={<Academia />} />
                  <Route path="consumo" element={<Consumo />} />
                  <Route path="recursos" element={<Recursos />} />
                  <Route path="mi-equipo" element={<MiEquipo />} />
                  <Route path="reposicion" element={<Reposicion />} />
                  <Route path="barista-pool" element={<BaristaPool />} />
                  <Route path="faq" element={<FAQ />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                
                {/* Public Feedback Route - Migrated */}
                <Route path="public/feedback/:locationSlug" element={<FeedbackForm />} />
                
                {/* Legacy Routes (will redirect via middleware) */}
                <Route path="feedback/:cafeId" element={<FeedbackForm />} />
                <Route path="cafe/dashboard/:cafeId" element={<CafeDashboard />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </FriendlyAuthProvider>
          </BrowserRouter>
        </LocationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SentryErrorBoundary>
  );
};

export default App;
