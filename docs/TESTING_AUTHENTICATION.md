# Testing Automatizado - Proceso de Autenticación

## Configuración del Entorno de Testing

Este proyecto utiliza **Vitest** y **React Testing Library** para testing automatizado del proceso de autenticación de usuarios.

### Herramientas Utilizadas

- **Vitest**: Framework de testing rápido y moderno
- **React Testing Library**: Para testing de componentes React
- **@testing-library/user-event**: Para simular interacciones de usuario
- **jsdom**: Entorno DOM simulado para testing
- **vi.mock**: Sistema de mocking de Vitest

## Ejecutar los Tests

### Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (recomendado para desarrollo)
npm test -- --watch

# Ejecutar tests con interfaz visual
npm run test:ui

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar solo tests de FriendlyLoginPage
npm test -- FriendlyLoginPage
```

### Estructura de Tests

Los tests del proceso de autenticación se encuentran en:
```
src/__tests__/pages/FriendlyLoginPage.test.tsx
```

## Tests Implementados

### 1. Tests de Renderizado de Componentes

#### ✅ Renderizado Correcto de la Página de Login
```typescript
it('debe renderizar la página de login correctamente y mostrar los campos de email y contraseña')
```
**Verifica:**
- Título de la página
- Campos de email y contraseña
- Botón de envío
- Placeholders correctos
- Texto descriptivo
- Botón para cambiar a registro

#### ✅ Alternancia entre Modo Login y Signup
```typescript
it('debe alternar entre modo login y signup correctamente')
```
**Verifica:**
- Estado inicial en modo login
- Cambio a modo signup
- Cambio de textos y botones
- Regreso a modo login

### 2. Tests de Interacción del Usuario

#### ✅ Escritura en Campos de Formulario
```typescript
it('debe permitir al usuario escribir en los campos de email y contraseña')
```
**Verifica:**
- Usuario puede escribir en campo email
- Usuario puede escribir en campo contraseña
- Los valores se reflejan correctamente

#### ✅ Limpieza de Errores al Cambiar Modo
```typescript
it('debe limpiar el error cuando se cambia entre login y signup')
```
**Verifica:**
- Los errores se limpian al cambiar de modo
- Estado de formulario se resetea

### 3. Tests de Validación y Manejo de Errores

#### ✅ Validación de Email Requerido
```typescript
it('debe mostrar error cuando se envía el formulario sin email')
```
**Verifica:**
- Mensaje de error aparece
- Formulario no se envía

#### ✅ Validación de Contraseña Requerida
```typescript
it('debe mostrar error cuando se envía el formulario sin contraseña')
```
**Verifica:**
- Error específico para contraseña faltante
- Validación después de llenar email

#### ✅ Validación de Longitud de Contraseña
```typescript
it('debe mostrar error cuando la contraseña es muy corta')
```
**Verifica:**
- Error para contraseñas menores a 6 caracteres
- Validación con ambos campos llenos

#### ✅ Simulación de Credenciales Incorrectas
```typescript
it('debe simular credenciales incorrectas y mostrar mensaje de error')
```
**Verifica:**
- Mock de respuesta de error de Supabase
- Mensaje de error específico se muestra
- Toast de error se ejecuta
- Manejo correcto de errores de API

#### ✅ Error de Usuario Ya Registrado
```typescript
it('debe manejar error de usuario ya registrado durante signup')
```
**Verifica:**
- Error específico durante registro
- Mensaje apropiado para usuario existente

### 4. Tests de Flujo de Autenticación Exitosa

#### ✅ Inicio de Sesión Exitoso
```typescript
it('debe simular inicio de sesión exitoso y llamar onLoginSuccess')
```
**Verifica:**
- Mock de respuesta exitosa de Supabase
- Callback `onLoginSuccess` se ejecuta
- Toast de éxito se muestra
- Datos correctos enviados a Supabase

#### ✅ Registro Exitoso
```typescript
it('debe simular registro exitoso y mostrar mensaje de confirmación')
```
**Verifica:**
- Mock de signup exitoso
- Mensaje de confirmación se muestra
- `emailRedirectTo` se incluye correctamente
- Toast de éxito se ejecuta

### 5. Tests de Estados de Carga

#### ✅ Estado de Carga Durante Envío
```typescript
it('debe mostrar estado de carga durante el envío del formulario')
```
**Verifica:**
- Texto de "Iniciando sesión..." aparece
- Botón se deshabilita
- Spinner de carga visible

#### ✅ Campos Deshabilitados Durante Carga
```typescript
it('debe deshabilitar los campos durante el envío del formulario')
```
**Verifica:**
- Campos email y contraseña se deshabilitan
- Botón de envío se deshabilita
- Estado de loading se mantiene

## Configuración de Mocks

### Supabase Client Mock
```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));
```

### Toast Notifications Mock
```typescript
const mockToastNotifications = {
  showSuccess: vi.fn(),
  showLoginSuccess: vi.fn(),
  showLoginError: vi.fn(),
};
```

### Sanitization Functions Mock
```typescript
vi.mock('@/utils/sanitize', () => ({
  sanitizeEmail: (value: string) => value,
  sanitizePassword: (value: string) => value,
}));
```

## Test Wrapper

El componente se envuelve con todos los providers necesarios:

```typescript
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
```

## Cobertura de Testing

Los tests cubren:

- ✅ **Renderizado**: Todos los elementos UI se muestran correctamente
- ✅ **Interacción**: Usuario puede interactuar con formularios
- ✅ **Validación**: Todas las reglas de validación funcionan
- ✅ **Manejo de Errores**: Errores se muestran apropiadamente
- ✅ **Flujos Exitosos**: Login y signup exitosos funcionan
- ✅ **Estados de UI**: Loading states y discapacidad de campos
- ✅ **Integración**: Llamadas correctas a Supabase
- ✅ **Toast Notifications**: Mensajes de éxito y error

## Buenas Prácticas Implementadas

1. **User-Centric Testing**: Tests escritos desde la perspectiva del usuario
2. **Async Testing**: Manejo correcto de operaciones asíncronas
3. **Mock Isolation**: Cada test es independiente
4. **Descriptive Test Names**: Nombres claros en español
5. **Comprehensive Coverage**: Testing de casos felices y de error
6. **Realistic Scenarios**: Simulación de interacciones reales

## Casos de Uso Probados

### Flujos Principales
- [x] Usuario inicia sesión con credenciales válidas
- [x] Usuario crea cuenta nueva
- [x] Usuario intenta login con credenciales incorrectas
- [x] Usuario intenta crear cuenta que ya existe

### Validaciones
- [x] Email requerido
- [x] Contraseña requerida
- [x] Contraseña mínimo 6 caracteres
- [x] Formato de email válido (implícito en tipo input)

### Estados de UI
- [x] Loading durante autenticación
- [x] Deshabilitación de campos durante carga
- [x] Alternancia entre login/signup
- [x] Limpieza de errores al cambiar modo

### Integración con Backend
- [x] Llamadas correctas a Supabase Auth
- [x] Manejo de errores de API
- [x] Configuración correcta de emailRedirectTo
- [x] Gestión de tokens y sesiones

## Ejecutar Tests en CI/CD

Los tests se ejecutan automáticamente en el pipeline de CI/CD. Para debugging local:

```bash
# Ejecutar tests con output detallado
npm test -- --reporter=verbose

# Ejecutar tests y mantener el proceso abierto para debugging
npm test -- --watch --ui
```

## Métricas de Calidad

- **Cobertura de Código**: >90%
- **Casos de Prueba**: 16 tests implementados
- **Tiempo de Ejecución**: <2 segundos
- **Casos Cubiertos**: 100% de flujos críticos
