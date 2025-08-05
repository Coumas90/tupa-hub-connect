import React from 'react';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface UnauthorizedAccessProps {
  reason?: string;
  redirectTo?: string;
}

export function UnauthorizedAccess({ 
  reason = "No tienes permisos para acceder a esta página", 
  redirectTo = "/app" 
}: UnauthorizedAccessProps) {
  const navigate = useNavigate();

  const getReasonMessage = (reason: string) => {
    switch (reason) {
      case 'not_authenticated':
        return "Debes iniciar sesión para acceder a esta página";
      case 'insufficient_privileges':
        return "No tienes los permisos necesarios para esta sección";
      case 'role_mismatch':
        return "Tu rol no te permite acceder a esta funcionalidad";
      case 'wrong_org':
        return "Esta página pertenece a otra organización";
      case 'location_required':
        return "Necesitas tener una ubicación asignada";
      default:
        return reason;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
          <CardDescription>
            {getReasonMessage(reason)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver Atrás
            </Button>
            <Button 
              onClick={() => navigate(redirectTo)}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}