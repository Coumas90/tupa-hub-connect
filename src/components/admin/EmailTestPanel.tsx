import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';

export default function EmailTestPanel() {
  const [email, setEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testEmailConfiguration = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Por favor ingresa un email válido'
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { email }
      });

      if (error) {
        setResult({
          success: false,
          message: 'Error llamando a la función de prueba',
          details: error.message
        });
        return;
      }

      setResult({
        success: data.success,
        message: data.message || (data.success ? 'Email enviado correctamente' : 'Error enviando email'),
        details: data.error || data.details
      });

    } catch (error: any) {
      setResult({
        success: false,
        message: 'Error inesperado',
        details: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Prueba de Configuración de Email
        </CardTitle>
        <CardDescription>
          Verifica que el sistema de emails esté funcionando correctamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={testing}
          />
          <Button 
            onClick={testEmailConfiguration}
            disabled={testing || !email}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Prueba'
            )}
          </Button>
        </div>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div>
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  <strong>{result.message}</strong>
                  {result.details && (
                    <div className="mt-1 text-sm opacity-80">
                      {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>¿Qué hace esta prueba?</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Verifica que la API key de Resend esté configurada</li>
            <li>Envía un email de prueba al correo especificado</li>
            <li>Confirma que el sistema de envío funciona correctamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}