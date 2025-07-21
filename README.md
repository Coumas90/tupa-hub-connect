# TUPÁ Hub – Plataforma Central de Integraciones

TUPÁ Hub es una plataforma de integración que conecta diferentes sistemas Point of Sale (POS) con Odoo, proporcionando sincronización automática de datos y gestión centralizada de integraciones.

## 🚀 Instalación Local

```bash
git clone <repository-url>
cd tupa-hub
npm install
npm run dev
```

## ⚙️ Variables de Entorno

⚠️ **Importante**: Este proyecto **no usa variables VITE_** por limitación de Lovable. Las claves públicas (como Supabase anon key) están centralizadas en `src/lib/config.ts`.

**No se usan archivos .env**. La configuración se hace vía Supabase y código. Ver sección "Configuración por Cliente".

**Configuración de Secrets** (para Edge Functions):
- `SUPABASE_URL`: URL del proyecto Supabase  
- `SUPABASE_ANON_KEY`: Clave pública de Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio (solo backend)

**APIs por Cliente** (configuradas en la UI):
- API Keys de POS (Fudo, Bistrosoft, etc.)
- Credenciales de Odoo por cliente
- Tokens de notificaciones

## 🛠️ Scripts Disponibles

```bash
npm run dev      # desarrollo local
npm run build    # build producción  
npm run preview  # vista previa post-build
npm run test     # testing unitario con Vitest
npm run test:ui  # interfaz visual de testing
npm run lint     # ESLint
```

## 🧩 Estructura del Proyecto

```
src/            → Lógica principal del frontend
├── components/   → Componentes React reutilizables
│   ├── ui/      → Componentes base (shadcn/ui)  
│   └── admin/   → Componentes específicos de admin
├── pages/       → Páginas de la aplicación
├── hooks/       → Custom React hooks
├── lib/         → Utilidades y configuración
│   ├── api/     → Cliente HTTP y configuración
│   └── integrations/ → Lógica de integraciones POS
├── integrations/ → Configuración de Supabase
└── __tests__/   → Tests unitarios

supabase/       → Edge functions y configuración backend
├── functions/   → Edge Functions serverless
└── migrations/  → Migraciones de base de datos

sdk/            → Lógica de integración POS/Odoo
├── adapters/    → Adaptadores por POS (Fudo, Bistrosoft)
├── schemas/     → Validaciones Zod
└── types.ts     → Tipos TypeScript

public/         → Assets estáticos
.github/        → Workflows de CI/CD
```

## 📦 Features Principales

- **Panel Admin** con gestión de integraciones POS/Odoo
- **Logs automáticos** por cliente con trazabilidad completa
- **Sincronización manual y automática** configurable por cliente
- **Seguridad** con Supabase Auth + CSP (configurable)
- **Testing** con Vitest + React Testing Library
- **Auditoría de seguridad** (Snyk, CodeQL, OWASP ZAP)
- **SDK reutilizable** para nuevas integraciones
- **Sistema de roles** (admin/user/barista) con Row Level Security
- **LocationSwitcher** para gestión multi-ubicación
- **Campos de auditoría** automáticos en todas las tablas

## 📊 Diagrama de Arquitectura

<lov-mermaid>
graph TD
    subgraph "Sistemas POS"
        POS_FUDO[Fudo POS]
        POS_BISTRO[Bistrosoft POS]
        POS_OTHER[Otros POS]
    end
    
    subgraph "TUPÁ Hub Core"
        SYNC_ENGINE[Motor de Sincronización]
        API_LAYER[Capa de API]
        ADMIN_PANEL[Panel Administrativo]
        SDK[TUPÁ SDK]
    end
    
    subgraph "Supabase Backend"
        DATABASE[(Base de Datos)]
        EDGE_FUNCTIONS[Edge Functions]
        AUTH[Autenticación]
        RLS[Row Level Security]
    end
    
    subgraph "Sistemas Destino"
        ODOO[Odoo ERP]
        NOTIFICATIONS[Notificaciones]
    end
    
    POS_FUDO -->|REST API| SYNC_ENGINE
    POS_BISTRO -->|REST API| SYNC_ENGINE
    POS_OTHER -->|SDK| SDK
    
    SDK --> API_LAYER
    SYNC_ENGINE --> API_LAYER
    API_LAYER --> EDGE_FUNCTIONS
    
    ADMIN_PANEL --> DATABASE
    EDGE_FUNCTIONS --> DATABASE
    AUTH --> RLS
    
    SYNC_ENGINE -->|Push Data| ODOO
    EDGE_FUNCTIONS -->|Alerts| NOTIFICATIONS
    
    ADMIN_PANEL -.->|Configuración| SYNC_ENGINE
</lov-mermaid>

## 🔌 Integraciones Soportadas

### Sistemas POS
- **Fudo POS** ✅ - API REST v1
- **Bistrosoft** ✅ - API REST v1  
- **Simphony** 🔄 - En desarrollo
- **Otros** - Via SDK personalizable

### Sistemas Destino  
- **Odoo ERP** ✅ - XML-RPC
- **Webhooks** ✅ - Notificaciones HTTP
- **Email** ✅ - Alertas automáticas

