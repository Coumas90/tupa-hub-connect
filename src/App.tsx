import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
