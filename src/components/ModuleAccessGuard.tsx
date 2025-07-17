import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ModuleAccessGuardProps {
  children: React.ReactNode;
  module?: string;
  requiredRole?: string;
}

const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({ 
  children, 
  module = 'este módulo',
  requiredRole = 'usuario autorizado'
}) => {
  // Simulamos verificación de acceso (en producción sería contra auth real)
  const hasAccess = true; // Por ahora siempre permite acceso
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center shadow-warm">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-destructive/10 rounded-full">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">
              No tienes permisos suficientes para acceder a {module}. 
              Se requiere rol de {requiredRole}.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <AlertTriangle className="h-4 w-4" />
              <span>Contacta a tu administrador para obtener acceso</span>
            </div>
            <Button onClick={() => window.history.back()} className="bg-gradient-primary">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleAccessGuard;