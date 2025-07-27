import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, RefreshCw } from 'lucide-react';
import { checkRateLimit, validateCaptcha } from '@/lib/middleware/spam-protection';

interface CaptchaProtectedFormProps {
  onSubmit: (data: { message: string; captcha?: string }) => Promise<void>;
  title?: string;
  placeholder?: string;
}

export function CaptchaProtectedForm({ 
  onSubmit, 
  title = "Enviar Mensaje",
  placeholder = "Escribe tu mensaje..."
}: CaptchaProtectedFormProps) {
  const [message, setMessage] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetTime: number;
  } | null>(null);

  const generateMockCaptcha = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const [mockCaptchaText] = useState(generateMockCaptcha());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simular IP del usuario (en producción obtener IP real)
      const userIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
      
      // Verificar rate limit
      const rateLimitResult = checkRateLimit(userIP);
      
      if (!rateLimitResult.allowed) {
        const resetDate = new Date(rateLimitResult.resetTime);
        setError(`Límite excedido. Intenta de nuevo en: ${resetDate.toLocaleTimeString()}`);
        setRateLimitInfo({
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        });
        return;
      }

      // Verificar CAPTCHA si es requerido
      if (rateLimitResult.captchaRequired) {
        setCaptchaRequired(true);
        if (!captcha) {
          setError('Completa el CAPTCHA para continuar');
          return;
        }
        
        const captchaValid = validateCaptcha(captcha) || captcha === mockCaptchaText;
        if (!captchaValid) {
          setError('CAPTCHA incorrecto. Inténtalo de nuevo.');
          setCaptcha('');
          return;
        }
      }

      // Actualizar info de rate limit
      setRateLimitInfo({
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      });

      // Enviar formulario
      await onSubmit({ 
        message, 
        captcha: captchaRequired ? captcha : undefined 
      });
      
      setMessage('');
      setCaptcha('');
      setCaptchaRequired(rateLimitResult.captchaRequired);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const refreshCaptcha = () => {
    setCaptcha('');
    // En producción, solicitar nuevo CAPTCHA al servidor
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {title}
        </CardTitle>
        {rateLimitInfo && (
          <div className="text-sm text-muted-foreground">
            Envíos restantes: {rateLimitInfo.remaining}/5 esta hora
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              required
              disabled={loading}
            />
          </div>

          {captchaRequired && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-muted p-3 rounded font-mono text-lg tracking-widest select-none">
                  {mockCaptchaText}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={refreshCaptcha}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value.toUpperCase())}
                placeholder="Ingresa el código CAPTCHA"
                maxLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Se requiere CAPTCHA después de 3 intentos
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !message.trim()}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}