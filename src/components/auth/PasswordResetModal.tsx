import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Clock, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PasswordResetModalProps {
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PasswordResetModal({ token, open, onOpenChange }: PasswordResetModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Validate token on mount
  useEffect(() => {
    if (!token || !open) return;
    
    validateToken();
  }, [token, open]);

  // Countdown timer
  useEffect(() => {
    if (!tokenValid || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTokenValid(false);
          setError('El enlace ha expirado. Solicita uno nuevo.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tokenValid, timeLeft]);

  const validateToken = async () => {
    setValidating(true);
    setError('');

    try {
      // Call edge function to validate token
      const { data, error } = await supabase.functions.invoke('validate-reset-token', {
        body: { token }
      });

      if (error || !data.valid) {
        setError(data?.message || 'Token inválido o expirado');
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setUserEmail(data.email);
        setTimeLeft(data.timeLeft || 0);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Error validando el token. Intenta nuevamente.');
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  const validatePassword = () => {
    if (!password) {
      setError('Contraseña requerida');
      return false;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) return;

    setLoading(true);

    try {
      // Call edge function to reset password
      const { data, error } = await supabase.functions.invoke('update-password', {
        body: { 
          token,
          newPassword: password 
        }
      });

      if (error || !data.success) {
        throw new Error(data?.message || 'Error actualizando contraseña');
      }

      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.",
      });

      // Close modal and redirect to login
      onOpenChange(false);
      navigate('/login');
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Error actualizando contraseña. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    onOpenChange(false);
    navigate('/login');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warm-primary">
            <Lock className="h-5 w-5" />
            Actualizar Contraseña
          </DialogTitle>
          <DialogDescription>
            Crea una nueva contraseña segura para tu cuenta
          </DialogDescription>
        </DialogHeader>

        {validating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-warm-primary" />
            <span className="ml-3 text-muted-foreground">Validando enlace...</span>
          </div>
        ) : !tokenValid ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enlace Inválido</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={handleClose} variant="outline" className="w-full">
              Solicitar nuevo enlace
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Timer */}
            {timeLeft > 0 && (
              <div className="bg-warm-cream/10 border border-warm-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-warm-primary">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Este enlace expira en: {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            )}

            {/* User Email */}
            <div className="text-sm text-muted-foreground">
              Actualizando contraseña para: <strong>{userEmail}</strong>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-warm-primary to-warm-earth hover:from-warm-earth hover:to-warm-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Actualizar Contraseña
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}