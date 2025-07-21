import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileCheck,
  Bug,
  TestTube
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  assertions?: number;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'completed';
  progress: number;
}

const mockTestSuites: TestSuite[] = [
  {
    id: 'filters-charts',
    name: 'Filtros y Gráficos',
    description: 'Pruebas de filtros de consumo y visualización de gráficos',
    status: 'pending',
    progress: 0,
    tests: [
      { id: 'filter-display', name: 'Mostrar opciones de filtros', status: 'pending', assertions: 12 },
      { id: 'coffee-variety-filter', name: 'Aplicar filtro de variedad de café', status: 'pending', assertions: 8 },
      { id: 'format-filter', name: 'Aplicar filtro de formato', status: 'pending', assertions: 6 },
      { id: 'date-range-filter', name: 'Aplicar filtro de rango de fechas', status: 'pending', assertions: 10 },
      { id: 'clear-filters', name: 'Limpiar todos los filtros', status: 'pending', assertions: 5 },
      { id: 'chart-display', name: 'Mostrar componentes de gráficos', status: 'pending', assertions: 15 },
      { id: 'chart-period', name: 'Cambiar período de gráficos', status: 'pending', assertions: 4 },
      { id: 'chart-export', name: 'Exportar gráfico como PNG', status: 'pending', assertions: 3 },
      { id: 'chart-tooltips', name: 'Mostrar tooltips en gráficos', status: 'pending', assertions: 7 },
      { id: 'responsive-design', name: 'Diseño responsivo', status: 'pending', assertions: 9 }
    ]
  },
  {
    id: 'pos-sync-errors',
    name: 'Sincronización POS y Errores',
    description: 'Pruebas de sincronización con POS y manejo de errores',
    status: 'pending',
    progress: 0,
    tests: [
      { id: 'sync-success', name: 'Sincronización exitosa', status: 'pending', assertions: 8 },
      { id: 'sync-progress', name: 'Mostrar progreso de sincronización', status: 'pending', assertions: 6 },
      { id: 'sync-partial', name: 'Sincronización parcial con advertencias', status: 'pending', assertions: 10 },
      { id: 'sync-failure', name: 'Manejo de fallas completas', status: 'pending', assertions: 7 },
      { id: 'sync-timeout', name: 'Manejo de timeout de red', status: 'pending', assertions: 4 },
      { id: 'sync-paused', name: 'Escenario de sincronización pausada', status: 'pending', assertions: 5 },
      { id: 'sync-retry', name: 'Reintento manual después de falla', status: 'pending', assertions: 8 },
      { id: 'data-loading-error', name: 'Error de carga de datos', status: 'pending', assertions: 6 },
      { id: 'auth-error', name: 'Error de autenticación', status: 'pending', assertions: 4 },
      { id: 'validation-error', name: 'Errores de validación en filtros', status: 'pending', assertions: 5 }
    ]
  },
  {
    id: 'toast-validation',
    name: 'Validación de Notificaciones',
    description: 'Pruebas de estructura, contenido y comportamiento de toasts',
    status: 'pending',
    progress: 0,
    tests: [
      { id: 'toast-container', name: 'Estructura del contenedor de toasts', status: 'pending', assertions: 4 },
      { id: 'success-toast-structure', name: 'Estructura de toast de éxito', status: 'pending', assertions: 12 },
      { id: 'error-toast-structure', name: 'Estructura de toast de error', status: 'pending', assertions: 11 },
      { id: 'warning-toast-structure', name: 'Estructura de toast de advertencia', status: 'pending', assertions: 10 },
      { id: 'success-content-accuracy', name: 'Precisión del contenido de éxito', status: 'pending', assertions: 6 },
      { id: 'error-content-accuracy', name: 'Precisión del contenido de error', status: 'pending', assertions: 8 },
      { id: 'auto-dismiss-timing', name: 'Tiempo de auto-descarte', status: 'pending', assertions: 3 },
      { id: 'persistent-error-behavior', name: 'Comportamiento persistente de errores', status: 'pending', assertions: 4 },
      { id: 'toast-stacking', name: 'Apilamiento de toasts', status: 'pending', assertions: 7 },
      { id: 'toast-animations', name: 'Animaciones de toasts', status: 'pending', assertions: 5 },
      { id: 'toast-accessibility', name: 'Accesibilidad de toasts', status: 'pending', assertions: 9 },
      { id: 'content-sanitization', name: 'Sanitización de contenido', status: 'pending', assertions: 6 }
    ]
  }
];

