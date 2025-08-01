import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coffee, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { FriendlyErrorHandler } from './FriendlyErrorHandler';
import { SmartLoadingOverlay } from './FriendlyLoadingStates';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { cn } from '@/lib/utils';

export default function EnhancedLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const {
    smartSignIn,
    smartRetry,
    isLoading,
    hasError,
    lastError,
    errorType,
    canRetry,
    authProgress,
    statusMessage,
    isAuthenticated,
    isReady
  } = useSmartAuth();

  // Redirect when ready
  React.useEffect(() => {
    if (isAuthenticated && isReady) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isReady, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    try {
      await smartSignIn('email', formData.email, formData.password);
    } catch (error) {
      // Error is handled by useSmartAuth
      console.error('Login failed:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await smartSignIn('google');
    } catch (error) {
      // Error is handled by useSmartAuth
      console.error('Google login failed:', error);
    }
  };

  return (
    <>
      <SmartLoadingOverlay 
        isVisible={isLoading}
        type={isLoading ? 'signin' : 'auth'}
        message={statusMessage}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Coffee className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignUp ? 'Crear Cuenta' : 'Bienvenido de Vuelta'}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp 
                ? 'Únete a nuestra plataforma de gestión' 
                : 'Inicia sesión en tu cuenta'
              }
            </p>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="space-y-2">
              <Progress value={authProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {statusMessage}
              </p>
            </div>
          )}

          <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">
                {isSignUp ? 'Registro' : 'Iniciar Sesión'}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp 
                  ? 'Completa la información para crear tu cuenta'
                  : 'Ingresa tus credenciales para continuar'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Display */}
              {hasError && (
                <FriendlyErrorHandler
                  error={lastError}
                  type={errorType || 'auth'}
                  onRetry={canRetry ? smartRetry : undefined}
                  onGoHome={() => navigate('/')}
                />
              )}

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Mail className="h-4 w-4 mr-2" />
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
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
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
                  className="w-full h-11"
                  disabled={isLoading || !formData.email || !formData.password}
                >
                  {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </Button>
              </form>

              {/* Toggle Mode */}
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={isLoading}
                >
                  {isSignUp 
                    ? '¿Ya tienes cuenta? Inicia sesión'
                    : '¿No tienes cuenta? Regístrate'
                  }
                </button>
              </div>

              {/* Footer Links */}
              <div className="text-center space-y-2">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto"
                  onClick={() => navigate('/auth/reset')}
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
                
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block mx-auto"
                  onClick={() => navigate('/')}
                  disabled={isLoading}
                >
                  ← Volver al inicio
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Development Mode Indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-center">
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs">
                <Coffee className="h-3 w-3 mr-1" />
                Modo Desarrollo Activo
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}