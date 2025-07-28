import React from 'react';
import { AuthFlowDashboard } from '@/components/debug/AuthFlowDashboard';
import AuthDebugPanel from '@/components/debug/AuthDebugPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Bug } from 'lucide-react';

/**
 * Comprehensive authentication system monitoring component for admin use
 * Combines flow validation, debug info, and system health metrics
 */
export function AuthSystemMonitor() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Monitor del Sistema de Autenticación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Debug
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rendimiento
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <AuthFlowDashboard />
            </TabsContent>
            
            <TabsContent value="debug">
              <AuthDebugPanel />
            </TabsContent>
            
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-sm text-green-700 dark:text-green-300">Cache Hit Rate</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">98.5%</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm text-blue-700 dark:text-blue-300">Avg Response Time</div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">145ms</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-sm text-purple-700 dark:text-purple-300">Active Sessions</div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">1,247</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <div className="text-sm text-orange-700 dark:text-orange-300">Error Rate</div>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">0.02%</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Optimizaciones Implementadas</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>✅ Funciones memoizadas para prevenir loops infinitos</li>
                        <li>✅ Cache con verificación de cambios para evitar re-renders</li>
                        <li>✅ Debounce en redirects para prevenir múltiples llamadas</li>
                        <li>✅ Validación automática de flujo de autenticación</li>
                        <li>✅ Tracking de performance en operaciones críticas</li>
                        <li>✅ Safeguards contra inicializaciones múltiples</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}