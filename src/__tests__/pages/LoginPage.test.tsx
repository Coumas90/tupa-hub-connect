import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/pages/LoginPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Importar jest-dom para matchers adicionales
import '@testing-library/jest-dom';

// Mock del hook de toasts
const mockToastNotifications = {
  showSuccess: vi.fn(),
  showLoginSuccess: vi.fn(),
  showLoginError: vi.fn(),
};

vi.mock('@/hooks/use-toast-notifications', () => ({
  useToastNotifications: () => mockToastNotifications,
}));

// Mock de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

// Mock de navegación y auth context
const mockNavigate = vi.fn();
const mockSignInWithEmail = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/OptimizedAuthProvider', () => ({
  useOptimizedAuth: () => ({
    signInWithEmail: mockSignInWithEmail,
    signInWithGoogle: mockSignInWithGoogle,
    loading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserWithRole', () => ({
  useUserRedirectUrl: () => '/profile',
}));

mockSignInWithEmail.mockImplementation(async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
});

mockSignInWithGoogle.mockResolvedValue({});

// Mock de funciones de sanitización
vi.mock('@/utils/sanitize', () => ({
  sanitizeEmail: (value: string) => value,
  sanitizePassword: (value: string) => value,
}));

// Wrapper de providers para testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LoginPage - Testing Automatizado de Autenticación', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    
    // Reset window.location.origin para tests
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000'
      },
      writable: true
    });
  });

  describe('Renderizado de componentes', () => {
    it('debe renderizar la página de login correctamente y mostrar los campos de email y contraseña', () => {
      const { getByRole, getByLabelText, getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Verificar título
      expect(getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
      
      // Verificar campos obligatorios
      expect(getByLabelText(/email/i)).toBeInTheDocument();
      expect(getByLabelText(/contraseña/i)).toBeInTheDocument();
      
      // Verificar botón de envío
      expect(getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
      
      // Verificar placeholder en campos
      expect(getByPlaceholderText('tu@email.com')).toBeInTheDocument();
      expect(getByPlaceholderText('••••••••')).toBeInTheDocument();
      
      // Verificar texto descriptivo
      expect(getByText('Ingresa tus credenciales para acceder')).toBeInTheDocument();
      
      // Verificar botón para cambiar a registro
      expect(getByRole('button', { name: /¿no tienes cuenta\? regístrate/i })).toBeInTheDocument();
    });

    it('debe alternar entre modo login y signup correctamente', async () => {
      const { getByRole, getByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Verificar estado inicial (login)
      expect(getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(getByText('Ingresa tus credenciales para acceder')).toBeInTheDocument();

      // Cambiar a modo signup
      const toggleButton = getByRole('button', { name: /¿no tienes cuenta\? regístrate/i });
      await user.click(toggleButton);

      // Verificar cambio a signup
      expect(getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
      expect(getByText('Ingresa tus datos para crear una cuenta')).toBeInTheDocument();
      expect(getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
      expect(getByRole('button', { name: /¿ya tienes cuenta\? inicia sesión/i })).toBeInTheDocument();

      // Volver a modo login
      const backToLoginButton = getByRole('button', { name: /¿ya tienes cuenta\? inicia sesión/i });
      await user.click(backToLoginButton);

      // Verificar regreso a login
      expect(getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    });
  });

  describe('Interacción del usuario con los campos', () => {
    it('debe permitir al usuario escribir en los campos de email y contraseña', async () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = getByLabelText(/contraseña/i) as HTMLInputElement;

      // Escribir en el campo email
      await user.type(emailInput, 'usuario@ejemplo.com');
      expect(emailInput.value).toBe('usuario@ejemplo.com');

      // Escribir en el campo contraseña
      await user.type(passwordInput, 'micontraseña123');
      expect(passwordInput.value).toBe('micontraseña123');
    });

    it('debe limpiar el error cuando se cambia entre login y signup', async () => {
      const { getByRole, getByLabelText, queryByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Crear un error primero
      const submitButton = getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Esperar un poco para que aparezca el error
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cambiar a modo signup
      const toggleButton = getByRole('button', { name: /¿no tienes cuenta\? regístrate/i });
      await user.click(toggleButton);

      // El error debería haberse limpiado
      expect(queryByText('Email requerido')).not.toBeInTheDocument();
    });
  });

  describe('Validación de formulario y manejo de errores', () => {
    it('debe mostrar error cuando se envía el formulario sin email', async () => {
      const { getByRole, findByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const submitButton = getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      expect(await findByText('Email requerido')).toBeInTheDocument();
    });

    it('debe mostrar error cuando se envía el formulario sin contraseña', async () => {
      const { getByRole, getByLabelText, findByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      expect(await findByText('Contraseña requerida')).toBeInTheDocument();
    });

    it('debe mostrar error cuando la contraseña es muy corta', async () => {
      const { getByRole, getByLabelText, findByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');

      const submitButton = getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      expect(await findByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
    });

    it('debe simular credenciales incorrectas y mostrar mensaje de error', async () => {
      // Mock para simular error de credenciales incorrectas
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' } as any
      });

      const { getByRole, getByLabelText, findByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/contraseña/i);

      await user.type(emailInput, 'incorrecto@ejemplo.com');
      await user.type(passwordInput, 'contraseñaincorrecta');

      const submitButton = getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Verificar que se muestra el mensaje de error específico
      expect(await findByText('Credenciales incorrectas. Verifica tu email y contraseña')).toBeInTheDocument();
      
      // Verificar que se llamó al método de toast de error
      expect(mockToastNotifications.showLoginError).toHaveBeenCalledWith(
        'Credenciales incorrectas. Verifica tu email y contraseña'
      );
    });

    it('debe manejar error de usuario ya registrado durante signup', async () => {
      // Mock para simular error de usuario ya registrado
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already registered' } as any
      });

      const { getByRole, getByLabelText, findByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Cambiar a modo signup
      const toggleButton = getByRole('button', { name: /¿no tienes cuenta\? regístrate/i });
      await user.click(toggleButton);

      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/contraseña/i);

      await user.type(emailInput, 'yaregistrado@ejemplo.com');
      await user.type(passwordInput, 'contraseña123');

      const submitButton = getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      expect(await findByText('Este email ya está registrado. Intenta iniciar sesión')).toBeInTheDocument();
    });
  });

    describe('Flujo de autenticación exitosa', () => {
      it('debe redirigir al perfil tras inicio de sesión exitoso', async () => {
        // Mock para simular login exitoso
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
          data: {
            user: {
              id: '123',
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated',
              created_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {}
            } as any,
            session: {
              access_token: 'token123',
              refresh_token: 'refresh123',
              user: {} as any,
              token_type: 'bearer',
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600
            }
          },
          error: null
        });

        const { getByRole, getByLabelText } = render(
          <TestWrapper>
            <LoginPage />
          </TestWrapper>
        );

        const emailInput = getByLabelText(/email/i);
        const passwordInput = getByLabelText(/contraseña/i);

        await user.type(emailInput, 'usuario@ejemplo.com');
        await user.type(passwordInput, 'contraseña123');

        const submitButton = getByRole('button', { name: /iniciar sesión/i });
        await user.click(submitButton);

        // Esperar a que se resuelva el debounce y la navegación
        await new Promise(resolve => setTimeout(resolve, 600));

        // Verificar que se realizó la redirección al perfil
        expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });

        // Verificar que se llamó a Supabase con los datos correctos
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'usuario@ejemplo.com',
          password: 'contraseña123',
        });
      });

      it('debe redirigir al perfil tras login con Google', async () => {
        const { getByRole } = render(
          <TestWrapper>
            <LoginPage />
          </TestWrapper>
        );

        const googleButton = getByRole('button', { name: /continuar con google/i });
        await user.click(googleButton);

        // Esperar a que se ejecute la redirección
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockSignInWithGoogle).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
      });

      it('debe simular registro exitoso y mostrar mensaje de confirmación', async () => {
        // Mock para simular signup exitoso
        vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
          data: {
          user: { 
            id: '123', 
            email: 'nuevo@ejemplo.com',
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
            confirmed_at: null,
            last_sign_in_at: null,
            app_metadata: {},
            user_metadata: {}
          } as any, 
          session: null
        },
        error: null
      });

      const { getByRole, getByLabelText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Cambiar a modo signup
      const toggleButton = getByRole('button', { name: /¿no tienes cuenta\? regístrate/i });
      await user.click(toggleButton);

      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/contraseña/i);

      await user.type(emailInput, 'nuevo@ejemplo.com');
      await user.type(passwordInput, 'contraseña123');

      const submitButton = getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      // Esperar un poco para que las promesas se resuelvan
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verificar que se llamó al toast de éxito
      expect(mockToastNotifications.showSuccess).toHaveBeenCalledWith(
        'Cuenta creada exitosamente. Revisa tu email para confirmar.'
      );

      // Verificar que se llamó a Supabase con los datos correctos incluyendo emailRedirectTo
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'nuevo@ejemplo.com',
        password: 'contraseña123',
        options: {
          emailRedirectTo: 'http://localhost:3000/'
        }
      });
    });
  });

  describe('Estados de carga', () => {
    it('debe mostrar estado de carga durante el envío del formulario', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise<any>((resolve) => {
        resolvePromise = resolve;
      });

      // Mock que simula una promesa pendiente
      vi.mocked(supabase.auth.signInWithPassword).mockReturnValueOnce(pendingPromise as any);

      const { getByRole, getByLabelText, getByText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@ejemplo.com');
      await user.type(passwordInput, 'contraseña123');

      const submitButton = getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Verificar que se muestra el estado de carga
      expect(getByText('Iniciando sesión...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Resolver la promesa para limpiar el test
      resolvePromise!({
        data: { user: null, session: null },
        error: null
      });
    });

    it('debe deshabilitar los campos durante el envío del formulario', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise<any>((resolve) => {
        resolvePromise = resolve;
      });

      // Mock que simula una promesa pendiente
      vi.mocked(supabase.auth.signInWithPassword).mockReturnValueOnce(pendingPromise as any);

      const { getByRole, getByLabelText } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@ejemplo.com');
      await user.type(passwordInput, 'contraseña123');

      const submitButton = getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Verificar que los campos están deshabilitados
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Resolver la promesa para limpiar el test
      resolvePromise!({
        data: { user: null, session: null },
        error: null
      });
    });
  });
});