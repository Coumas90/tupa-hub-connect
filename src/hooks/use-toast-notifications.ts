import { toast } from 'react-toastify';

export const useToastNotifications = () => {
  
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  // Métodos específicos para casos comunes
  const showLoginSuccess = (username?: string) => {
    toast.success(`¡Bienvenido${username ? ` ${username}` : ''}!`);
  };

  const showLoginError = (error?: string) => {
    toast.error(error || 'Credenciales incorrectas. Revisa tu email y contraseña');
  };

  const showNetworkError = () => {
    toast.error('Error de conexión. Verifica tu internet y vuelve a intentar');
  };

  const showSaveSuccess = () => {
    toast.success('Cambios guardados correctamente');
  };

  const showSaveError = () => {
    toast.error('Error al guardar. Inténtalo nuevamente');
  };

  const showDeleteSuccess = () => {
    toast.success('Elemento eliminado correctamente');
  };

  const showDeleteError = () => {
    toast.error('Error al eliminar. Inténtalo nuevamente');
  };

  const showSyncSuccess = () => {
    toast.success('Sincronización completada');
  };

  const showSyncError = () => {
    toast.error('Error en la sincronización. Revisa la configuración');
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoginSuccess,
    showLoginError,
    showNetworkError,
    showSaveSuccess,
    showSaveError,
    showDeleteSuccess,
    showDeleteError,
    showSyncSuccess,
    showSyncError,
  };
};

export default useToastNotifications;