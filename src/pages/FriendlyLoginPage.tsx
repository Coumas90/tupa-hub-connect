import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coffee, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { FriendlyErrorHandler } from '@/components/auth/FriendlyErrorHandler';
import { useFriendlyAuth } from '@/contexts/FriendlyAuthProvider';
import { cn } from '@/lib/utils';

export default function FriendlyLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    signInWithEmail,
    signInWithGoogle,
    loading,
    error,
    authProgress,
    statusMessage,
    isReady,
    user,
    clearError
  } = useFriendlyAuth();

  // Auto-redirect when ready
  useEffect(() => {
    if (isReady && user) {
      // Small delay for smooth UX
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 500);
    }
  }, [isReady, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || loading) return;

    try {
      await signInWithEmail(formData.email, formData.password);
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error is handled by the context
    }
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
              <Mail className="h-5 w-5 mr-3" />
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
                onClick={() => navigate('/password-reset')}
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
      </div>
    </div>
  );
}