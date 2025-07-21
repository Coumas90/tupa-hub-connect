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
import { Layout } from "./components/Layout";
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
import LoginPage from "./pages/LoginPage";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminCourses from "./pages/AdminCourses";
import ClientLogs from "./pages/ClientLogs";
import ClientConfiguration from "./pages/ClientConfiguration";

const queryClient = new QueryClient();

const App = () => {
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
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="recetas" element={<Recetas />} />
                <Route path="academia" element={<Academia />} />
                <Route path="consumo" element={<Consumo />} />
                <Route path="recursos" element={<Recursos />} />
                <Route path="mi-equipo" element={<MiEquipo />} />
                <Route path="reposicion" element={<Reposicion />} />
                <Route path="barista-pool" element={<BaristaPool />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="admin/integrations" element={<AdminIntegrations />} />
                <Route path="admin/courses" element={<AdminCourses />} />
                <Route path="admin/integrations/logs/:clientId" element={<ClientLogs />} />
                <Route path="admin/integrations/:clientId" element={<ClientConfiguration />} />
                <Route path="auth" element={<LoginPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </LocationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SentryErrorBoundary>
  );
};

export default App;