## 🧪 Testing

Testing strategy usando **Vitest** + **React Testing Library**:

```bash
# Ejecutar todos los tests
npm test

# Modo watch para desarrollo
npm test -- --watch

# Interfaz visual de testing
npm run test:ui

# Generar coverage report
npm test -- --coverage
```

### Estructura de Tests
- **UI Components**: `src/__tests__/components/`
- **Pages**: `src/__tests__/pages/`  
- **Hooks**: `src/__tests__/hooks/`
- **Integrations**: `src/__tests__/pos/`
- **SDK**: `sdk/__tests__/`

## 🔒 Seguridad

### Autenticación y Autorización
- **Supabase Auth** con email/password
- **Row Level Security (RLS)** en todas las tablas
- **Sistema de roles**: admin, user, barista
- **Función `is_admin()`** para verificación de permisos
- **Triggers automáticos** para `updated_at`

### Políticas RLS Implementadas
- `client_configs`: Solo usuarios autenticados pueden modificar
- `integration_logs`: Lectura/creación para usuarios autenticados
- `user_roles`: Solo lectura de rol propio

### Manejo de Secrets
- **API Keys**: Almacenadas en Supabase Secrets
- **Credenciales POS**: Configuradas por cliente vía UI
- **JWT tokens**: Gestión automática de Supabase

## 📊 Monitoreo y Logs

### Tipos de Logs
- **Integration Logs**: Sincronizaciones POS → TUPÁ → Odoo
- **Error Logs**: Fallos de API y conexión  
- **Performance Logs**: Tiempos de respuesta
- **Auth Logs**: Accesos y eventos de seguridad

### Métricas Clave
- Tasa de éxito de sincronización por cliente
- Latencia promedio de APIs
- Volumen de transacciones procesadas
- Errores por cliente/integración
- Estado de conexiones POS/Odoo

## 🧪 Auditoría de Seguridad

Ver `SECURITY.md` para detalles completos.

**GitHub Actions automáticos para**:
- **audit-ci**: Auditoría de dependencias NPM
- **Snyk**: Detección de vulnerabilidades
- **CodeQL**: Análisis estático de código
- **OWASP ZAP**: Baseline scan del frontend

**Comandos manuales disponibles**:
```bash
# Auditoría de dependencias
npx audit-ci --moderate

# OWASP ZAP scan (requiere Docker)
docker run --rm owasp/zap2docker-stable zap-baseline.py -t https://preview--tupa-hub-connect.lovable.app
```

**⚠️ Recordatorio**: Restaurar CSP estricta en producción (actualmente en modo permisivo para desarrollo).

## ☁️ Deployment

### Producción
**Automatizado** con GitHub Actions y Lovable:
- Push a rama `main` → Deploy automático
- Edge Functions deploy automático vía Supabase
- Variables de entorno gestionadas por Lovable

### Proceso de Release
1. Desarrollar en rama `feature/*`
2. PR a `main` con review obligatorio
3. Deploy automático post-merge
4. Monitoreo via GitHub Actions + Supabase Dashboard

## 🔧 Configuración por Cliente

### Variables Configurables (en `client_configs`)
| Variable | Descripción | Default |
|----------|-------------|---------|
| `sync_frequency` | Intervalo de sync en minutos | 15 |
| `simulation_mode` | Modo prueba (no envía a Odoo) | false |
| `pos_type` | Tipo de POS (fudo/bistrosoft) | - |
| `pos_version` | Versión de API del POS | v1 |

### Personalización SDK
```typescript
import { TupaHub } from '@tupa/sdk';

const client = new TupaHub({
  adapter: 'fudo',
  config: {
    baseUrl: 'https://api.fudo.com',
    apiKey: 'client-api-key',
    version: 'v1'
  }
});
```

## 📄 Contribución

### Estándares de Código
- **Prettier + ESLint**: Formato automático
- **TypeScript**: Tipado estricto obligatorio  
- **Tests unitarios**: Coverage mínimo 80%
- **Commits**: Formato semántico (conventional commits)

### Flujo de Desarrollo
1. Fork del repositorio
2. Branch: `git checkout -b feature/nueva-funcionalidad`
3. Desarrollar con tests incluidos
4. PR con descripción detallada y screenshots

### Roles y Permisos
- **Admin**: Acceso completo + gestión de usuarios + bypass de filtros de ubicación
- **Usuario**: Acceso a módulos según configuración y ubicación asignada
- **Barista**: Solo acceso a operaciones básicas de su ubicación

## 📍 LocationSwitcher - Gestión Multi-Ubicación

### Uso del Componente
```tsx
import { LocationSwitcher } from '@/components/LocationSwitcher';

// El componente se renderiza automáticamente solo si:
// - El usuario tiene acceso a múltiples ubicaciones
// - El usuario está autenticado
function Header() {
  return (
    <div className="header">
      <LocationSwitcher />
    </div>
  );
}
```

