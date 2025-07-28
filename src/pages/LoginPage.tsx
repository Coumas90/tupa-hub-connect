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
            emailRedirectTo: `${window.location.origin}/app`
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
      {/* Left Side - Visual with Characters */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-warm-primary via-warm-earth to-warm-accent relative overflow-hidden">
        {/* Character Images */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-8 opacity-90">
            <div className="relative">
              <img 
                src="/lovable-uploads/0c926fb9-1671-49ea-8637-ea2bd44a302c.png" 
                alt="Caficultor TUPÁ" 
                className="w-48 h-64 object-contain transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative mt-8">
              <img 
                src="/lovable-uploads/7dcd3851-da8d-49d3-9b4b-a9633980df82.png" 
                alt="Productor de café" 
                className="w-48 h-64 object-contain transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative -mt-4">
              <img 
                src="/lovable-uploads/23811a7b-920d-4c12-836e-92f0102bfb3e.png" 
                alt="Tostador artesanal" 
                className="w-48 h-64 object-contain transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative mt-4">
              <img 
                src="/lovable-uploads/37d919c1-7dd1-4049-834a-0bf16097bbfc.png" 
                alt="Maestro cafetero" 
                className="w-48 h-64 object-contain transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>

        {/* Coffee Bean Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-8 h-12 bg-warm-cream/30 rounded-full rotate-45"></div>
          <div className="absolute top-40 right-32 w-6 h-9 bg-warm-cream/20 rounded-full rotate-12"></div>
          <div className="absolute bottom-32 left-16 w-10 h-15 bg-warm-cream/25 rounded-full -rotate-30"></div>
          <div className="absolute bottom-48 right-20 w-7 h-10 bg-warm-cream/15 rounded-full rotate-60"></div>
          <div className="absolute top-1/2 left-1/3 w-5 h-8 bg-warm-cream/20 rounded-full -rotate-15"></div>
        </div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-16 bg-gradient-to-t from-warm-primary/90 to-transparent">
          <div className="text-warm-cream">
            <Badge variant="secondary" className="mb-4 bg-warm-cream/20 text-warm-cream border-warm-cream/30 font-medium">
              Desde el origen hasta tu mesa
            </Badge>
            <h2 className="text-3xl font-bold mb-4 leading-tight font-display">
              Conocé a nuestros
              <br />
              <span className="text-warm-accent bg-gradient-to-r from-warm-accent to-warm-gold bg-clip-text text-transparent">
                productores de café
              </span>
            </h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Cada grano cuenta una historia. Trabajamos directamente con caficultores 
              de toda Latinoamérica para traerte el mejor café de especialidad.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-16 right-16 w-24 h-24 bg-warm-gold/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-32 w-32 h-32 bg-warm-accent/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-8 w-16 h-16 bg-warm-earth/30 rounded-full blur-lg"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 bg-background relative">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="absolute top-8 right-8 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Button>

        <div className="w-full max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Coffee className="h-10 w-10 text-warm-primary mr-3" />
              <span className="text-3xl font-bold text-warm-primary font-display">TUPÁ Hub</span>
            </div>
            <h1 className="text-3xl font-bold mb-2 font-display">
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
                    <a href="#" className="text-warm-primary hover:underline">Términos de Servicio</a>{' '}
                    y{' '}
                    <a href="#" className="text-warm-primary hover:underline">Política de Privacidad</a>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}