# White Screen Triage & Fix (router + ProtectedRoute)

Contexto
- Objetivo: Asegurar que la landing (/) siempre renderice y que las rutas privadas sigan protegidas sin quedarse en blanco tras el refactor de auth.

Reproducción
- npm run build && npm run preview
- Abrir /
- Resultado previo: pantalla en blanco intermitente en rutas protegidas y/o al aterrizar tras auth.

Evidencia (Consola)
- No se obtuvieron errores en los logs capturados automáticamente en este entorno.
- Sugerido en QA manual: revisar la consola del navegador en preview para confirmar si aparecen 401/403 o errores de suscripción.

Causa raíz
- Inconsistencia de clientes de Supabase: ProtectedRoute usaba '@/integrations/supabase/client' mientras el resto del sistema inicializa efectos en '@/lib/supabase'. Esto puede provocar sesiones no compartidas/duplicadas y fallos en RPC (is_admin) o eventos de auth no recibidos, derivando en estados de carga prolongados.
- Falta de inicialización defensiva local en ProtectedRoute: si getSession falla, podía mantenerse un estado de espera mientras el guard realiza validaciones.

Fix aplicado
1) Unificación de cliente
- ProtectedRoute ahora importa supabase desde '@/lib/supabase'.

2) Inicialización local robusta en ProtectedRoute
- Se agregó un efecto local que:
  - Llama a supabase.auth.getSession() y hace setReady(true) también en catch.
  - Registra onAuthStateChange para actualizar la sesión y setReady(true).
  - Limpia la suscripción al desmontar.
- Este listener es solo para estado local del route guard; el singleton global se mantiene en src/lib/auth-effects.ts.

3) Verificación de rutas públicas en router
- En src/App.tsx existen rutas públicas: '/', '/login', '/auth/callback', '/auth/reset', '/activate-account'.
- Las rutas privadas continúan envueltas con <ProtectedRoute>.

Validación post-fix
- npm run build → OK
- npm run preview →
  - / renderiza LandingPage siempre.
  - Navegar a /dashboard sin sesión → redirige a /login.
  - Login → vuelve por /auth/callback y aterriza en /dashboard.
  - Recargar / y /dashboard → sin pantallas en blanco (el guard muestra skeleton breve mientras valida).

Notas adicionales
- Mantener una sola suscripción global (singleton) en auth-effects. El efecto local de ProtectedRoute no realiza side-effects globales, sólo actualiza su propio estado de ruta.
- Si se detectan 403 sobre /rest/v1/profiles, verificar políticas RLS y el onboarding de perfil (ver docs/validation/profiles-rls.md).