### Características
- **Auto-hide**: Se oculta automáticamente si solo hay una ubicación
- **Fallback inteligente**: Lógica de respaldo para determinar ubicación activa
- **Validación de acceso**: Solo muestra ubicaciones del grupo del usuario
- **Estado de carga**: UI responsiva durante cambios de ubicación
- **Persistencia**: Recuerda la última ubicación seleccionada

### Lógica de Fallback
1. **Ubicación preferida** (de sessionStorage o parámetro)
2. **Ubicación asignada** al usuario (`users.location_id`)
3. **Ubicación principal** del grupo (`locations.is_main = true`)
4. **Primera ubicación** disponible en el grupo

### Seguridad
- Verificación JWT en cada cambio
- Validación de pertenencia al grupo
- RLS policies automáticas
- Logs de auditoría en cambios

## 🔍 Campos de Auditoría

### Implementación Automática
Todas las tablas incluyen campos de auditoría que se populan automáticamente:

```sql
-- Campos añadidos a todas las tablas
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)

-- Trigger automático
CREATE TRIGGER audit_[table_name]
  BEFORE INSERT OR UPDATE ON public.[table_name]
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();
```

### Tablas con Auditoría
- ✅ `recipes` - Recetas por ubicación
- ✅ `consumptions` - Datos de consumo
- ✅ `clients` - Información de clientes
- ✅ `orders` - Órdenes por ubicación
- ✅ `locations` - Ubicaciones y sucursales
- ✅ `groups` - Grupos de ubicaciones
- ✅ `users` - Usuarios del sistema
- ✅ `instructors` - Instructores de cursos
- ✅ `courses` - Cursos de capacitación
- ✅ `course_modules` - Módulos de cursos
- ✅ `quizzes` - Evaluaciones
- ✅ `quiz_questions` - Preguntas de evaluaciones
- ✅ `user_course_progress` - Progreso de usuarios
- ✅ `user_quiz_attempts` - Intentos de evaluaciones
- ✅ `client_configs` - Configuraciones por cliente
- ✅ `integration_logs` - Logs de integraciones
- ✅ `pos_sync_logs` - Logs de sincronización POS
- ✅ `pos_sync_status` - Estado de sincronización

### Función de Backfill
```bash
# Edge function para poblar registros existentes
curl -X POST https://your-project.supabase.co/functions/v1/backfill-audit-fields \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Beneficios
- **Trazabilidad completa**: Quién creó/modificó cada registro
- **Compliance**: Cumplimiento con requisitos de auditoría
- **Debugging**: Facilita la resolución de problemas
- **Reportes**: Análisis de actividad por usuario

## 🚨 Troubleshooting

### Errores Comunes
- **CSP Errors**: Verificar modo permisivo en desarrollo
- **Auth Errors**: Verificar configuración de Supabase
- **POS Connection**: Revisar API keys en `client_configs`
- **Build Errors**: Verificar dependencias con `npm audit`

### Logs y Debug
- **Frontend**: Console del navegador
- **Backend**: Supabase Edge Function logs
- **Database**: Supabase SQL logs
- **Network**: Network tab del DevTools

## 📞 Support & Documentation

### 📋 Technical Documentation
- **[Deployment Guide](docs/DEPLOY.md)** - Environment variables, deployment processes, troubleshooting
- **[Onboarding Guide](docs/ONBOARDING.md)** - Developer setup, debugging guide, best practices
- **[Architecture Diagram](docs/ARCHITECTURE.drawio)** - System architecture and data flow
- **[Security Guidelines](SECURITY.md)** - Security procedures and audit requirements

### 🆘 Support Contacts

**Development Team:**
- **Tech Lead**: [tech-lead@company.com](mailto:tech-lead@company.com)
- **DevOps Engineer**: [devops@company.com](mailto:devops@company.com)
- **Team Slack**: #tupahub-dev

**Platform Support:**
- **Lovable Support**: [support@lovable.dev](mailto:support@lovable.dev)
- **Supabase Support**: [Dashboard Support](https://supabase.com/dashboard/support)

**Emergency Contacts:**
- **On-call Engineer**: [oncall@company.com](mailto:oncall@company.com) (24/7)
- **Incident Response**: [incidents@company.com](mailto:incidents@company.com)

**Business Contacts:**
- **Product Owner**: [product@company.com](mailto:product@company.com)
- **Customer Success**: [success@company.com](mailto:success@company.com)

### 🐛 Issue Reporting

**For Bugs & Technical Issues:**
1. Check existing documentation first
2. Search previous issues in repository
3. Create GitHub issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Console logs and error messages
   - Environment details (browser, device)

**For Security Issues:**
- **Email**: [security@company.com](mailto:security@company.com)
- **PGP Key**: Available on request
- **Response Time**: 24 hours for critical issues

**For Feature Requests:**
- Create GitHub discussion
- Include business justification
- Provide mockups or examples if possible

---

<div align="center">
  <strong>Built with ❤️ by the TUPÁ Team</strong><br>
  <em>Connecting the present with the future of retail</em><br><br>
  
  **Need help?** Check our [troubleshooting docs](https://docs.lovable.dev/tips-tricks/troubleshooting) or contact support above.
</div>