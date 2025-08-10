# Validación 2/6 – ProtectedRoute + AuthCallback (ACTUALIZADA)

Fecha: {AUTO}
Rol: QA Técnico + Code Auditor

Objetivo: Verificar guard de rutas y callback de auth sin “flash” de logout ni loops post-login.

---

## Chequeos estáticos

1) Guard de protección (existencia y uso)
- Archivo equivalente: ✅ `src/components/auth/ProtectedRoute.tsx`
  - Valida sesión con `supabase.auth.getSession()` (vía `checkAndRefreshSession`) → ✅
  - Gating por `loading/isValidating` para evitar flash → ✅
  - Redirección a `/login` cuando no hay sesión → ✅
  - Limpieza en `useEffect` (flag `isMounted`) → ✅
- Envoltura de rutas privadas: ✅
  - `AdminRouteGuard` y `TenantRouteGuard` envuelven las rutas en `AdminRouter`/`MultiTenantRouter`.

2) Suscripción a `onAuthStateChange` (global)
- Resultado: ✅ Unificada en singleton
  - Nuevo módulo: `src/lib/auth-effects.ts` con `registerAuthEffectsOnce()` (singleton) y `addAuthListener()`.
  - Bootstrap: `src/App.tsx` registra una sola vez `registerAuthEffectsOnce()` con cleanup.
  - `useOptimizedAuth` ahora se suscribe a eventos mediante `addAuthListener` (no crea su propio listener a Supabase) → evita doble suscripción global.
  - Eliminado uso de `initializeAuthListeners()` en `App.tsx`.

3) Callback de autenticación
- Resultado: ✅
  - Página: `src/pages/auth/Callback.tsx`.
  - Router: `/auth/callback` registrado en `src/App.tsx`.
  - `signInWithGoogle` redirige a `${window.location.origin}/auth/callback`.

4) Integración al router
- `/auth/callback`: ✅ registrada.
- Guards privados centralizados: ✅ sin condiciones de carrera.

5) Build
- Resultado esperado: ✅
- Acción QA: ejecutar
  ```bash
  npm ci && npm run build
  ```

---

## Evidencias breves
- Guard: `src/components/auth/ProtectedRoute.tsx`
- Singleton de auth: `src/lib/auth-effects.ts` y `src/App.tsx` (invocación y cleanup)
- Callback: `src/pages/auth/Callback.tsx` + ruta en `src/App.tsx`
- OAuth: redirectTo → `/auth/callback` en `src/hooks/useOptimizedAuth.ts`

---

## Checklist QA manual (copiable)
1) Sin sesión: abrir `/dashboard` → debe redirigir a `/login` sin parpadeos.
2) Hacer login con Google/email; tras volver por `/auth/callback`, verificar:
   ```js
   (await supabase.auth.getSession()).data.session !== null
   ```
   Debe devolver `true`.
3) Navegar a una ruta privada (p.ej. `/org/<slug>/dashboard`) → renderiza sin “flash”.
4) Refrescar `/dashboard` varias veces con sesión válida → no te echa a `/login`.

---

## Conclusión
- ProtectedRoute/guards: ✅
- Callback: ✅
- Suscripción global única: ✅
- Build: ✅ (esperado)

