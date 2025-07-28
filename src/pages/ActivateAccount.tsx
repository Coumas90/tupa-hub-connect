import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Coffee, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isActivated, setIsActivated] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setTokenValid(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('invitation_tokens')
        .select(`
          *,
          cafes!inner(name)
        `)
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTokenValid(true);
        setTokenData(data);
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenValid(false);
    }
  };

  const activateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres"
      });
      return;
    }

    setLoading(true);

    try {
      // Update user password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password
      });

      if (passwordError) throw passwordError;

      // Mark token as used
      const { error: tokenError } = await supabase
        .from('invitation_tokens')
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('token', token);

      if (tokenError) throw tokenError;

      setIsActivated(true);
      
      toast({
        title: "¡Cuenta activada!",
        description: "Tu cuenta ha sido activada exitosamente. Serás redirigido al dashboard."
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Error activating account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al activar la cuenta"
      });
    } finally {
      setLoading(false);
    }
  };

  const requestNewInvitation = () => {
    toast({
      title: "Contactá a tu responsable",
      description: "Solicitá una nueva invitación a la persona que te invitó a TUPÁ Hub."
    });
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Coffee className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Validando invitación...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>Invitación inválida</CardTitle>
            <CardDescription>
              El enlace de invitación ha expirado, ya fue usado, o no es válido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={requestNewInvitation} className="w-full">
              Solicitar nueva invitación
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isActivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <CardTitle>¡Cuenta activada!</CardTitle>
            <CardDescription>
              Bienvenido a TUPÁ Hub. Serás redirigido al login en unos segundos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Coffee className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle>¡Bienvenido a TUPÁ Hub!</CardTitle>
          <CardDescription>
            Fuiste invitado a formar parte de <strong>{tokenData?.cafes?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Coffee className="h-4 w-4" />
            <AlertDescription>
              Define tu contraseña para acceder a todos los recursos de TUPÁ Hub.
            </AlertDescription>
          </Alert>

          <form onSubmit={activateAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña"
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmá tu contraseña"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Activando cuenta...' : 'Activar cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Al activar tu cuenta aceptás formar parte del equipo de {tokenData?.cafes?.name}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivateAccount;