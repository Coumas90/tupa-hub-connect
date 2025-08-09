import React from 'react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, User, Settings } from 'lucide-react';
import { Roles } from '@/constants/roles';

const AuthDebugPanel: React.FC = () => {
  const { user, session, userRole, loading } = useOptimizedAuth();

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Verificando autenticación...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Estado de Autenticación
        </CardTitle>
        <CardDescription>
          Panel de debug para verificar sesión y roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado de sesión:</span>
          <Badge variant={session ? "default" : "destructive"}>
            {session ? "Activa" : "Inactiva"}
          </Badge>
        </div>

        {user && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Usuario:</span>
            </div>
            <div className="text-sm text-muted-foreground pl-6">
              <p>ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Confirmado: {user.email_confirmed_at ? "Sí" : "No"}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Rol detectado:</span>
          <Badge 
            variant={userRole ? "default" : "secondary"}
            className={
              userRole === Roles.ADMIN ? 'bg-red-600' :
              userRole === 'client' ? 'bg-blue-600' :
              userRole === Roles.BARISTA ? 'bg-green-600' : ''
            }
          >
            {userRole || "Sin rol"}
          </Badge>
        </div>

        {userRole && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Redirección esperada:</span>
            </div>
            <div className="text-sm text-muted-foreground pl-6">
              {userRole === Roles.ADMIN && <span>→ /admin</span>}
              {userRole === 'client' && <span>→ /app</span>}
              {userRole === Roles.BARISTA && <span>→ /recipes</span>}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>Última actualización: {new Date().toLocaleTimeString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugPanel;