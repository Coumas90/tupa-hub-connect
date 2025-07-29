import { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

export function UserMenu() {
  const { user, userRole, signOut } = useOptimizedAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const userInitials = user.email?.slice(0, 2).toUpperCase() || 'U';
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

  const handleLogout = async () => {
    console.log('🔄 UserMenu: Starting logout process...');
    setIsLoggingOut(true);
    setShowLogoutDialog(false); // Cerrar dialog inmediatamente
    
    try {
      console.log('🔄 UserMenu: Calling signOut...');
      await signOut();
      console.log('✅ UserMenu: SignOut completed successfully');
      // No navigation here - OptimizedAuthProvider handles it automatically
      // No need to manually reset isLoggingOut - component will unmount when user logs out
    } catch (error) {
      console.error('❌ UserMenu: Error during logout:', error);
      setIsLoggingOut(false);
      setShowLogoutDialog(true); // Reabrir dialog solo en caso de error
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 px-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {userRole || 'Usuario'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => {
              const currentPath = window.location.pathname;
              const profilePath = currentPath.startsWith('/admin') ? '/admin/profile' : '/app/profile';
              navigate(profilePath);
            }}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            Ver Perfil
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => {
              const currentPath = window.location.pathname;
              const settingsPath = currentPath.startsWith('/admin') ? '/admin/settings' : 
                                   currentPath.startsWith('/tenants/') ? window.location.pathname.replace(/\/[^\/]*$/, '/settings') :
                                   '/app/settings';
              navigate(settingsPath);
            }}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowLogoutDialog(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}