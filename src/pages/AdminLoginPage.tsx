import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Roles } from '@/constants/roles';

export function AdminLoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingRole, setIsVerifyingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated and verify admin role
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && !isVerifyingRole) {
      verifyAdminRole();
    }
  }, [auth.isAuthenticated, auth.user]);

  const verifyAdminRole = async () => {
    if (!auth.user) return;
    
    setIsVerifyingRole(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', auth.user.id)
        .eq('role', Roles.ADMIN)
        .single();

      if (error || !data) {
        setError('Acceso denegado: Solo los administradores pueden acceder a este portal.');
        toast({
          title: "Acceso denegado",
          description: "Tu cuenta no tiene permisos de administrador.",
          variant: "destructive"
        });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Error verifying admin role:', err);
      setError('Error al verificar permisos de administrador.');
    } finally {
      setIsVerifyingRole(false);
    }
  };

  // Show loading state
  if (auth.loading || isVerifyingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-orange-600 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              {isVerifyingRole ? 'Verificando permisos...' : 'Cargando...'}
            </h2>
            <p className="text-muted-foreground">
              {isVerifyingRole ? 'Validando acceso de administrador' : 'Iniciando sesión'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error } = await auth.signInWithEmail(email, password);
      if (error) {
        setError('Credenciales incorrectas o problema de conexión.');
        toast({
          title: "Error de autenticación",
          description: error.message,
          variant: "destructive"
        });
      }
      // Role verification will happen in useEffect after successful login
    } catch (error) {
      console.error('Admin login failed:', error);
      setError('Error inesperado durante el login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error } = await auth.signInWithGoogle();
      if (error) {
        setError('Error con el login de Google.');
        toast({
          title: "Error de Google",
          description: error.message,
          variant: "destructive"
        });
      }
      // Role verification will happen in useEffect after successful login
    } catch (error) {
      console.error('Admin Google login failed:', error);
      setError('Error inesperado con Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (auth.user) {
      verifyAdminRole();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Acceso exclusivo para administradores
          </p>
        </div>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Acceso Administrativo</CardTitle>
            <CardDescription className="text-center">
              Ingrese sus credenciales de administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {(error || auth.error) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || auth.error}
                  {error && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-6 px-2"
                      onClick={handleRetry}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reintentar
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Access Denied Message */}
            {auth.isAuthenticated && !isVerifyingRole && error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Si necesitas acceso como administrador, contacta al equipo técnico.</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/login')}
                    >
                      Ir al login principal
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email de Administrador</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@tupahub.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
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
                className="w-full bg-orange-600 hover:bg-orange-700" 
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? 'Verificando acceso...' : 'Acceder como Admin'}
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
              className="w-full border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/10"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Acceso Admin con Google
            </Button>

            {/* Links */}
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                ¿Eres propietario de cafetería?{' '}
                <a 
                  href="/login" 
                  className="text-orange-600 hover:underline"
                >
                  Accede aquí
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© 2024 TUPÁ Hub. Panel de administración.</p>
        </div>
      </div>
    </div>
  );
}