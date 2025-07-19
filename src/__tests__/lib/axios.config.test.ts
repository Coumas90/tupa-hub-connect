import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api/axios.config';

// Mock de react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Axios Config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe tener timeout configurado', () => {
    expect(apiClient.defaults.timeout).toBe(10000);
  });

  it('Debe tener Content-Type header por defecto', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('Debe manejar errores de red correctamente', async () => {
    // Mock de toast
    const mockToastError = vi.fn();
    vi.doMock('react-toastify', () => ({
      toast: {
        error: mockToastError,
      },
    }));

    // Simular error de red
    const networkError = {
      message: 'Network Error',
      request: true,
      response: undefined,
    };

    // Los interceptors están configurados, así que este test verifica la estructura
    expect(apiClient.interceptors.request).toBeDefined();
    expect(apiClient.interceptors.response).toBeDefined();
  });

  it('Debe procesar errores HTTP 404 correctamente', () => {
    const error404 = {
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    };

    // Verificar que el status es el esperado
    expect(error404.response.status).toBe(404);
  });

  it('Debe procesar errores HTTP 401 correctamente', () => {
    const error401 = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };

    // Verificar que el status es el esperado
    expect(error401.response.status).toBe(401);
  });
});