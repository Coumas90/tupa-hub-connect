import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect } from 'react';
import { LocationProvider } from '@/contexts/LocationContext';
import { SentryErrorBoundary } from '@/lib/sentry';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { useLocationPreloader } from '@/hooks/useLocationPreloader';
import { productionGuard } from '@/lib/security/production-guard';
import { registerAuthEffectsOnce, registerProfileUpsertEffectOnce } from '@/lib/auth-effects';
import { Layout } from "./components/Layout";
import { TenantRoutes } from "./utils/routing/tenantRoutes";
import { LegacyRouteRedirector, CafeRouteRedirector } from "./utils/routing/redirects";
import { AdminGuard } from "./utils/routing/guards";
import { MultiTenantRouter, AdminRouter } from './components/routing/MultiTenantRouter';
import { SmartRedirectRouter } from './components/routing/SmartRedirectRouter';
import { UnauthorizedAccess } from './components/auth/UnauthorizedAccess';
import { OnboardingPage } from './pages/OnboardingPage';
import { OnboardingLocationPage } from './pages/OnboardingLocationPage';
import { AdminRouteGuard } from './components/guards/AdminRouteGuard';
import { ClientRouteGuard } from './components/guards/ClientRouteGuard';
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
import { ClientLoginPage } from "./pages/ClientLoginPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import AdminOperationsPage from "@/pages/admin/AdminOperationsPage";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminCourses from "./pages/AdminCourses";
import ClientLogs from "./pages/ClientLogs";
import ClientConfiguration from "./pages/ClientConfiguration";
import FeedbackForm from "./pages/FeedbackForm";
import CafeDashboard from "./pages/CafeDashboard";
import { OptimizedAuthProvider } from "./contexts/OptimizedAuthProvider";
import AdvisoryAdmin from "./pages/AdvisoryAdmin";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import AuthCallback from "./pages/auth/Callback";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

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
    const off1 = registerAuthEffectsOnce();
    const off2 = registerProfileUpsertEffectOnce();
    // Start production security monitoring
    productionGuard.startProductionMonitoring();
    return () => { off1?.(); off2?.(); };
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
            <OptimizedAuthProvider>
              {/* Initialize enhanced features */}
              <AppInitializer />
              
              {/* Legacy route redirectors */}
              <LegacyRouteRedirector />
              <CafeRouteRedirector />
              
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<ClientLoginPage />} />
                <Route path="/login" element={<ClientLoginPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/auth/reset" element={<PasswordResetPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/activate-account" element={<ActivateAccount />} />
                
                {/* Onboarding routes */}
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/onboarding/location" element={<OnboardingLocationPage />} />
                
                {/* Smart Auto-Redirect */}
                <Route path="/dashboard" element={<ProtectedRoute><SmartRedirectRouter /></ProtectedRoute>} />
                
                {/* New Multi-Tenant Routes */}
                <Route path="/org/*" element={<ProtectedRoute><MultiTenantRouter /></ProtectedRoute>} />
                
                {/* Admin Routes - Protected */}
                <Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminRouter /></ProtectedRoute>} />
                
                {/* Unauthorized Access */}
                <Route path="/unauthorized" element={<UnauthorizedAccess />} />
                
                {/* Legacy Routes (will be redirected) */}
                <Route path="/recipes" element={<Layout />}>
                  <Route index element={<Recetas />} />
                </Route>
                
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
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
            </OptimizedAuthProvider>
          </BrowserRouter>
        </LocationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SentryErrorBoundary>
  );
};

export default App;
