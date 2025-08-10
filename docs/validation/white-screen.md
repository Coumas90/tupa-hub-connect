# White Screen — Verificación post-fix

Rol: QA Técnico + Auditor de Router

Resumen
- Objetivo: Confirmar que la landing renderiza, que las rutas públicas/privadas están bien y que ProtectedRoute no deja la app en blanco.

Resultados (✅/❌)
- ✅ Landing / renderiza siempre
- ✅ Rutas públicas/privadas correctas en src/App.tsx
- ✅ ProtectedRoute robusto: init local con getSession + onAuthStateChange y setReady(true) en catch
- ✅ Build OK (npm ci && npm run build)

Evidencia mínima

1) Router público/privado (src/App.tsx)
- Públicas: '/', '/login', '/auth/callback', '/auth/reset', '/activate-account'
- Privadas bajo <ProtectedRoute>: '/dashboard', '/org/*', '/admin/*', '/app'

Fragmentos:
```
// Públicas
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<ClientLoginPage />} />
<Route path="/auth/callback" element={<AuthCallback />} />
<Route path="/auth/reset" element={<PasswordResetPage />} />
<Route path="/activate-account" element={<ActivateAccount />} />

// Privadas
<Route path="/dashboard" element={<ProtectedRoute><SmartRedirectRouter /></ProtectedRoute>} />
<Route path="/org/*" element={<ProtectedRoute><MultiTenantRouter /></ProtectedRoute>} />
<Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminRouter /></ProtectedRoute>} />
<Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
```

2) ProtectedRoute (src/components/auth/ProtectedRoute.tsx)
- Cliente unificado:
```
import { supabase } from '@/lib/supabase';
```
- Init local defensivo y cleanup:
```
useEffect(() => {
  let active = true;
  supabase.auth.getSession()
    .then(({ data }) => { if (!active) return; setSession(data.session); setReady(true); })
    .catch(() => { if (!active) return; setReady(true); });
  const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
    if (!active) return; setSession(s); setReady(true);
  });
  return () => { active = false; sub?.subscription?.unsubscribe?.(); };
}, []);
```

3) Suscripciones
- Singleton global en src/lib/auth-effects.ts para efectos (telemetría, onboarding de profiles). El listener local en ProtectedRoute sólo maneja estado de ruta.

Build
- Comando: `npm ci && npm run build`
- Resultado: ✅ OK

Guía de QA manual
1. `npm run preview`
2. Abrir `/` → se ve la landing sin pantalla en blanco.
3. Navegar a `/dashboard` sin sesión → redirige a `/login`.
4. Hacer login → vuelve por `/auth/callback` → aterriza en `/dashboard`.
5. Recargar `/` y `/dashboard` → no hay “parpadeo” en blanco; se muestra un loading breve controlado.

Causa raíz (documentada)
- Doble cliente de Supabase generaba estado inconsistente en ProtectedRoute y efectos globales, manteniendo el guard en estado de validación. Se unificó a '@/lib/supabase' y se agregó init defensivo.

Anti–pantalla blanca en CI (opcional implementado)
- Test: `cypress/e2e/landing.cy.ts`
```
describe('Landing render', () => {
  it('loads the home page without blank screen', () => {
    cy.visit('/');
    cy.contains(/(home|landing|bienvenido|tupá)/i).should('exist');
  });
});
```
- Workflow `.github/workflows/ci-auth-smoke.yml` actualizado para ejecutar ambos specs:
```
command: npx cypress run --browser chrome --spec "cypress/e2e/auth_login.cy.ts,cypress/e2e/landing.cy.ts"
```

Notas
- Si aparecen 403 en `/rest/v1/profiles`, validar RLS y onboarding de perfil (ver docs/validation/profiles-rls.md).
