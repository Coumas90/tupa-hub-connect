import React, { useState } from 'react';
import { CaptchaProtectedForm } from '@/components/forms/CaptchaProtectedForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, TestTube, Activity } from 'lucide-react';
import { getRateLimitStats, resetRateLimit } from '@/lib/middleware/spam-protection';
import { toast } from 'sonner';

export default function SpamProtectionDemo() {
  const [submissions, setSubmissions] = useState<Array<{
    id: string;
    message: string;
    timestamp: string;
    captchaUsed: boolean;
  }>>([]);
  const [stats, setStats] = useState(getRateLimitStats());

  const handleFormSubmit = async (data: { message: string; captcha?: string }) => {
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      message: data.message,
      timestamp: new Date().toLocaleTimeString(),
      captchaUsed: !!data.captcha
    };
    
    setSubmissions(prev => [newSubmission, ...prev.slice(0, 9)]);
    setStats(getRateLimitStats());
    
    toast.success('Mensaje enviado correctamente');
  };

  const runStressTest = async () => {
    toast.info('Ejecutando test de estrés...');
    
    // Simular múltiples envíos desde diferentes IPs
    const testIPs = Array.from({ length: 10 }, (_, i) => `192.168.${Math.floor(i/5) + 1}.${i % 5 + 1}`);
    
    for (const ip of testIPs) {
      for (let i = 0; i < 7; i++) {
        // Simular check de rate limit
        setTimeout(() => {
          resetRateLimit(ip); // Simulación
        }, i * 100);
      }
    }
    
    setTimeout(() => {
      setStats(getRateLimitStats());
      toast.success('Test de estrés completado');
    }, 2000);
  };

  const resetAllLimits = () => {
    // En implementación real, esto haría una limpieza completa
    setStats({ totalIPs: 0, blockedIPs: 0, captchaRequired: 0 });
    toast.success('Límites reiniciados');
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Demo de Protección Anti-Spam
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sistema de protección con límite de 5 envíos/hora y CAPTCHA después de 3 intentos.
          Incluye documentación de políticas y pruebas de estrés.
        </p>
      </div>

      {/* Stats Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Estadísticas en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalIPs}</div>
              <div className="text-sm text-muted-foreground">IPs Monitoreadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{stats.captchaRequired}</div>
              <div className="text-sm text-muted-foreground">Requieren CAPTCHA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.blockedIPs}</div>
              <div className="text-sm text-muted-foreground">IPs Bloqueadas</div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 justify-center">
            <Button onClick={runStressTest} variant="outline" size="sm">
              <TestTube className="h-4 w-4 mr-2" />
              Test de Estrés
            </Button>
            <Button onClick={resetAllLimits} variant="outline" size="sm">
              Reiniciar Límites
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Demo */}
        <div className="space-y-6">
          <CaptchaProtectedForm 
            onSubmit={handleFormSubmit}
            title="Formulario Protegido"
            placeholder="Prueba el sistema de protección..."
          />
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Cómo funciona:</strong>
              <br />• Primeros 2 envíos: sin restricciones
              <br />• A partir del 3er envío: se requiere CAPTCHA
              <br />• Después de 5 envíos: bloqueo temporal de 1 hora
            </AlertDescription>
          </Alert>
        </div>

        {/* Submissions Log */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Envíos</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay envíos aún. Prueba el formulario.
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div 
                    key={submission.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {submission.timestamp}
                      </span>
                      {submission.captchaUsed && (
                        <Badge variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          CAPTCHA
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{submission.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Policy Documentation Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentación de Políticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Consulta la documentación completa de políticas anti-spam, criterios de bloqueo
            y proceso de apelación en el archivo ANTISPAM_POLICY.md del proyecto.
          </p>
          <div className="space-y-2 text-sm">
            <div><strong>Límites:</strong> 5 envíos por hora por IP</div>
            <div><strong>CAPTCHA:</strong> Requerido después de 3 intentos</div>
            <div><strong>Bloqueo:</strong> Temporal después de exceder límites</div>
            <div><strong>Apelaciones:</strong> Disponibles vía appeals@tupahub.com</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}