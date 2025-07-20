# 🚀 Guía de Despliegue - TUPÁ Hub

## 📦 Instalación

### Clonar el repositorio
```bash
git clone https://github.com/[tu-usuario]/tupa-hub.git
cd tupa-hub
```

### Instalar dependencias
```bash
npm install
```

## 🔐 Variables de Entorno

⚠️ **Importante**: Este proyecto **no usa archivos `.env`** por limitación de Lovable. Las configuraciones se manejan de la siguiente manera:

### Variables públicas (en `src/lib/config.ts`)
```typescript
SUPABASE_URL=https://hmmaubkxfewzlypywqff.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variables secretas (en Supabase Secrets)
```bash
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
REACT_APP_SENTRY_DSN=
ODOO_API_KEY=
POS_API_KEYS=
NOTIFICATION_TOKENS=
```

### Configuración por cliente
Las credenciales de POS y Odoo se configuran por cliente en la interfaz de administración, no como variables de entorno.

## 🚀 Deploy Local y Producción

### Desarrollo Local
```bash
# Levantar servidor de desarrollo
npm run dev

# El servidor estará disponible en:
# http://localhost:8080
```

### Preview de Producción
```bash
# Construir y previsualizar
npm run build
npm run preview
```

### Deploy en Lovable
1. El deploy se hace automáticamente desde la interfaz de Lovable
2. Click en "Publish" en la esquina superior derecha
3. La app estará disponible en: `https://[nombre-proyecto].lovable.app`

### Deploy en Vercel (alternativo)
```bash
# Conectar el repositorio de GitHub a Vercel
# Configurar las variables de entorno en Vercel Dashboard
# Deploy automático en cada push a main
```

### Deploy manual
```bash
# Construir para producción
npm run build

# Los archivos estáticos estarán en dist/
# Subir a cualquier hosting estático (Netlify, Vercel, etc.)
```

## 🧪 Testing

### Tests Unitarios
```bash
# Correr tests una vez
npm test

# Correr tests en modo watch
npm run test:watch

# Correr tests con coverage
npm run test:coverage

# Interfaz visual de tests
npm run test:ui
```

### Tests de Estrés (Artillery)
```bash
# Instalar Artillery globalmente
npm install -g artillery

# Correr test de carga básico
artillery run load-test.yml

# Test específico de refresh tokens
artillery run load-test.yml --target https://hmmaubkxfewzlypywqff.supabase.co/functions/v1/

# Ver reporte detallado
artillery run load-test.yml --output report.json
artillery report report.json
```

### Linting y Formato
```bash
# Verificar formato de código
npm run lint

# Correr todas las verificaciones
npm run build  # Incluye type checking
```

## 🔧 Configuración Adicional

### Supabase
1. Las migraciones se ejecutan automáticamente
2. Edge Functions se despliegan automáticamente
3. RLS policies están configuradas para seguridad

### Monitoring
- Logs disponibles en Supabase Dashboard
- Integración con Sentry para errores en producción
- Artillery para tests de rendimiento

### Seguridad
- CSP headers configurados
- RLS policies activas
- Secrets manejados por Supabase
- No hay credenciales en código fuente