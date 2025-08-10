# Validación 2/6 – ProtectedRoute + AuthCallback (FINAL)

Fecha: {AUTO}
Rol: QA Técnico + Code Auditor

Objetivo: Confirmar que el guard de rutas y el callback de auth están bien integrados, sin “flash” de logout ni loops.

---

## Chequeos (estático)

1) Guard (ProtectedRoute)
- Archivo: ✅ `src/components/auth/ProtectedRoute.tsx`
- supabase.auth.getSession() al montar: ✅ (vía helper `checkAndRefreshSession()` que llama a `getSession()` y refresca si expira)
- Suscripción a onAuthStateChange con cleanup: ✅ (centralizada en singleton, no en el componente; ver punto Suscripciones)
- Estado ready/gating: ✅ (`loading`/`isValidating` bloquean render hasta validar sesión)
- Redirección a /login sin sesión: ✅
- Todas las rutas privadas envueltas por ProtectedRoute: ❌ (se usan `AdminRouteGuard`/`TenantRouteGuard` como guards de rol/tenant en `AdminRouter`/`MultiTenantRouter`)

2) Callback
- Archivo: ✅ `src/pages/auth/Callback.tsx`
- Llama a supabase.auth.getSession() al cargar: ✅
- Redirige a /dashboard si hay sesión; /login si no: ✅
- Sin efectos duplicados ni setState tras unmount: ✅ (flag `cancelled` y cleanup)

3) Router
- Ruta /auth/callback registrada: ✅ (`src/App.tsx` → `<Route path="/auth/callback" element={<AuthCallback />} />`)
- No hay otro guard paralelo que cause condiciones de carrera: ✅ (existen guards de rol/tenant, pero no duplican listeners ni side-effects globales)

4) Suscripciones
- Suscripción global única a onAuthStateChange: ✅ `src/lib/auth-effects.ts` (singleton `registerAuthEffectsOnce()` con `unsubscribe`)
- Uso en bootstrap: ✅ `src/App.tsx` registra una sola vez y hace cleanup en unmount
- Sin duplicados fuera del patrón: ✅ (`useOptimizedAuth` usa `addAuthListener` y ya no crea su propio listener a Supabase)

---

## Chequeos (build)
- Comando: `npm ci && npm run build`
- Resultado esperado: ✅ (typecheck en editor OK). Ejecutar en entorno local/CI para confirmación final.

---

## Checklist (runtime – QA manual)
1) Sin sesión: abrir `/dashboard` → debe redirigir a `/login` sin parpadeos.
2) Con sesión: hacer sign-in → vuelve por `/auth/callback` y aterriza en `/dashboard`.
3) Recargar `/dashboard` 2–3 veces → no te expulsa a `/login`.
4) Consola tras login:
```js
(await supabase.auth.getSession()).data.session !== null
```
Debe devolver `true`.

---

## Observaciones y mejora mínima sugerida
- “Todas las rutas privadas envueltas por ProtectedRoute”: ❌ actualmente se usan guards de rol/tenant. Funciona bien y no genera loops, pero para cumplir literalmente el criterio se puede envolver los routers privados con ProtectedRoute (sin cambiar UI ni copy):

Diff mínimo propuesto:
```tsx
// src/App.tsx (fragmento)
import { ProtectedRoute, AdminRoute } from '@/components/auth/ProtectedRoute';

// En <Routes>
<Route
  path="/org/*"
  element={<ProtectedRoute><MultiTenantRouter /></ProtectedRoute>}
/>

<Route
  path="/admin/*"
  element={<ProtectedRoute requireAdmin><AdminRouter /></ProtectedRoute>}
/>
```
- Estos wrappers añaden gating de sesión antes de los guards de rol/tenant sin duplicar listeners.

PR sugerido: `fix(auth): envolver routers privados con ProtectedRoute`

---

## Estado final
- ProtectedRoute correcto y con gating: ✅
- AuthCallback presente y redirigiendo: ✅
- Ruta /auth/callback registrada: ✅
- Suscripción global única (singleton) + cleanup: ✅
- Rutas privadas bajo ProtectedRoute: ❌ (equivalente con guards de rol/tenant; ver diff mínimo sugerido)
- Build: ✅ (esperado)
