import { useState } from 'react';
import { sanitizeEmail, sanitizePassword } from '@/utils/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Lock, Coffee, TrendingUp, Shield, Users, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const toastNotifications = useToastNotifications();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email requerido');
      return false;
    }
    if (!password.trim()) {
      setError('Contraseña requerida');
      return false;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (error) throw error;

        toastNotifications.showSuccess('Cuenta creada exitosamente. Revisa tu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toastNotifications.showLoginSuccess();
        navigate('/app');
        onLoginSuccess?.();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'Error de autenticación';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email ya está registrado. Intenta iniciar sesión';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email no confirmado. Revisa tu bandeja de entrada';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toastNotifications.showLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, text: "Analytics avanzados en tiempo real" },
    { icon: Shield, text: "Seguridad enterprise garantizada" },
    { icon: Users, text: "Colaboración sin límites" },
    { icon: Coffee, text: "Gestión integral del café" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 bg-background relative">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Button>

        <div className="w-full max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Coffee className="h-10 w-10 text-primary mr-3" />
              <span className="text-3xl font-bold text-primary">TUPÁ Hub</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isSignUp ? 'Crear cuenta' : 'Bienvenido de vuelta'}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp 
                ? 'Únete a cientos de empresas que confían en nosotros' 
                : 'Accede a tu plataforma de gestión cafetera'}
            </p>
          </div>

          {/* Form */}
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                        className="pl-10 h-12"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                        className="pl-10 h-12"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...'}
                    </>
                  ) : (
                    isSignUp ? 'Crear mi cuenta' : 'Iniciar sesión'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                    }}
                    disabled={loading}
                    className="text-sm"
                  >
                    {isSignUp 
                      ? '¿Ya tienes cuenta? Inicia sesión' 
                      : '¿No tienes cuenta? Regístrate gratis'}
                  </Button>
                </div>

                {isSignUp && (
                  <div className="text-xs text-muted-foreground text-center">
                    Al crear una cuenta, aceptas nuestros{' '}
                    <a href="#" className="text-primary hover:underline">Términos de Servicio</a>{' '}
                    y{' '}
                    <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: "url('data:image/svg+xml,<svg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"none\" fill-rule=\"evenodd\"><g fill=\"%23ffffff\" fill-opacity=\"0.1\"><circle cx=\"30\" cy=\"30\" r=\"2\"/></g></g></svg>')"}}></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
              Trusted by 500+ Companies
            </Badge>
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              La plataforma que
              <br />
              <span className="text-accent">revoluciona</span>
              <br />
              la industria del café
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Conecta tostadores y cafeterías con tecnología de vanguardia. 
              Optimiza procesos, mejora la calidad y maximiza los resultados.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-lg opacity-90">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-75">Cafeterías activas</div>
            </div>
            <div>
              <div className="text-3xl font-bold">95%</div>
              <div className="text-sm opacity-75">Satisfacción</div>
            </div>
            <div>
              <div className="text-3xl font-bold">2M+</div>
              <div className="text-sm opacity-75">Transacciones</div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-20 right-40 w-32 h-32 bg-white/5 rounded-full"></div>
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-accent/30 rounded-full"></div>
      </div>
    </div>
  );
}