import React from 'react';
import { Loader2, Shield, Coffee, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FriendlyLoadingStateProps {
  type: 'auth' | 'admin' | 'signin' | 'redirect' | 'permissions';
  message?: string;
  className?: string;
}

const loadingMessages = {
  auth: {
    icon: Coffee,
    primary: "Preparando tu experiencia...",
    secondary: "Configurando todo para ti"
  },
  admin: {
    icon: Shield,
    primary: "Verificando acceso administrativo...",
    secondary: "Casi listo para el panel de administración"
  },
  signin: {
    icon: Sparkles,
    primary: "Iniciando sesión...",
    secondary: "Validando credenciales"
  },
  redirect: {
    icon: Coffee,
    primary: "Redirigiendo...",
    secondary: "Llevándote al lugar correcto"
  },
  permissions: {
    icon: Shield,
    primary: "Configurando permisos...",
    secondary: "Personalizando tu experiencia"
  }
};

export function FriendlyLoadingState({ type, message, className }: FriendlyLoadingStateProps) {
  const config = loadingMessages[type];
  const IconComponent = config.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[200px] text-center p-8",
      className
    )}>
      <div className="relative mb-6">
        <div className="animate-spin">
          <Loader2 className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <IconComponent className="h-4 w-4 text-primary/60" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {message || config.primary}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-xs">
        {config.secondary}
      </p>
      
      <div className="mt-4 flex space-x-1">
        <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}

interface SmartLoadingOverlayProps {
  isVisible: boolean;
  type: 'auth' | 'admin' | 'signin' | 'redirect' | 'permissions';
  message?: string;
}

export function SmartLoadingOverlay({ isVisible, type, message }: SmartLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg">
        <FriendlyLoadingState type={type} message={message} />
      </div>
    </div>
  );
}

// Quick inline loading for smaller components
export function InlineLoader({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}