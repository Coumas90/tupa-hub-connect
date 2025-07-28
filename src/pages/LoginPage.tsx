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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const toastNotifications = useToastNotifications();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email requerido');
      return false;
    }
    if (!showForgotPassword && !password.trim()) {
      setError('Contraseña requerida');
      return false;
    }
    if (!showForgotPassword && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email requerido para recuperar contraseña');
      return;
    }

    setLoading(true);

    try {
      // Call our password reset edge function
      const { data, error } = await supabase.functions.invoke('password-reset', {
        body: { 
          email: email.trim(),
          resetUrl: `${window.location.origin}/auth/reset`
        }
      });

      if (error) {
        throw new Error(error.message || 'Error enviando email de recuperación');
      }

      setResetSent(true);
      toastNotifications.showSuccess('Email de recuperación enviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('Error al enviar email de recuperación. Intenta nuevamente.');
      toastNotifications.showLoginError('Error al enviar email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showForgotPassword) {
      handleForgotPassword(e);
      return;
    }

    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toastNotifications.showLoginSuccess();
      navigate('/app');
      onLoginSuccess?.();
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'Error de autenticación';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña';
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
    <div className="min-h-screen flex bg-gradient-to-br from-warm-cream/5 to-warm-gold/5">
      {/* Left Side - Visual with Characters */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Main Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-warm-primary via-warm-earth to-warm-accent"></div>
        
        {/* Animated Coffee Steam */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-2 h-20 bg-warm-cream/20 rounded-full animate-pulse"></div>
          <div className="absolute top-32 left-1/3 w-1 h-16 bg-warm-cream/15 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-24 right-1/3 w-1.5 h-18 bg-warm-cream/20 rounded-full animate-pulse delay-700"></div>
        </div>

        {/* Character Showcase */}
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="grid grid-cols-2 gap-12 p-16">
            <div className="group relative">
              <div className="absolute -inset-4 bg-warm-gold/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-warm-cream/10 backdrop-blur-sm rounded-2xl p-6 border border-warm-cream/20 transform hover:scale-105 transition-all duration-500">
                <img 
                  src="/lovable-uploads/0c926fb9-1671-49ea-8637-ea2bd44a302c.png" 
                  alt="Caficultor TUPÁ" 
                  className="w-full h-52 object-contain"
                />
                <div className="text-center mt-4">
                  <h3 className="text-warm-cream font-semibold text-lg">Don Carlos</h3>
                  <p className="text-warm-cream/80 text-sm">Huila, Colombia</p>
                </div>
              </div>
            </div>
            
            <div className="group relative mt-8">
              <div className="absolute -inset-4 bg-warm-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-warm-cream/10 backdrop-blur-sm rounded-2xl p-6 border border-warm-cream/20 transform hover:scale-105 transition-all duration-500">
                <img 
                  src="/lovable-uploads/7dcd3851-da8d-49d3-9b4b-a9633980df82.png" 
                  alt="Productor de café" 
                  className="w-full h-52 object-contain"
                />
                <div className="text-center mt-4">
                  <h3 className="text-warm-cream font-semibold text-lg">María Elena</h3>
                  <p className="text-warm-cream/80 text-sm">Antigua, Guatemala</p>
                </div>
              </div>
            </div>
            
            <div className="group relative -mt-4">
              <div className="absolute -inset-4 bg-warm-earth/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-warm-cream/10 backdrop-blur-sm rounded-2xl p-6 border border-warm-cream/20 transform hover:scale-105 transition-all duration-500">
                <img 
                  src="/lovable-uploads/23811a7b-920d-4c12-836e-92f0102bfb3e.png" 
                  alt="Tostador artesanal" 
                  className="w-full h-52 object-contain"
                />
                <div className="text-center mt-4">
                  <h3 className="text-warm-cream font-semibold text-lg">Joaquín</h3>
                  <p className="text-warm-cream/80 text-sm">Maestro Tostador</p>
                </div>
              </div>
            </div>
            
            <div className="group relative mt-4">
              <div className="absolute -inset-4 bg-warm-gold/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-warm-cream/10 backdrop-blur-sm rounded-2xl p-6 border border-warm-cream/20 transform hover:scale-105 transition-all duration-500">
                <img 
                  src="/lovable-uploads/37d919c1-7dd1-4049-834a-0bf16097bbfc.png" 
                  alt="Maestro cafetero" 
                  className="w-full h-52 object-contain"
                />
                <div className="text-center mt-4">
                  <h3 className="text-warm-cream font-semibold text-lg">Esperanza</h3>
                  <p className="text-warm-cream/80 text-sm">Nariño, Colombia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-warm-primary/95 to-transparent">
          <div className="text-warm-cream max-w-md">
            <Badge variant="secondary" className="mb-4 bg-warm-cream/20 text-warm-cream border-warm-cream/30 font-medium backdrop-blur-sm">
              Desde el origen hasta tu mesa
            </Badge>
            <h2 className="text-2xl font-bold mb-3 leading-tight font-display">
              Conectamos historias,
              <br />
              <span className="text-warm-accent">entregamos calidad</span>
            </h2>
            <p className="text-base opacity-90 leading-relaxed">
              Cada taza representa el trabajo de familias caficultoras comprometidas con la excelencia.
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-warm-gold/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-warm-accent/15 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-8 w-20 h-20 bg-warm-cream/10 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      {/* Right Side - Premium Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 xl:px-28 bg-background/80 backdrop-blur-sm relative">
        {/* Header Navigation */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Inicio
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Sistema activo
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Premium Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <Coffee className="h-12 w-12 text-warm-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-warm-accent rounded-full animate-pulse"></div>
              </div>
              <div className="ml-4">
                <span className="text-4xl font-bold text-warm-primary font-display">TUPÁ</span>
                <div className="text-xs text-warm-earth font-medium tracking-wider">HUB</div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-3 font-display bg-gradient-to-r from-warm-primary to-warm-earth bg-clip-text text-transparent">
              {showForgotPassword ? 'Recuperar Contraseña' : 'Bienvenido'}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {showForgotPassword 
                ? 'Ingresa tu email para recibir un enlace de recuperación' 
                : 'Tu plataforma de gestión cafetera te espera'}
            </p>
          </div>

          {/* Premium Form */}
          <Card className="border-0 shadow-2xl bg-white/50 backdrop-blur-sm">
            <CardContent className="p-10">
              {resetSent ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-warm-primary">Email enviado</h3>
                  <p className="text-muted-foreground">
                    Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
                    Revisa tu bandeja de entrada y sigue las instrucciones.
                  </p>
                  <Button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setEmail('');
                      setError('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-semibold text-warm-primary">Email corporativo</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-earth/60 group-focus-within:text-warm-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="director@tucafeteria.com"
                          value={email}
                          onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                          className="pl-12 h-14 text-lg border-warm-earth/20 focus:border-warm-primary bg-white/80 backdrop-blur-sm transition-all duration-300"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {!showForgotPassword && (
                      <div className="space-y-3">
                        <Label htmlFor="password" className="text-base font-semibold text-warm-primary">Contraseña</Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-warm-earth/60 group-focus-within:text-warm-primary transition-colors" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                            className="pl-12 h-14 text-lg border-warm-earth/20 focus:border-warm-primary bg-white/80 backdrop-blur-sm transition-all duration-300"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-warm-primary to-warm-earth hover:from-warm-earth hover:to-warm-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        {showForgotPassword ? 'Enviando email...' : 'Verificando credenciales...'}
                      </>
                    ) : (
                      <>
                        {showForgotPassword ? 'Enviar enlace de recuperación' : 'Acceder a mi Hub'}
                        <Coffee className="ml-3 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-4">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setShowForgotPassword(!showForgotPassword);
                        setError('');
                        setPassword('');
                      }}
                      disabled={loading}
                      className="text-base text-warm-earth hover:text-warm-primary transition-colors"
                    >
                      {showForgotPassword 
                        ? 'Volver al inicio de sesión' 
                        : '¿Olvidaste tu contraseña?'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-warm-primary" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-warm-primary" />
                <span>Verificado</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4 text-warm-primary" />
                <span>500+ empresas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}