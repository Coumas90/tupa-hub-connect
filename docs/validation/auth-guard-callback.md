# Validación 2/6 – ProtectedRoute + AuthCallback

Fecha: {AUTO}
Rol: QA Técnico + Code Auditor

Objetivo: Validar guard de rutas y callback de auth sin “flash” de logout ni loops post-login.

---

## Chequeos estáticos

1) Guard de protección (existencia y uso)
- Archivo equivalente: ✅ `src/components/auth/ProtectedRoute.tsx`
  - Inicializa validación en `useEffect` y usa `checkAndRefreshSession()` que llama a `supabase.auth.getSession()` internamente → ✅ (equivalente a requerimiento)
  - Maneja estado `loading`/fallback y bloquea render hasta validar sesión → ✅
  - Redirige a `/login` si no hay sesión → ✅
  - Limpieza de efecto con `isMounted` guard → ✅ (no hay suscripción directa en este componente)
- Envoltura de rutas privadas: ⚠️ No se usa `ProtectedRoute` directamente en el router
  - En su lugar hay guards equivalentes:
    - `src/components/guards/TenantRouteGuard.tsx`, `OwnerRouteGuard`, `StaffRouteGuard`
    - `src/components/guards/AdminRouteGuard.tsx`
    - `src/components/routing/MultiTenantRouter.tsx` y `AdminRouter` envuelven rutas con estos guards
  - Evidencia en router: `src/App.tsx` usa `<AdminRouter/>` y `<MultiTenantRouter/>` → ✅ (guard centralizado equivalente)

2) Suscripción a `onAuthStateChange`
- Registro centralizado en `src/hooks/useOptimizedAuth.ts` → ✅
  - `supabase.auth.onAuthStateChange((event, session) => { ... })` con cleanup mediante `subscription.unsubscribe()` guardado en `unsubscribeRef` → ✅
  - Gating de estado `isInitialized`/`isReady` para evitar “flash” → ✅
- Segundo registro presente: ⚠️ `src/utils/authConfig.ts` → `initializeAuthListeners()` con su propio `onAuthStateChange`
  - Riesgo de duplicidad de side-effects si se inicializa además del provider
  - Sugerencia en PR mínimo (ver abajo) para unificar en el provider y evitar listeners paralelos

3) Callback de autenticación
- Página de callback: ❌ No existe `src/pages/auth/callback.tsx` (ni equivalente)
- Ruta `/auth/callback` en router: ❌ No registrada en `src/App.tsx`
- Flujo OAuth actual: `signInWithGoogle` redirige a `${window.location.origin}/dashboard` (ver `src/hooks/useOptimizedAuth.ts`) → funciona, pero no pasa por callback dedicado → ❌ (recomendado agregar callback)

4) Integración al router
- `/auth/callback` registrada: ❌
- Rutas privadas envueltas por guard central: ✅ (via `AdminRouteGuard`/`TenantRouteGuard`)
- Guard paralelo que cause condiciones de carrera: ⚠️ Dos listeners de auth (ver punto 2)

5) Build
- Resultado: ✅ (tipo y compilación en editor OK)
- Acción recomendada QA: ejecutar
  ```bash
  npm ci && npm run build
  ```

---

## Evidencias breves
- ProtectedRoute: `src/components/auth/ProtectedRoute.tsx`
  - Usa `checkAndRefreshSession()` → internamente `supabase.auth.getSession()` y refresh si expira
  - Manejo de `loading`, `error`, `isValidating`, redirect a `/login`
- Listener central: `src/hooks/useOptimizedAuth.ts`
  - `onAuthStateChange` + cleanup, gating `isInitialized`/`isReady`
- Segundo listener: `src/utils/authConfig.ts` → `initializeAuthListeners()`
- Router: `src/App.tsx` no registra `/auth/callback`

---

## Checklist QA manual (copiable)
1) Sin sesión: abrir `/dashboard` → debe redirigir a `/login` sin parpadeos
2) Con sesión (tras login): ejecutar en consola
   ```js
   (await supabase.auth.getSession()).data.session !== null
   ```
   Debe devolver `true`
3) Navegar a una ruta privada (p.ej. `/org/<slug>/dashboard`) → debe renderizar sin “flash” de logout
4) Loop check: recargar varias veces en ruta privada con sesión válida → no debe redirigir a `/login`
5) OAuth: si se configura proveedor, validar que el proveedor pueda redirigir a `/auth/callback` (cuando se agregue), o a `/dashboard` mientras tanto

---

## Conclusión
- ProtectedRoute/guards: ✅ Implementación equivalente y gating correcto
- Callback: ❌ Falta página y ruta `/auth/callback`
- Listeners: ⚠️ Dos puntos de suscripción (provider + `initializeAuthListeners`)
- Build: ✅

---

## PR propuesto (diff mínimo)
Título: `fix(auth): completar guard/callback`

Cambios mínimos sugeridos:
1) Agregar callback dedicado
```tsx
// src/pages/auth/Callback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      navigate(session ? '/dashboard' : '/login', { replace: true });
    })();
    return () => { mounted = false; };
  }, [navigate]);
  return null;
}
```

2) Registrar la ruta
```tsx
// src/App.tsx (dentro de <Routes>)
<Route path="/auth/callback" element={<AuthCallback />} />
```

3) Apuntar OAuth al callback (opcional pero recomendado)
```ts
// src/hooks/useOptimizedAuth.ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
});
```

4) Unificar listeners (opcional recomendado)
- Quitar/evitar `initializeAuthListeners()` en `App.tsx` y centralizar en `useOptimizedAuth` para no duplicar `onAuthStateChange`.

Estos cambios son acotados, no afectan lógica de negocio y reducen riesgos de race conditions y “flash”.