export function ConsumptionQARunner() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>(mockTestSuites);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSuite, setCurrentSuite] = useState<string | null>(null);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const { toast } = useToast();

  const runAllTests = async () => {
    setIsRunning(true);
    toast({
      title: "Iniciando pruebas QA",
      description: "Ejecutando suite completa de pruebas del módulo de consumo",
    });

    for (const suite of testSuites) {
      await runTestSuite(suite.id);
    }

    setIsRunning(false);
    setCurrentSuite(null);
    setCurrentTest(null);

    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = testSuites.reduce((sum, suite) => 
      sum + suite.tests.filter(test => test.status === 'passed').length, 0
    );

    toast({
      title: "Pruebas completadas",
      description: `${passedTests}/${totalTests} pruebas pasaron exitosamente`,
      variant: passedTests === totalTests ? "default" : "destructive"
    });
  };

  const runTestSuite = async (suiteId: string) => {
    setCurrentSuite(suiteId);
    
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'running', progress: 0 }
        : suite
    ));

    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      setCurrentTest(test.id);
      
      // Update test status to running
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id ? { ...t, status: 'running' } : t
              )
            }
          : s
      ));

      // Simulate test execution
      const result = await simulateTestExecution(test);
      
      // Update test with result
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id ? { ...t, ...result } : t
              ),
              progress: Math.round(((i + 1) / s.tests.length) * 100)
            }
          : s
      ));
    }

    // Mark suite as completed
    setTestSuites(prev => prev.map(suite => 
      suite.id === suiteId 
        ? { ...suite, status: 'completed' }
        : suite
    ));
  };

  const simulateTestExecution = async (test: TestResult): Promise<Partial<TestResult>> => {
    // Simulate test duration
    const duration = Math.random() * 2000 + 500; // 500ms to 2.5s
    await new Promise(resolve => setTimeout(resolve, duration));

    // Simulate test results (90% pass rate)
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        status: 'passed',
        duration: Math.round(duration),
        error: undefined
      };
    } else {
      const errors = [
        'Elemento no encontrado en el DOM',
        'Tiempo de espera agotado',
        'Aserción falló: valor esperado no coincide',
        'Error de red simulado',
        'Elemento no visible',
        'Valor de atributo incorrecto'
      ];
      
      return {
        status: 'failed',
        duration: Math.round(duration),
        error: errors[Math.floor(Math.random() * errors.length)]
      };
    }
  };

  const stopTests = () => {
    setIsRunning(false);
    setCurrentSuite(null);
    setCurrentTest(null);
    
    // Reset all running tests to pending
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'pending',
      progress: 0,
      tests: suite.tests.map(test => 
        test.status === 'running' 
          ? { ...test, status: 'pending' }
          : test
      )
    })));

    toast({
      title: "Pruebas detenidas",
      description: "Ejecución de pruebas cancelada por el usuario",
      variant: "destructive"
    });
  };

  const resetTests = () => {
    setTestSuites(mockTestSuites.map(suite => ({
      ...suite,
      status: 'pending',
      progress: 0,
      tests: suite.tests.map(test => ({
        ...test,
        status: 'pending',
        duration: undefined,
        error: undefined
      }))
    })));

    toast({
      title: "Pruebas reiniciadas",
      description: "Todos los resultados han sido limpiados",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline',
      skipped: 'secondary'
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status === 'passed' && 'Pasó'}
        {status === 'failed' && 'Falló'}
        {status === 'running' && 'Ejecutando'}
        {status === 'pending' && 'Pendiente'}
        {status === 'skipped' && 'Omitido'}
      </Badge>
    );
  };

  const getTotalStats = () => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    return {
      total: allTests.length,
      passed: allTests.filter(test => test.status === 'passed').length,
      failed: allTests.filter(test => test.status === 'failed').length,
      running: allTests.filter(test => test.status === 'running').length,
      pending: allTests.filter(test => test.status === 'pending').length
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6" data-testid="consumption-qa-runner">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TestTube className="h-6 w-6 text-primary" />
            QA Módulo de Consumo
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Suite de pruebas automatizadas para filtros, gráficos, sincronización POS y notificaciones
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="gap-2"
            data-testid="run-all-tests-button"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Ejecutando...' : 'Ejecutar Todas'}
          </Button>
          
          {isRunning && (
            <Button 
              onClick={stopTests} 
              variant="destructive" 
              className="gap-2"
              data-testid="stop-tests-button"
            >
              <Square className="h-4 w-4" />
              Detener
            </Button>
          )}
          
          <Button 
            onClick={resetTests} 
            variant="outline" 
            className="gap-2"
            data-testid="reset-tests-button"
          >
            <RefreshCw className="h-4 w-4" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Resumen de Pruebas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-sm text-muted-foreground">Pasaron</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Fallaron</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              <div className="text-sm text-muted-foreground">Ejecutando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pendientes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Suites */}
      <div className="grid gap-6">
        {testSuites.map((suite) => (
          <Card key={suite.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(suite.status)}
                    {suite.name}
                    {getStatusBadge(suite.status)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suite.description}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {suite.tests.filter(t => t.status === 'passed').length} / {suite.tests.length}
                  </div>
                  <div className="text-xs text-muted-foreground">pruebas pasaron</div>
                </div>
              </div>
              
              {suite.status === 'running' && (
                <div className="space-y-2">
                  <Progress value={suite.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {suite.progress}% completado
                    {currentSuite === suite.id && currentTest && (
                      <span className="ml-2">
                        • Ejecutando: {suite.tests.find(t => t.id === currentTest)?.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {suite.tests.map((test, index) => (
                  <div key={test.id}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <span className="text-sm font-medium">{test.name}</span>
                        {test.assertions && (
                          <Badge variant="outline" className="text-xs">
                            {test.assertions} aserciones
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {test.duration && (
                          <span className="text-xs text-muted-foreground">
                            {test.duration}ms
                          </span>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>
                    
                    {test.error && (
                      <div className="ml-7 mb-2">
                        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                          <Bug className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-red-800">{test.error}</span>
                        </div>
                      </div>
                    )}
                    
                    {index < suite.tests.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}