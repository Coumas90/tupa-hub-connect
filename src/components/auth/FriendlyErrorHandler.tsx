import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FriendlyErrorProps {
  error: string | null;
  type?: 'auth' | 'google' | 'admin' | 'session' | 'network';
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
}

interface ErrorMessage {
  title: string;
  description: string;
  suggestions: string[];
}

interface ErrorMessages {
  [key: string]: ErrorMessage;
  default?: ErrorMessage;
}

const errorConfigs = {
  auth: {
    icon: Shield,
    title: "Error de Autenticación",
    getMessages: (error: string): ErrorMessages => ({
      "Invalid login credentials": {
        title: "Credenciales Incorrectas",
        description: "El email o la contraseña no son correctos. ¿Olvidaste tu contraseña?",
        suggestions: ["Verifica tu email y contraseña", "Usa 'Olvidé mi contraseña' si es necesario"]
      },
      "Email not confirmed": {
        title: "Email No Confirmado",
        description: "Revisa tu email y confirma tu cuenta antes de iniciar sesión.",
        suggestions: ["Busca el email de confirmación", "Revisa tu carpeta de spam"]
      },
      default: {
        title: "Error de Autenticación",
        description: "Hubo un problema al verificar tus credenciales.",
        suggestions: ["Verifica tus datos", "Intenta nuevamente"]
      }
    })
  },
  google: {
    icon: Mail,
    title: "Error con Google",
    getMessages: (error: string): ErrorMessages => ({
      "popup_closed_by_user": {
        title: "Ventana Cerrada",
        description: "Cerraste la ventana de Google antes de completar el login.",
        suggestions: ["Intenta nuevamente", "Mantén la ventana abierta hasta completar"]
      },
      "access_denied": {
        title: "Acceso Denegado",
        description: "No autorizaste el acceso a tu cuenta de Google.",
        suggestions: ["Intenta nuevamente", "Acepta los permisos requeridos"]
      },
      default: {
        title: "Error con Google",
        description: "Hubo un problema al conectar con Google.",
        suggestions: ["Intenta nuevamente", "Verifica tu conexión"]
      }
    })
  },
  admin: {
    icon: Shield,
    title: "Acceso Restringido",
    getMessages: (): ErrorMessages => ({
      default: {
        title: "Permisos Insuficientes",
        description: "No tienes permisos para acceder a esta sección.",
        suggestions: ["Contacta al administrador", "Verifica tu rol de usuario"]
      }
    })
  },
  session: {
    icon: RefreshCw,
    title: "Sesión Expirada",
    getMessages: (): ErrorMessages => ({
      default: {
        title: "Tu sesión ha expirado",
        description: "Por seguridad, necesitas iniciar sesión nuevamente.",
        suggestions: ["Inicia sesión otra vez", "Tus datos están seguros"]
      }
    })
  },
  network: {
    icon: AlertTriangle,
    title: "Error de Conexión",
    getMessages: (): ErrorMessages => ({
      default: {
        title: "Problema de Conexión",
        description: "No pudimos conectar con nuestros servidores.",
        suggestions: ["Verifica tu conexión a internet", "Intenta nuevamente en unos momentos"]
      }
    })
  }
};

export function FriendlyErrorHandler({ 
  error, 
  type = 'auth', 
  onRetry, 
  onGoHome, 
  className 
}: FriendlyErrorProps) {
  if (!error) return null;

  const config = errorConfigs[type];
  const messages = config.getMessages(error);
  const errorInfo = messages[error] || messages.default || {
    title: "Error Inesperado",
    description: error,
    suggestions: ["Intenta nuevamente", "Contacta soporte si el problema persiste"]
  };

  const IconComponent = config.icon;

  return (
    <Alert className={cn("border-destructive/50 bg-destructive/5", className)}>
      <div className="flex items-start space-x-3">
        <IconComponent className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-destructive mb-1">
            {errorInfo.title}
          </h4>
          <AlertDescription className="text-sm text-muted-foreground mb-3">
            {errorInfo.description}
          </AlertDescription>
          
          {errorInfo.suggestions && (
            <ul className="text-xs text-muted-foreground space-y-1 mb-4">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-primary/60 rounded-full" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          )}
          
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Reintentar
              </Button>
            )}
            
            {onGoHome && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onGoHome}
                className="h-8"
              >
                <Home className="h-3 w-3 mr-2" />
                Ir al Inicio
              </Button>
            )}
          </div>
        </div>
      </div>
    </Alert>
  );
}

// Simplified error toast for quick notifications
export function useErrorToast() {
  const { toast } = require('@/hooks/use-toast');
  
  return {
    showError: (error: string, type: 'auth' | 'google' | 'admin' | 'session' | 'network' = 'auth') => {
      const config = errorConfigs[type];
      const messages = config.getMessages(error);
      const errorInfo = messages[error] || messages.default;
      
      toast({
        title: errorInfo?.title || "Error",
        description: errorInfo?.description || error,
        variant: "destructive",
      });
    }
  };
}