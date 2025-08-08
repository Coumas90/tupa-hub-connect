import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Coffee, 
  Users, 
  BarChart3, 
  Settings, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action?: string;
  href?: string;
  completed?: boolean;
}

interface ContextualOnboardingProps {
  userRole: string;
  isAdmin: boolean;
  onComplete?: () => void;
  className?: string;
}

const getOnboardingSteps = (userRole: string, isAdmin: boolean): OnboardingStep[] => {
  if (isAdmin) {
    return [
      {
        id: 'explore-dashboard',
        title: 'Explora tu Panel',
        description: 'Familiarízate con las métricas y controles principales',
        icon: BarChart3,
        action: 'Ver Dashboard',
        href: '/dashboard'
      },
      {
        id: 'manage-users',
        title: 'Gestiona Usuarios',
        description: 'Administra roles y permisos de tu equipo',
        icon: Users,
        action: 'Ver Usuarios',
        href: '/admin/users'
      },
      {
        id: 'configure-settings',
        title: 'Configura el Sistema',
        description: 'Personaliza configuraciones y integraciones',
        icon: Settings,
        action: 'Ir a Configuración',
        href: '/admin/settings'
      }
    ];
  }

  return [
    {
      id: 'setup-profile',
      title: 'Completa tu Perfil',
      description: 'Agrega información personal y preferencias',
      icon: Users,
      action: 'Editar Perfil',
      href: '/profile'
    },
    {
      id: 'explore-features',
      title: 'Explora las Funciones',
      description: 'Descubre todas las herramientas disponibles',
      icon: Coffee,
      action: 'Ver Funciones',
      href: '/dashboard'
    },
    {
      id: 'first-task',
      title: 'Completa tu Primera Tarea',
      description: 'Comienza a usar la plataforma con una tarea simple',
      icon: Target,
      action: 'Empezar',
      href: '/dashboard'
    }
  ];
};

export function ContextualOnboarding({ 
  userRole, 
  isAdmin, 
  onComplete, 
  className 
}: ContextualOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  const steps = getOnboardingSteps(userRole, isAdmin);
  const progress = (completedSteps.length / steps.length) * 100;

  useEffect(() => {
    // Load completed steps from localStorage
    const saved = localStorage.getItem('onboarding-completed');
    if (saved) {
      const completed = JSON.parse(saved);
      setCompletedSteps(completed);
      
      // Hide if all steps completed
      if (completed.length === steps.length) {
        setIsVisible(false);
      }
    }
  }, [steps.length]);

  const markStepCompleted = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId];
    setCompletedSteps(newCompleted);
    localStorage.setItem('onboarding-completed', JSON.stringify(newCompleted));
    
    if (newCompleted.length === steps.length) {
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1000);
    }
  };

  const dismissOnboarding = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding-dismissed', 'true');
  };

  const resetOnboarding = () => {
    setCompletedSteps([]);
    setCurrentStep(0);
    setIsVisible(true);
    localStorage.removeItem('onboarding-completed');
    localStorage.removeItem('onboarding-dismissed');
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={resetOnboarding}
        className="fixed bottom-4 right-4 z-50"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Ver Tutorial
      </Button>
    );
  }

  const currentStepData = steps[currentStep];
  const isStepCompleted = completedSteps.includes(currentStepData?.id);
  const allCompleted = completedSteps.length === steps.length;

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-80 z-50 shadow-xl border-primary/20",
      allCompleted && "border-green-500/30 bg-green-50/50 dark:bg-green-900/10",
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "p-1.5 rounded-full",
              allCompleted ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
            )}>
              {allCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Zap className="h-4 w-4 text-primary" />
              )}
            </div>
            <h3 className="font-semibold text-sm">
              {allCompleted ? '¡Completado!' : 'Guía de Inicio'}
            </h3>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            {completedSteps.length}/{steps.length}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mb-4">
          <div 
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              allCompleted ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {allCompleted ? (
          /* Completion State */
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ¡Excelente trabajo!
            </h4>
            <p className="text-xs text-green-600 dark:text-green-300 mb-4">
              Has completado la configuración inicial. ¡Ahora puedes aprovechar al máximo la plataforma!
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={dismissOnboarding}
              className="w-full"
            >
              Cerrar Tutorial
            </Button>
          </div>
        ) : (
          /* Current Step */
          <div>
            <div className="flex items-start space-x-3 mb-4">
              <div className={cn(
                "p-2 rounded-lg",
                isStepCompleted ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
              )}>
                {isStepCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <currentStepData.icon className="h-4 w-4 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">
                  {currentStepData.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {!isStepCompleted && currentStepData.action && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    markStepCompleted(currentStepData.id);
                    if (currentStepData.href) {
                      window.location.href = currentStepData.href;
                    }
                  }}
                >
                  {currentStepData.action}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              
              {isStepCompleted && currentStep < steps.length - 1 && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Siguiente
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={dismissOnboarding}
              >
                Omitir tutorial
              </button>
              
              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      index === currentStep ? "bg-primary" :
                      completedSteps.includes(steps[index].id) ? "bg-green-500" :
                      "bg-muted"
                    )}
                    onClick={() => setCurrentStep(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}