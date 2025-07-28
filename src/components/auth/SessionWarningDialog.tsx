import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';

interface SessionWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Enhanced session warning dialog with visual countdown and action buttons
 * Provides clear UX for session expiration warnings
 */
export function SessionWarningDialog({ open, onOpenChange }: SessionWarningDialogProps) {
  const { timeLeftMinutes, timeLeftSeconds, extendSession, progress } = useSessionMonitor({
    showToastWarning: false // Disable toast since we're showing dialog
  });

  const handleExtend = async () => {
    await extendSession();
    onOpenChange(false);
  };

  const handleSignOut = () => {
    // This will be handled by the auth context
    onOpenChange(false);
  };

  const progressPercentage = progress * 100;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            ⏰ Sesión por expirar
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              Tu sesión expirará en{' '}
              <span className="font-semibold text-primary">
                {timeLeftMinutes}:{timeLeftSeconds.toString().padStart(2, '0')}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiempo restante</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress 
                value={progressPercentage} 
                className={`h-2 ${
                  progressPercentage > 50 ? "[&>div]:bg-green-500" :
                  progressPercentage > 25 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                }`}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              ¿Deseas extender tu sesión o cerrarla ahora?
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleSignOut}>
            Cerrar sesión
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtend}>
            Extender sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}