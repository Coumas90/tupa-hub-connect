
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserWithRole } from '@/hooks/useUserWithRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Shield, Users, TrendingUp } from 'lucide-react';
import { ContextualLoading } from '@/components/ui/loading-states';

export function OnboardingPage() {
  const { user, orgId, isLoading, isAdmin } = useUserWithRole();

  // Loading state - but check for admin from metadata first
  const quickAdminCheck = user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin';
  
  // If we can quickly determine it's an admin, redirect immediately
  if (quickAdminCheck && !isLoading) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 bg-warm-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Coffee className="h-8 w-8 text-warm-primary animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-warm-primary mb-2">
              Configurando tu espacio de trabajo
            </h2>
            <p className="text-muted-foreground">
              Estamos preparando todo para ti...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin users go directly to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If user has org, continue to location onboarding
  if (orgId) {
    return <Navigate to="/onboarding/location" replace />;
  }

  // If no org assigned and not admin, show waiting message (this should rarely happen in B2B)
  // But don't show this if we're still determining admin status
  if (quickAdminCheck) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-cream/5 to-warm-gold/5 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-warm-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coffee className="h-8 w-8 text-warm-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-warm-primary">
            Acceso Pendiente
          </CardTitle>
          <CardDescription className="text-lg">
            Tu cuenta está siendo configurada por nuestro equipo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-warm-cream/10 rounded-lg p-6 text-center">
            <Shield className="h-12 w-12 text-warm-earth mx-auto mb-4" />
            <h3 className="font-semibold text-warm-primary mb-2">
              ¡Ya casi estás listo!
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Hemos recibido tu registro y nuestro equipo está configurando tu organización. 
              Recibirás un email de confirmación en las próximas horas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <Users className="h-8 w-8 text-warm-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-warm-primary">Gestión de Equipo</p>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-warm-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-warm-primary">Analytics Avanzados</p>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>¿Necesitas ayuda inmediata?</p>
            <a 
              href="mailto:soporte@tupa.ar" 
              className="text-warm-primary hover:text-warm-earth font-medium transition-colors"
            >
              soporte@tupa.ar
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
