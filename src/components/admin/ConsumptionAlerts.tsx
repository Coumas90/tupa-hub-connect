import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Brain, 
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AlertAnalysis {
  hasAbruptChange: boolean;
  isLowConsumption: boolean;
  standardDeviation: number;
  meanConsumption: number;
  currentVsAverage: number;
  lastRestockDays: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  insights: string[];
}

interface ConsumptionAlertsProps {
  className?: string;
}

export function ConsumptionAlerts({ className }: ConsumptionAlertsProps) {
  const [analysis, setAnalysis] = useState<AlertAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "No hay sesión activa",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('consumption-alerts', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setAnalysis(data.analysis);
        setLastUpdated(new Date());
        toast({
          title: "Análisis completado",
          description: "Alertas de consumo actualizadas con IA"
        });
      } else {
        throw new Error(data.error || 'Error en el análisis');
      }
    } catch (error: any) {
      console.error('Error fetching consumption analysis:', error);
      toast({
        title: "Error",
        description: error.message || "Error al obtener el análisis de consumo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-success';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      default: return 'Normal';
    }
  };

  const getRestockBadgeColor = (days: number) => {
    if (days > 20) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (days > 14) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (days > 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-success/10 text-success border-success/20';
  };

  if (!analysis && !loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay datos de análisis disponibles</p>
            <Button onClick={fetchAnalysis} className="mt-4">
              Ejecutar Análisis de IA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Refresh */}
      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center text-lg">
              <Brain className="h-5 w-5 mr-2" />
              Alertas de Consumo con IA
            </CardTitle>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Actualizado: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalysis}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading && (
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Analizando patrones de consumo...</p>
                <p className="text-sm text-muted-foreground">La IA está procesando los datos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          {/* Alert Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Severity Status */}
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Estado General</CardTitle>
                  {getSeverityIcon(analysis.severity)}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getSeverityColor(analysis.severity)}`}>
                  {getSeverityText(analysis.severity)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nivel de alerta actual
                </p>
              </CardContent>
            </Card>

            {/* Consumption Variance */}
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Variación vs Promedio</CardTitle>
                  {analysis.currentVsAverage >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  analysis.currentVsAverage >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {analysis.currentVsAverage >= 0 ? '+' : ''}{analysis.currentVsAverage}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Promedio: {analysis.meanConsumption}kg/día
                </p>
              </CardContent>
            </Card>

            {/* Last Restock Badge */}
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Última Reposición</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {analysis.lastRestockDays} días
                </div>
                <Badge className={`mt-2 text-xs ${getRestockBadgeColor(analysis.lastRestockDays)}`}>
                  {analysis.lastRestockDays > 20 ? 'Reposición urgente' :
                   analysis.lastRestockDays > 14 ? 'Planificar reposición' :
                   analysis.lastRestockDays > 7 ? 'En rango normal' : 'Recién repuesto'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Detection Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysis.hasAbruptChange && (
              <Alert className="border-orange-200 bg-orange-50">
                <Zap className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Cambio abrupto detectado:</strong> Se identificaron variaciones significativas 
                  (&gt;2σ) en el consumo. Desviación estándar: {analysis.standardDeviation}kg.
                </AlertDescription>
              </Alert>
            )}

            {analysis.isLowConsumption && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <TrendingDown className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Consumo bajo detectado:</strong> El consumo actual está 20% por debajo 
                  del promedio histórico de {analysis.meanConsumption}kg/día.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* AI Recommendation */}
          <Card className="shadow-warm border-primary/20">
            <CardHeader className="bg-gradient-light rounded-t-lg">
              <CardTitle className="flex items-center text-lg">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                Recomendación de IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-foreground mb-4 leading-relaxed">
                {analysis.recommendation}
              </p>
              
              {analysis.insights.length > 0 && (
                <>
                  <h4 className="font-semibold mb-3 text-foreground">Insights Clave:</h4>
                  <div className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Statistical Summary */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Resumen Estadístico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gradient-light rounded-lg">
                  <div className="text-lg font-semibold text-foreground">
                    {analysis.meanConsumption}kg
                  </div>
                  <div className="text-xs text-muted-foreground">Promedio diario</div>
                </div>
                <div className="text-center p-3 bg-gradient-light rounded-lg">
                  <div className="text-lg font-semibold text-foreground">
                    ±{analysis.standardDeviation}kg
                  </div>
                  <div className="text-xs text-muted-foreground">Desviación estándar</div>
                </div>
                <div className="text-center p-3 bg-gradient-light rounded-lg">
                  <div className="text-lg font-semibold text-foreground">
                    {analysis.hasAbruptChange ? 'Sí' : 'No'}
                  </div>
                  <div className="text-xs text-muted-foreground">Cambios abruptos</div>
                </div>
                <div className="text-center p-3 bg-gradient-light rounded-lg">
                  <div className="text-lg font-semibold text-foreground">
                    {analysis.isLowConsumption ? 'Sí' : 'No'}
                  </div>
                  <div className="text-xs text-muted-foreground">Consumo bajo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}