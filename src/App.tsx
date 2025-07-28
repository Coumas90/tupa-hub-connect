import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { initializeAuthListeners } from '@/utils/authConfig';
import { LocationProvider } from '@/contexts/LocationContext';
import { SentryErrorBoundary } from '@/lib/sentry';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { Layout } from "./components/Layout";
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
import LoginPage from "./pages/LoginPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminCourses from "./pages/AdminCourses";
import ClientLogs from "./pages/ClientLogs";
import ClientConfiguration from "./pages/ClientConfiguration";
import FeedbackForm from "./pages/FeedbackForm";
import CafeDashboard from "./pages/CafeDashboard";
import { AuthProvider } from "./contexts/AuthContext";
import AdvisoryAdmin from "./pages/AdvisoryAdmin";

const queryClient = new QueryClient();

const App = () => {
  // Initialize security monitoring
  useSecurityMonitor();
  
  // Initialize auth listeners on app startup
  useEffect(() => {
    const cleanup = initializeAuthListeners();
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
            <AuthProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<LoginPage />} />
                <Route path="/auth/reset" element={<PasswordResetPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<Layout />}>
                  <Route index element={<AdminIntegrations />} />
                  <Route path="integrations" element={<AdminIntegrations />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="advisory" element={<AdvisoryAdmin />} />
                  <Route path="integrations/logs/:clientId" element={<ClientLogs />} />
                  <Route path="integrations/:clientId" element={<ClientConfiguration />} />
                </Route>
                
                {/* Recipes Route (for Baristas) */}
                <Route path="/recipes" element={<Layout />}>
                  <Route index element={<Recetas />} />
                </Route>
                
                {/* App Routes (for Clients) */}
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
                </Route>
                
                {/* Other Routes */}
                <Route path="feedback/:cafeId" element={<FeedbackForm />} />
                <Route path="cafe/dashboard/:cafeId" element={<CafeDashboard />} />
                <Route path="/activate-account" element={<ActivateAccount />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </LocationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SentryErrorBoundary>
  );
};

export default App;
