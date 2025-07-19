import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/pages/LoginPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Importar screen y fireEvent globalmente desde el setup
import '@testing-library/jest-dom';

// Mock del hook de toasts
vi.mock('@/hooks/use-toast-notifications', () => ({
  useToastNotifications: () => ({
    showSuccess: vi.fn(),
    showLoginSuccess: vi.fn(),
    showLoginError: vi.fn(),
  }),
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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Muestra error al enviar formulario vacío', async () => {
    const { getByRole, findByText } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Buscar el botón de iniciar sesión
    const submitButton = getByRole('button', { name: /iniciar sesión/i });
    
    // Hacer click sin llenar campos
    submitButton.click();

    // Verificar que aparece el error de email requerido
    expect(await findByText('Email requerido')).toBeVisible();
  });

  it('Muestra error cuando solo se ingresa email', async () => {
    const { getByRole, getByLabelText, findByText } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Llenar solo el email
    const emailInput = getByRole('textbox', { name: /email/i });
    emailInput.focus();
    (emailInput as HTMLInputElement).value = 'test@example.com';
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Enviar formulario
    const submitButton = getByRole('button', { name: /iniciar sesión/i });
    submitButton.click();

    // Verificar error de contraseña requerida
    expect(await findByText('Contraseña requerida')).toBeVisible();
  });

  it('Muestra error cuando la contraseña es muy corta', async () => {
    const { getByRole, getByLabelText, findByText } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Llenar campos con contraseña corta
    const emailInput = getByRole('textbox', { name: /email/i });
    const passwordInput = getByLabelText(/contraseña/i);
    
    emailInput.focus();
    (emailInput as HTMLInputElement).value = 'test@example.com';
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));

    passwordInput.focus();
    (passwordInput as HTMLInputElement).value = '123';
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Enviar formulario
    const submitButton = getByRole('button', { name: /iniciar sesión/i });
    submitButton.click();

    // Verificar error de contraseña muy corta
    expect(await findByText('La contraseña debe tener al menos 6 caracteres')).toBeVisible();
  });

  it('Cambia entre modo login y signup', () => {
    const { getByRole } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Verificar que está en modo login inicialmente
    expect(getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();

    // Cambiar a modo signup
    const toggleButton = getByRole('button', { name: /¿no tienes cuenta\? regístrate/i });
    toggleButton.click();

    // Verificar que cambió a modo signup
    expect(getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
    expect(getByRole('button', { name: /¿ya tienes cuenta\? inicia sesión/i })).toBeInTheDocument();
  });

  it('Renderiza campos de email y contraseña', () => {
    const { getByRole, getByLabelText } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    // Verificar que los campos están presentes
    expect(getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(getByLabelText(/contraseña/i)).toBeInTheDocument();
  });
});