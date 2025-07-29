import { AlertTriangle, Shield, Lock, Coffee, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  type: 'auth' | 'role' | 'admin' | 'network' | 'general';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  userRole?: string;
  className?: string;
}

export function ErrorState({ 
  type, 
  title, 
  message, 
  actionLabel, 
  onAction,
  userRole,
  className 
}: ErrorStateProps) {
  const getConfig = () => {
    switch (type) {
      case 'auth':
        return {
          icon: <Lock className="h-8 w-8 text-destructive" />,
          defaultTitle: 'Acceso Denegado',
          defaultMessage: 'Necesitas iniciar sesión para acceder a esta área.',
          defaultAction: 'Iniciar Sesión',
          bgColor: 'from-red-50 to-red-100'
        };
      case 'role':
        return {
          icon: <Shield className="h-8 w-8 text-amber-600" />,
          defaultTitle: 'Permisos Insuficientes',
          defaultMessage: `Tu rol actual ${userRole ? `(${userRole})` : ''} no tiene acceso a esta funcionalidad.`,
          defaultAction: 'Ir al Dashboard',
          bgColor: 'from-amber-50 to-orange-100'
        };
      case 'admin':
        return {
          icon: <Shield className="h-8 w-8 text-purple-600" />,
          defaultTitle: 'Acceso Administrativo Requerido',
          defaultMessage: 'Esta área está restringida solo para administradores del sistema.',
          defaultAction: 'Volver',
          bgColor: 'from-purple-50 to-purple-100'
        };
      case 'network':
        return {
          icon: <RefreshCw className="h-8 w-8 text-blue-600" />,
          defaultTitle: 'Error de Conexión',
          defaultMessage: 'No pudimos conectar con el servidor. Verifica tu conexión a internet.',
          defaultAction: 'Reintentar',
          bgColor: 'from-blue-50 to-blue-100'
        };
      default:
        return {
          icon: <AlertTriangle className="h-8 w-8 text-destructive" />,
          defaultTitle: 'Error Inesperado',
          defaultMessage: 'Algo salió mal. Por favor intenta nuevamente.',
          defaultAction: 'Reintentar',
          bgColor: 'from-gray-50 to-gray-100'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-6", className)}>
      <Card className="max-w-md w-full text-center shadow-warm">
        <div className={`h-2 bg-gradient-to-r ${config.bgColor}`} />
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-center">
            <div className={`p-4 bg-gradient-to-br ${config.bgColor} rounded-full`}>
              {config.icon}
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {title || config.defaultTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {message || config.defaultMessage}
            </p>
          </div>

          {type === 'role' && userRole && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 py-2 px-4 rounded-lg">
              <Coffee className="h-4 w-4" />
              <span>Rol actual: <strong>{userRole}</strong></span>
            </div>
          )}

          {onAction && (
            <Button 
              onClick={onAction} 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {actionLabel || config.defaultAction}
            </Button>
          )}
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              ¿Necesitas ayuda? Contacta a tu administrador
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface RoleBasedErrorProps {
  userRole: string;
  requiredRoles: string[];
  onNavigateBack?: () => void;
  className?: string;
}

export function RoleBasedError({ 
  userRole, 
  requiredRoles, 
  onNavigateBack,
  className 
}: RoleBasedErrorProps) {
  const roleDisplayMap: Record<string, string> = {
    'client': 'Cliente',
    'barista': 'Barista',
    'manager': 'Gerente',
    'owner': 'Propietario',
    'admin': 'Administrador'
  };

  const getRequiredRolesText = () => {
    return requiredRoles
      .map(role => roleDisplayMap[role] || role)
      .join(', ');
  };

  return (
    <ErrorState
      type="role"
      title="Acceso Restringido por Rol"
      message={`Esta funcionalidad requiere los siguientes roles: ${getRequiredRolesText()}. Tu rol actual es: ${roleDisplayMap[userRole] || userRole}.`}
      actionLabel="Volver al Dashboard"
      onAction={onNavigateBack}
      userRole={roleDisplayMap[userRole] || userRole}
      className={className}
    />
  );
}