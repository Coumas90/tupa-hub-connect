# Migración a sesiones basadas en cookies

Este proyecto migró el manejo de sesiones de Supabase desde `localStorage` a **cookies HTTP-only** para mejorar la seguridad.

## Cambios clave

- Se configura `auth.storageKey` para utilizar un nombre de cookie dedicado (`sb-auth-token`).
- Las cookies se crean con opciones seguras: `SameSite=Lax` y `Secure`.
- Se implementaron utilidades para establecer, leer y eliminar la sesión mediante cookies.
- Los hooks `useOptimizedAuth` y `useSmartAuth` ahora leen la sesión desde estas cookies.

## Pruebas en navegadores modernos

1. **Inicio de sesión**
   - Abrir la aplicación en Chrome, Firefox y Safari.
   - Iniciar sesión y verificar que se crea la cookie `sb-auth-token` con los atributos `Secure` y `SameSite=Lax`.
2. **Persistencia de sesión**
   - Recargar la página y comprobar que la sesión se mantiene.
   - Cerrar y volver a abrir la pestaña para confirmar que la cookie persiste.
3. **Cierre de sesión**
   - Ejecutar el flujo de logout y verificar que la cookie se elimina.
4. **Bloqueo de acceso**
   - Intentar acceder a la aplicación en modo incógnito o con cookies deshabilitadas para confirmar que la sesión no se reutiliza.

Estas pruebas aseguran que la autenticación basada en cookies funciona correctamente en los principales navegadores y que las sesiones se gestionan de forma segura.
