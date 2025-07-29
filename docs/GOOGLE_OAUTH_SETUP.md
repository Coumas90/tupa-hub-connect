# 🔐 Configuración Google OAuth - TUPÁ Hub

## **URGENTE: Configuración requerida en Supabase**

### 1. **Configurar Site URL y Redirect URLs**

Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/auth/url-configuration):

#### Site URL:
```
https://preview--tupa-hub-connect.lovable.app
```

#### Redirect URLs (añadir todas):
```
https://preview--tupa-hub-connect.lovable.app
https://preview--tupa-hub-connect.lovable.app/
https://preview--tupa-hub-connect.lovable.app/app
https://preview--tupa-hub-connect.lovable.app/admin
```

### 2. **Configurar Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **APIs & Services > Credentials**
4. Crear **OAuth 2.0 Client ID**:

#### Authorized JavaScript origins:
```
https://preview--tupa-hub-connect.lovable.app
https://hmmaubkxfewzlypywqff.supabase.co
```

#### Authorized redirect URIs:
```
https://hmmaubkxfewzlypywqff.supabase.co/auth/v1/callback
```

### 3. **Configurar en Supabase**

Ve a [Google Provider Settings](https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/auth/providers):

1. Habilitar **Google Provider**
2. Añadir tu **Client ID** y **Client Secret** de Google Cloud
3. Dejar en blanco el campo "Additional Scopes" (usamos defaults)

---

## **Errores comunes y soluciones**

### ❌ "requested path is invalid"
- **Causa:** Site URL mal configurado
- **Solución:** Asegurar Site URL exacto en Supabase

### ❌ "Origin not allowed"
- **Causa:** JavaScript origins no configurados
- **Solución:** Añadir dominio en Google Cloud Console

### ❌ "Redirect URI mismatch"
- **Causa:** Redirect URI incorrecto
- **Solución:** Usar exactamente: `https://hmmaubkxfewzlypywqff.supabase.co/auth/v1/callback`

---

## **Testing**

Una vez configurado, probar:
1. Login con Google en staging
2. Verificar redirección correcta
3. Comprobar que el rol se extrae del user_metadata

---

## **Próximos pasos**

- [ ] Configurar Site URLs en Supabase
- [ ] Configurar Google Cloud Console
- [ ] Añadir credenciales en Supabase
- [ ] Testing completo del flujo OAuth