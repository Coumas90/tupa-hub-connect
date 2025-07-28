import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import ModuleAccessGuard from '@/components/ModuleAccessGuard';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <ModuleAccessGuard module="Página no encontrada" requiredRole="usuario">
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <p className="text-xl text-muted-foreground">Oops! Página no encontrada</p>
          <p className="text-muted-foreground">
            La página que estás buscando no existe o fue movida.
          </p>
          <a 
            href="/app" 
            className="inline-block px-6 py-3 bg-gradient-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al Dashboard
          </a>
        </div>
      </div>
    </ModuleAccessGuard>
  );
};

export default NotFound;
