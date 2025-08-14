
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coffee, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { FriendlyErrorHandler } from '@/components/auth/FriendlyErrorHandler';
import { useAuth } from '@/contexts/OptimizedAuthProvider';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import { cn } from '@/lib/utils';

export default function FriendlyLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const {
    signInWithEmail,
    signInWithGoogle,
    loading,
    error,
    user,
    clearError,
    isAuthenticated
  } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to="/app" replace />;
  }

  // Create simple loading states for compatibility
  const authProgress = loading ? 75 : 0;
  const statusMessage = loading ? "Validando credenciales..." : "";
  const isReady = isAuthenticated;

  // Auto-redirect when ready
  useEffect(() => {
    if (isReady && user) {
      // Small delay for smooth UX
      setTimeout(() => {
        navigate('/app');
      }, 500);
    }
  }, [isReady, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || loading) return;

    await signInWithEmail(formData.email, formData.password);
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    
    await signInWithGoogle();
  };

  const handleRetry = () => {
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className={cn(
              "p-4 rounded-full transition-all duration-500",
              loading ? "bg-primary/20 animate-pulse" : "bg-primary/10"
            )}>
              {loading ? (
                <Sparkles className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Coffee className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido de Vuelta
          </h1>
          <p className="text-muted-foreground">
            Inicia sesión para acceder a tu panel de administración
          </p>
        </div>

        {/* Progress Indicator */}
        {loading && (
          <div className="space-y-3">
            <Progress value={authProgress} className="h-2" />
            <div className="text-center">
              <p className="text-sm font-medium text-primary">
                {statusMessage}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {authProgress < 50 ? 'Validando...' : 
                 authProgress < 90 ? 'Configurando...' : 'Finalizando...'}
              </p>
            </div>
          </div>
        )}

        <Card className={cn(
          "shadow-xl border-0 transition-all duration-300",
          loading ? "bg-card/60 backdrop-blur-sm" : "bg-card/90 backdrop-blur-sm"
        )}>
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl text-center">
              Panel de Administración
            </CardTitle>
            <CardDescription className="text-center">
              Usa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Display */}
            {error && (
              <FriendlyErrorHandler
                error={error}
                type="auth"
                onRetry={handleRetry}
                onGoHome={() => navigate('/')}
              />
            )}

            {/* Success State */}
            {isReady && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  ¡Acceso autorizado! Redirigiendo...
                </p>
              </div>
            )}

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoogleSignIn}
              disabled={loading || isReady}
            >
              <svg className="mr-3 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  o continúa con email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ejemplo.com"
                    className="pl-10 h-12 text-base"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={loading || isReady}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-12 h-12 text-base"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    disabled={loading || isReady}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || isReady}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={loading || isReady || !formData.email || !formData.password}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                    Iniciando sesión...
                  </>
                ) : isReady ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-3" />
                    Redirigiendo...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="text-center space-y-3">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowForgotPassword(true)}
                disabled={loading || isReady}
              >
                ¿Olvidaste tu contraseña?
              </button>
              
              <div className="border-t pt-3">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => navigate('/')}
                  disabled={loading || isReady}
                >
                  ← Volver al inicio
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Mode Indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium">
              <Coffee className="h-3 w-3 mr-2" />
              Modo Desarrollo Activado
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Email confirmación deshabilitada para testing
            </p>
          </div>
        )}
        
        {/* Admin Login Link */}
        <div className="mt-6 text-center">
          <a 
            href="/admin/auth" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ¿Eres administrador? Ingresa aquí
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      />
    </div>
  );
}
