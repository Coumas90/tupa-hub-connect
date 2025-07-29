import { Loader2, Shield, Coffee, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <Loader2 
      className={cn("animate-spin", sizeClasses[size], className)} 
    />
  );
}

interface ContextualLoadingProps {
  type: 'auth' | 'role' | 'location' | 'admin' | 'general';
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ContextualLoading({ 
  type, 
  message, 
  size = "md", 
  className 
}: ContextualLoadingProps) {
  const getIcon = () => {
    switch (type) {
      case 'auth':
        return <User className="h-6 w-6 text-primary" />;
      case 'role':
        return <Shield className="h-6 w-6 text-primary" />;
      case 'location':
        return <Building2 className="h-6 w-6 text-primary" />;
      case 'admin':
        return <Shield className="h-6 w-6 text-orange-500" />;
      default:
        return <Coffee className="h-6 w-6 text-primary" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'auth':
        return 'Verificando autenticación...';
      case 'role':
        return 'Validando permisos...';
      case 'location':
        return 'Cargando información de ubicación...';
      case 'admin':
        return 'Verificando acceso administrativo...';
      default:
        return 'Cargando...';
    }
  };

  return (
    <div className={cn("flex items-center justify-center min-h-screen", className)}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          {getIcon()}
          <LoadingSpinner size={size} />
        </div>
        <p className="text-muted-foreground">
          {message || getDefaultMessage()}
        </p>
      </div>
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
  message?: string;
  className?: string;
}

export function PageLoading({ 
  title = "Cargando", 
  message = "Preparando la experiencia TUPÁ...",
  className 
}: PageLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-screen bg-background", className)}>
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-2xl animate-pulse" />
          <Coffee className="relative h-16 w-16 mx-auto text-primary animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
        <LoadingSpinner size="lg" className="mx-auto" />
      </div>
    </div>
  );
}