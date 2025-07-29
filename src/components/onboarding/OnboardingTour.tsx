import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  X, Coffee, ArrowRight, CheckCircle, Star, 
  Users, BookOpen, Package, TrendingUp 
} from "lucide-react";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useSmartNavigation } from '@/utils/routing/redirects';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
  };
  completed?: boolean;
}

interface OnboardingTourProps {
  userRole: string;
  isAdmin: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export function OnboardingTour({ userRole, isAdmin, onComplete, onDismiss }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { navigateToOperation, navigateToTenant } = useSmartNavigation();

  const getStepsForRole = (): OnboardingStep[] => {
    if (isAdmin) {
      return [
        {
          id: 'admin-overview',
          title: '¡Bienvenido, Administrador!',
          description: 'Como administrador, tienes acceso completo al sistema. Puedes gestionar todas las locaciones, usuarios y configuraciones.',
          icon: Star,
          completed: false
        },
        {
          id: 'admin-locations',
          title: 'Gestión de Locaciones',
          description: 'Supervisa todas las locaciones activas, monitorea su rendimiento y configura nuevas integraciones.',
          icon: Package,
          action: {
            label: 'Ver Panel Admin',
            onClick: () => navigateToTenant('/admin/dashboard')
          }
        },
        {
          id: 'admin-integrations',
          title: 'Sistemas POS',
          description: 'Configura y monitorea las integraciones con sistemas POS como Fudo y Bistrosoft.',
          icon: TrendingUp,
          action: {
            label: 'Ver Integraciones',
            onClick: () => navigateToTenant('/admin/operations/pos')
          }
        }
      ];
    }

    switch (userRole?.toLowerCase()) {
      case 'owner':
        return [
          {
            id: 'owner-welcome',
            title: '¡Bienvenido, Propietario!',
            description: 'Como propietario, tienes acceso completo a todas las funciones de tu cafetería. Vamos a explorar las principales herramientas.',
            icon: Star,
            completed: false
          },
          {
            id: 'owner-dashboard',
            title: 'Tu Dashboard Personal',
            description: 'Aquí puedes ver los ingresos, metas mensuales, y el rendimiento general de tu negocio en tiempo real.',
            icon: TrendingUp,
            action: {
              label: 'Ver Dashboard',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'owner-dashboard']);
                // Would navigate to owner dashboard view
              }
            }
          },
          {
            id: 'owner-team',
            title: 'Gestión de Equipo',
            description: 'Administra tu personal, revisa su rendimiento y programa capacitaciones para mantener la calidad del servicio.',
            icon: Users,
            action: {
              label: 'Ver Mi Equipo',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'owner-team']);
                navigateToOperation('staff');
              }
            }
          },
          {
            id: 'owner-inventory',
            title: 'Control de Inventario',
            description: 'Monitorea tu stock, recibe alertas de productos con bajo inventario y gestiona reposiciones automáticas.',
            icon: Package,
            action: {
              label: 'Ver Inventario',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'owner-inventory']);
                navigateToOperation('inventory');
              }
            }
          }
        ];

      case 'manager':
        return [
          {
            id: 'manager-welcome',
            title: '¡Bienvenido, Encargado!',
            description: 'Como encargado, eres responsable de las operaciones diarias. Te mostraremos las herramientas clave para tu gestión.',
            icon: Star,
            completed: false
          },
          {
            id: 'manager-operations',
            title: 'Operaciones Diarias',
            description: 'Monitorea pedidos pendientes, supervisa al personal activo y mantén el control de las operaciones del día.',
            icon: TrendingUp,
            action: {
              label: 'Ver Operaciones',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'manager-operations']);
                navigateToOperation('consumption');
              }
            }
          },
          {
            id: 'manager-team',
            title: 'Rendimiento del Equipo',
            description: 'Revisa la productividad de tu equipo, programa capacitaciones y mantén altos estándares de calidad.',
            icon: Users,
            action: {
              label: 'Gestionar Equipo',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'manager-team']);
                navigateToOperation('staff');
              }
            }
          },
          {
            id: 'manager-training',
            title: 'Academia TUPÁ',
            description: 'Programa sesiones de capacitación y supervisa el progreso del equipo en los cursos de barismo.',
            icon: BookOpen,
            action: {
              label: 'Ver Academia',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'manager-training']);
                navigateToTenant('academy');
              }
            }
          }
        ];

      case 'barista':
        return [
          {
            id: 'barista-welcome',
            title: '¡Bienvenido, Barista!',
            description: 'Tu espacio está diseñado para ayudarte a crear el café perfecto. Vamos a explorar tus herramientas principales.',
            icon: Coffee,
            completed: false
          },
          {
            id: 'barista-recipes',
            title: 'Recetas de Café',
            description: 'Accede a todas las recetas disponibles, desde espressos hasta bebidas especiales. Siempre tendrás la guía perfecta.',
            icon: Coffee,
            action: {
              label: 'Ver Recetas',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'barista-recipes']);
                navigateToOperation('recipes');
              }
            }
          },
          {
            id: 'barista-academy',
            title: 'Tu Desarrollo Profesional',
            description: 'Continúa aprendiendo con cursos especializados, mejora tus técnicas y desbloquea nuevos logros.',
            icon: BookOpen,
            action: {
              label: 'Continuar Aprendiendo',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'barista-academy']);
                navigateToTenant('academy');
              }
            }
          },
          {
            id: 'barista-progress',
            title: 'Tu Progreso',
            description: 'Revisa tu nivel actual, los logros obtenidos y el camino hacia convertirte en un barista experto.',
            icon: Star,
            action: {
              label: 'Ver Mi Progreso',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'barista-progress']);
                // Would show progress dashboard
              }
            }
          }
        ];

      case 'client':
      default:
        return [
          {
            id: 'client-welcome',
            title: '¡Bienvenido a TUPÁ Hub!',
            description: 'Tu plataforma integral para gestión cafetera. Aquí encontrarás todo lo necesario para optimizar tu negocio.',
            icon: Star,
            completed: false
          },
          {
            id: 'client-dashboard',
            title: 'Panel de Control',
            description: 'Tu centro de comando para acceder rápidamente a todas las funciones: recetas, consumo, equipo y más.',
            icon: TrendingUp,
            action: {
              label: 'Explorar Dashboard',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'client-dashboard']);
              }
            }
          },
          {
            id: 'client-recipes',
            title: 'Biblioteca de Recetas',
            description: 'Accede a recetas profesionales, guías paso a paso y técnicas especializadas para cada tipo de bebida.',
            icon: Coffee,
            action: {
              label: 'Ver Recetas',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'client-recipes']);
                navigateToOperation('recipes');
              }
            }
          },
          {
            id: 'client-academy',
            title: 'Academia TUPÁ',
            description: 'Capacita a tu equipo con cursos especializados y mantén los más altos estándares de calidad.',
            icon: BookOpen,
            action: {
              label: 'Explorar Academia',
              onClick: () => {
                setCompletedSteps(prev => [...prev, 'client-academy']);
                navigateToTenant('academy');
              }
            }
          }
        ];
    }
  };

  const steps = getStepsForRole();
  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto shadow-2xl animate-scale-in">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="absolute right-2 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <currentStepData.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Paso {currentStep + 1} de {steps.length}</span>
                  {isStepCompleted(currentStepData.id) && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <CardDescription className="text-base leading-relaxed">
            {currentStepData.description}
          </CardDescription>

          {currentStepData.action && (
            <Button 
              onClick={currentStepData.action.onClick}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {currentStepData.action.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          <div className="flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              Anterior
            </Button>
            
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-primary' 
                    : index < currentStep || isStepCompleted(step.id)
                    ? 'bg-green-500' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing onboarding state
export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { userRole, isAdmin, user } = useEnhancedAuth();

  useEffect(() => {
    if (user && userRole) {
      const onboardingKey = `onboarding_seen_${user.id}_${userRole}`;
      const seen = localStorage.getItem(onboardingKey);
      
      if (!seen) {
        // Small delay to ensure everything is loaded
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setHasSeenOnboarding(true);
      }
    }
  }, [user, userRole]);

  const completeOnboarding = () => {
    if (user && userRole) {
      const onboardingKey = `onboarding_seen_${user.id}_${userRole}`;
      localStorage.setItem(onboardingKey, 'true');
      setHasSeenOnboarding(true);
      setShowOnboarding(false);
    }
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    // Don't mark as completed if dismissed, so it shows again next time
  };

  const resetOnboarding = () => {
    if (user && userRole) {
      const onboardingKey = `onboarding_seen_${user.id}_${userRole}`;
      localStorage.removeItem(onboardingKey);
      setHasSeenOnboarding(false);
      setShowOnboarding(true);
    }
  };

  return {
    showOnboarding,
    hasSeenOnboarding,
    completeOnboarding,
    dismissOnboarding,
    resetOnboarding,
    userRole,
    isAdmin
  };
}