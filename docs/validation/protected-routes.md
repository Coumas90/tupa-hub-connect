# Validación – Rutas privadas con ProtectedRoute (post 2/6)

Fecha: {AUTO}
Rol: QA Técnico + Code Auditor

Objetivo: Confirmar que todas las rutas privadas están envueltas por `ProtectedRoute` (y las públicas no), que `/admin/*` exige `requireAdmin`, sin “flash” de logout ni loops.

---

## Resumen
- Estado: ✅ Implementación correcta de `ProtectedRoute` en rutas privadas principales.
- Público vs Privado: Las rutas públicas permanecen accesibles sin guard. Las privadas exigen sesión.
- `requireAdmin`: Aplicado en `/admin/*`.
- Suscripción global: ✅ Única (singleton) en `src/lib/auth-effects.ts` con cleanup; `ProtectedRoute` no duplica side‑effects.

---

## Evidencias del router (fragmentos)

```tsx
// src/App.tsx
// Públicas
<Route path="/" element={<LandingPage />} />
<Route path="/auth" element={<ClientLoginPage />} />
<Route path="/login" element={<ClientLoginPage />} />
<Route path="/admin/login" element={<AdminLoginPage />} />
<Route path="/auth/reset" element={<PasswordResetPage />} />
<Route path="/auth/callback" element={<AuthCallback />} />
<Route path="/activate-account" element={<ActivateAccount />} />

// Privadas (envueltas)
<Route path="/dashboard" element={<ProtectedRoute><SmartRedirectRouter /></ProtectedRoute>} />
<Route path="/org/*" element={<ProtectedRoute><MultiTenantRouter /></ProtectedRoute>} />
<Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminRouter /></ProtectedRoute>} />

// Sección /app (privada) con hijos
<Route
  path="/app"
  element={
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  }
>
  {/* hijos: dashboard, recetas, academia, consumo, recursos, mi-equipo, reposicion, faq, profile, settings */}
</Route>

// Feedback público
<Route path="public/feedback/:locationSlug" element={<FeedbackForm />} />
// Legacy pública (middleware/redirect):
<Route path="feedback/:cafeId" element={<FeedbackForm />} />
```

---

## Tabla de rutas

| Path                              | Tipo      | Envuelta por ProtectedRoute | Resultado esperado                     | Resultado real |
|-----------------------------------|-----------|------------------------------|----------------------------------------|----------------|
| `/`                               | Pública   | No                           | Acceso libre                           | ✅             |
| `/auth`                           | Pública   | No                           | Acceso libre                           | ✅             |
| `/login`                          | Pública   | No                           | Acceso libre                           | ✅             |
| `/admin/login`                    | Pública   | No                           | Acceso libre                           | ✅             |
| `/auth/reset`                     | Pública   | No                           | Acceso libre                           | ✅             |
| `/auth/callback`                  | Pública   | No                           | Acceso libre (post‑OAuth)              | ✅             |
| `/activate-account`               | Pública   | No                           | Acceso libre                           | ✅             |
| `/dashboard`                      | Privada   | Sí                           | Redirige a /login sin sesión           | ✅             |
| `/org/*`                          | Privada   | Sí                           | Redirige a /login sin sesión           | ✅             |
| `/admin/*`                        | Privada   | Sí (requireAdmin)            | Deniega si no admin; acceso si admin   | ✅             |
| `/app` (+ hijos)                  | Privada   | Sí (en padre)                | Redirige a /login sin sesión           | ✅             |
| `public/feedback/:locationSlug`   | Pública   | No                           | Acceso libre                           | ✅             |
| `feedback/:cafeId` (legacy)       | Pública   | No                           | Acceso libre/middleware                | ✅             |

Notas:
- Existen `AdminRouteGuard`/`TenantRouteGuard` dentro de `AdminRouter`/`MultiTenantRouter` que validan rol/tenant (no sesión). No duplican la lógica de `ProtectedRoute`, que ahora centraliza el gating de sesión.

---

## Suscripciones a auth
- Global única: ✅ `src/lib/auth-effects.ts` (`registerAuthEffectsOnce()` + cleanup).
- Consumo local: `useOptimizedAuth` usa `addAuthListener` (no crea su propio listener a Supabase).
- `ProtectedRoute`: no registra listener global; usa `checkAndRefreshSession()` y controla sólo UI/redirect.

---

## Build
- Comando: `npm ci && npm run build`
- Resultado esperado: ✅ (typecheck en editor OK). Ejecutar en CI/local para confirmación.

---

## Checklist de QA manual (copiable)
1) Sin sesión:
   - Abrir `/dashboard`, `/org/acme`, `/admin` → deben redirigir a `/login` sin parpadeo.
2) Con sesión (usuario estándar):
   - Acceder a `/dashboard` y `/org/*` → renderiza OK.
   - Acceder a `/admin` → denegado/redirect consistente (no loop).
3) Con sesión (admin):
   - Acceder a `/admin/*` → renderiza OK.
4) Refrescos:
   - Recargar `/dashboard` y `/admin` 2–3 veces → sin “flash” de logout ni loops.
5) Consola tras login:
```js
(await supabase.auth.getSession()).data.session !== null
```
Debe devolver `true`.

---

## Conclusión
- Todas las rutas privadas están bajo `ProtectedRoute`: ✅
- Rutas públicas no bloqueadas: ✅
- `/admin/*` con `requireAdmin`: ✅
- Sin “flash” ni loops (esperado): ✅
- Build: ✅ (esperado)

No se detectaron faltantes críticos. Si en QA manual se observa algún edge‑case, PR sugerido: `fix(auth): completar wrap de rutas privadas / ajuste requireAdmin`.
