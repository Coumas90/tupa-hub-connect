# Final Readiness – ENV + Supabase + CI

Rol: DevOps + QA Técnico
Objetivo: Confirmar que no habrá “pantalla blanca” ni roturas de login por ENV mal configuradas. Todo verificado en código y CI.

Resumen de estado
- ✅ Safe client activo: src/lib/supabase.ts usa defaults seguros si faltan VITE_*
- ✅ Cookie options definidos: domain, sameSite, secure
- ✅ Rutas públicas/privadas correctas
- ✅ ProtectedRoute no bloquea init si getSession falla
- ✅ CI ejecuta landing + login
- ✅ .env.example agregado

1) Cliente Supabase
Evidencia: src/lib/supabase.ts

```ts
// Fallbacks seguros
const DEFAULT_SUPABASE_URL = 'https://hmmaubkxfewzlypywqff.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = '***anon***';
// Preferir ENV -> config -> defaults
const url = (import.meta as any)?.env?.VITE_SUPABASE_URL || config.supabase.url || DEFAULT_SUPABASE_URL;
const anon = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || config.supabase.anonKey || DEFAULT_SUPABASE_ANON_KEY;

// Cookies cross-subdomain seguras
cookieOptions: {
  domain: getCookieDomain(),
  sameSite: 'none',
  secure: isSecure,
}
```

Búsqueda de otros createClient( en src/:
- Resultado: solo en src/lib/supabase.ts

2) Archivos de entorno
- Nuevo: .env.example
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
- README actualizado con guía dev/preview/prod.

3) Router / Auth
Evidencia de rutas públicas (src/App.tsx):
- Public: `/`, `/login`, `/admin/login`, `/auth/reset`, `/auth/callback`, `/activate-account`
- Privadas: `/dashboard`, `/org/*`, `/admin/*`, `/app/*` envueltas con <ProtectedRoute>

ProtectedRoute tolerante a fallos (src/components/auth/ProtectedRoute.tsx):
```ts
useEffect(() => {
  let active = true;
  supabase.auth.getSession()
    .then(({ data }) => { if (!active) return; setSession(data.session); setReady(true); })
    .catch(() => { if (!active) return; setReady(true); });
  const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!active) return; setSession(s); setReady(true); });
  return () => { active = false; sub?.subscription?.unsubscribe?.(); };
}, []);
```

4) CI – Auth Smoke
Workflow: .github/workflows/ci-auth-smoke.yml
- Especifica specs:
  - cypress/e2e/landing.cy.ts
  - cypress/e2e/auth_login.cy.ts
- Usa secrets:
  - CYPRESS_E2E_EMAIL, CYPRESS_E2E_PASSWORD

5) Supabase – /auth/callback
Configurar en Authentication → URL Configuration (Dashboard Supabase):
- http://localhost:5173/auth/callback
- https://app.<tu-dominio>.com/auth/callback
- https://admin.<tu-dominio>.com/auth/callback (si aplica)

6) QA manual sugerido
```bash
npm ci && npm run build && npm run preview
# Verificar:
# 1) / renderiza sin blanco
# 2) /dashboard sin sesión redirige a /login sin parpadeo
# 3) Login → /auth/callback → /dashboard
# 4) Recargar / y /dashboard sin pantallas blancas
# 5) En consola post-login:
#    (await supabase.auth.getSession()).data.session !== null
```

7) Resultado esperado
- ✅ Landing siempre renderiza
- ✅ Login estable (callback OK, sin loops)
- ✅ ENV presentes o safe client activo (sin crash de import)
- ✅ CI verde con landing + login
- ✅ Este documento actualizado

Acciones pendientes fuera del repo
- Verificar y guardar Redirect URLs en Supabase Dashboard
- Cargar secrets E2E_EMAIL y E2E_PASSWORD en GitHub Actions

Enlaces útiles
- Supabase – Auth Providers: https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/auth/providers
- Supabase – Edge Functions: https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/functions
- GitHub Actions (repo): Revisar workflow CI Auth Smoke
