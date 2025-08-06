import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { useAutoOrgAssignment } from '@/hooks/useAutoOrgAssignment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Coffee, AlertCircle, RefreshCw } from 'lucide-react';
import { ContextualLoading } from '@/components/ui/loading-states';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ClientLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStep, setLoginStep] = useState<'login' | 'assigning' | 'complete'>('login');

  // Auto-assign organization when user logs in
  const autoAssignment = useAutoOrgAssignment(auth.user?.id);

  // Handle successful authentication
  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      // Admin users go to admin panel
      if (auth.isAdmin) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // Regular users need org assignment
      setLoginStep('assigning');
    }
  }, [auth.isAuthenticated, auth.user, auth.isAdmin, navigate]);

  // Handle organization assignment completion
  useEffect(() => {
    if (loginStep === 'assigning' && !autoAssignment.loading) {
      if (autoAssignment.orgAssigned) {
        setLoginStep('complete');
        toast({
          title: "¡Login exitoso!",
          description: "Redirigiendo a tu panel de control...",
        });
        setTimeout(() => {
          navigate('/app', { replace: true });
        }, 1000);
      } else if (autoAssignment.error) {
        // Even if org assignment fails, allow user to continue
        setLoginStep('complete');
        setTimeout(() => {
          navigate('/app', { replace: true });
        }, 1000);
      }
    }
  }, [loginStep, autoAssignment, navigate, toast]);

  // Show loading states
  if (auth.loading || !auth.isInitialized) {
    return <ContextualLoading type="auth" message="Inicializando..." />;
  }

  if (loginStep === 'assigning') {
    return <ContextualLoading type="auth" message="Configurando tu espacio de trabajo..." />;
  }

  if (loginStep === 'complete') {
    return <ContextualLoading type="auth" message="¡Listo! Redirigiendo..." />;
  }

  // Redirect if already authenticated and assignment is complete
  if (auth.isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      const { error } = await auth.signInWithEmail(email, password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Error de login",
          description: getErrorMessage(error.message),
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar al servidor. Intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await auth.signInWithGoogle();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error con Google",
          description: getErrorMessage(error.message),
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar con Google. Intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorMessage = (error: string) => {
    if (error.includes('Invalid login credentials')) {
      return 'Email o contraseña incorrectos.';
    }
    if (error.includes('Email not confirmed')) {
      return 'Debes confirmar tu email antes de iniciar sesión.';
    }
    if (error.includes('Too many requests')) {
      return 'Demasiados intentos. Espera unos minutos.';
    }
    return 'Error de autenticación. Verifica tus credenciales.';
  };

  const handleRetry = () => {
    auth.clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Coffee className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">TUPÁ Hub</h1>
          </div>
          <p className="text-muted-foreground">
            Plataforma para cafeterías
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">
              Accede a tu espacio de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {auth.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{getErrorMessage(auth.error)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Assignment Error */}
            {autoAssignment.error && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No se pudo asignar organización automáticamente, pero puedes continuar.
                </AlertDescription>
              </Alert>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isSubmitting ? 'Conectando...' : 'Continuar con Google'}
            </Button>

            {/* Links */}
            <div className="text-center space-y-2">
              <a 
                href="/auth/reset" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
              <div className="text-sm text-muted-foreground">
                ¿Eres administrador?{' '}
                <a 
                  href="/admin/login" 
                  className="text-primary hover:underline"
                >
                  Accede aquí
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2024 TUPÁ Hub. Plataforma integral para cafeterías.</p>
        </div>
      </div>
    </div>
  );
}