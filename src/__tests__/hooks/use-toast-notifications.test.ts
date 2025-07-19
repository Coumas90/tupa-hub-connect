import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { renderHook } from '@testing-library/react';

// Mock de react-toastify
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('react-toastify', () => ({
  toast: mockToast,
}));

describe('useToastNotifications Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe llamar toast.success con mensaje correcto', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showSuccess('Operación exitosa');
    
    expect(mockToast.success).toHaveBeenCalledWith('Operación exitosa');
  });

  it('Debe llamar toast.error con mensaje correcto', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showError('Error en la operación');
    
    expect(mockToast.error).toHaveBeenCalledWith('Error en la operación');
  });

  it('Debe mostrar mensaje de login exitoso', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showLoginSuccess('Juan');
    
    expect(mockToast.success).toHaveBeenCalledWith('¡Bienvenido Juan!');
  });

  it('Debe mostrar mensaje de login exitoso sin nombre', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showLoginSuccess();
    
    expect(mockToast.success).toHaveBeenCalledWith('¡Bienvenido!');
  });

  it('Debe mostrar error de login por defecto', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showLoginError();
    
    expect(mockToast.error).toHaveBeenCalledWith('Credenciales incorrectas. Revisa tu email y contraseña');
  });

  it('Debe mostrar error de login personalizado', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showLoginError('Usuario bloqueado');
    
    expect(mockToast.error).toHaveBeenCalledWith('Usuario bloqueado');
  });

  it('Debe mostrar mensaje de guardado exitoso', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showSaveSuccess();
    
    expect(mockToast.success).toHaveBeenCalledWith('Cambios guardados correctamente');
  });

  it('Debe mostrar mensaje de sincronización exitosa', () => {
    const { result } = renderHook(() => useToastNotifications());
    
    result.current.showSyncSuccess();
    
    expect(mockToast.success).toHaveBeenCalledWith('Sincronización completada');
  });
});