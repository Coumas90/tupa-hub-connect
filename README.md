# tupa-hub-connect

Plataforma de integración empresarial que conecta sistemas POS (Punto de Venta) con Odoo ERP, proporcionando sincronización automatizada de datos, monitoreo en tiempo real y gestión centralizada de múltiples ubicaciones.

## 🚀 Stack Tecnológico

- **Frontend:** React 18, TypeScript, Vite
- **UI Framework:** Tailwind CSS, Shadcn/ui, Radix UI
- **Backend:** Supabase (PostgreSQL, Edge Functions, Authentication)
- **State Management:** TanStack React Query, React Hook Form
- **Testing:** Vitest, React Testing Library, Cypress
- **Monitoring:** Sentry, Winston Logger
- **Deployment:** Vercel, GitHub Actions
- **Security:** CSP Headers, Row Level Security (RLS)

## 🔐 Variables de Entorno

El proyecto utiliza Supabase para el manejo de secrets, **no requiere archivo `.env.local`**. Las siguientes variables se configuran a través del dashboard de Supabase:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clave pública de Supabase para autenticación | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para operaciones administrativas | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_DB_URL` | URL directa de la base de datos PostgreSQL | `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres` |
| `OPENAI_API_KEY` | API key para funcionalidades de IA | `sk-proj-xxxxx` |
| `RESEND_API_KEY` | API key para envío de emails | `re_xxxxx` |

> 📝 **Nota:** Las API keys se configuran desde la UI de administración o mediante el dashboard de Supabase.

## 🏃‍♂️ Cómo Empezar (Getting Started)

Sigue estos pasos para configurar el proyecto en tu máquina local:

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd tupa-hub-connect
```

### 2. Instalar dependencias
```bash
npm install
```
> Instala todas las dependencias del proyecto incluyendo React, TypeScript, Tailwind CSS y las librerías de UI.

### 3. Configurar Supabase (requerido)
- El proyecto está conectado al proyecto Supabase: `hmmaubkxfewzlypywqff`
- Las credenciales están configuradas en `src/lib/config.ts`
- Agregar `/auth/callback` en Authentication → URL Configuration → Redirect URLs
- No se requiere configuración adicional para desarrollo

### 4. Ejecutar migraciones de base de datos (si es necesario)
```bash
npx supabase db reset
```
> Aplica el esquema de base de datos y las políticas RLS desde las migraciones.

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```
> Inicia el servidor de desarrollo en `http://localhost:8080` con hot-reload habilitado.

### 6. Ejecutar tests (opcional)
```bash
npm run test        # Tests unitarios
npm run test:ui     # Tests con interfaz visual
npm run test:e2e    # Tests end-to-end con Cypress
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── ui/             # Componentes base de Shadcn/ui
│   │   ├── admin/          # Componentes del panel administrativo
│   │   ├── auth/           # Componentes de autenticación
│   │   └── forms/          # Formularios específicos
│   ├── pages/              # Páginas principales de la aplicación
│   ├── hooks/              # Custom hooks de React
│   ├── lib/                # Utilidades y configuraciones
│   │   ├── integrations/   # Adaptadores para sistemas POS/ERP
│   │   ├── services/       # Servicios de API
│   │   └── utils.ts        # Funciones utilitarias
│   ├── integrations/       # Integraciones con servicios externos
│   │   ├── supabase/       # Cliente y tipos de Supabase
│   │   ├── pos/            # Adaptadores POS (Fudo, Bistrosoft)
│   │   └── odoo/           # Integración con Odoo ERP
│   └── contexts/           # Context providers de React
├── supabase/
│   ├── functions/          # Edge Functions de Supabase
│   ├── migrations/         # Migraciones de base de datos
│   └── config.toml         # Configuración del proyecto Supabase
├── sdk/                    # SDK para desarrolladores externos
├── cypress/                # Tests end-to-end
├── scripts/                # Scripts de automatización
└── docs/                   # Documentación técnica
```

### Carpetas Importantes:

- **`src/components/ui/`**: Componentes de diseño base usando Shadcn/ui y Radix UI
- **`src/lib/integrations/`**: Lógica de negocio para conectar con sistemas POS y ERP
- **`src/pages/`**: Páginas principales como Dashboard, Consumo, Academia, etc.
- **`supabase/functions/`**: Funciones serverless para lógica backend
- **`sdk/`**: SDK independiente para que terceros integren sus sistemas

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build para producción |
| `npm run preview` | Preview del build de producción |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:ui` | Tests con interfaz visual |
| `npm run lint` | Linter de código |

## 🏗️ Funcionalidades Principales

- **Panel de Administración**: Gestión de integraciones, clientes y configuraciones
- **Sincronización POS**: Conexión automática con sistemas Fudo, Bistrosoft, Simphony
- **Analytics de Consumo**: Dashboards y reportes de ventas en tiempo real
- **Academia Digital**: Sistema de cursos y certificaciones para baristas
- **Multi-ubicación**: Gestión centralizada de múltiples sucursales
- **Monitoreo y Logs**: Seguimiento detallado de operaciones e integraciones

## 🔒 Seguridad

- Ver “Profiles & RLS” más abajo para evitar 403 en `/profiles`.


- **Row Level Security (RLS)**: Políticas de acceso a nivel de base de datos
- **Content Security Policy**: Headers de seguridad configurados
- **Autenticación JWT**: Sistema de tokens con rotación automática
- **Auditoría**: Campos automáticos de creación y modificación
- **Validación**: Esquemas Zod para validación de datos

### Profiles & RLS
- Onboarding automático pos‑login (upsert `profiles.{id,email}`)
- Políticas RLS recomendadas: ver `docs/sql/policies_profiles.sql`
- PK: `profiles.id` = `auth.users.id`
- Verificación rápida: evitar 403 al leer `/rest/v1/profiles` autenticado

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

### Smoke de login (Cypress)

Requisitos: tener un usuario de prueba y URL base accesible (dev o preview).

Variables de entorno (Cypress lee CYPRESS_*):
- `CYPRESS_E2E_EMAIL` y `CYPRESS_E2E_PASSWORD` para credenciales
- `CYPRESS_baseUrl` (opcional) si no usás el default `http://localhost:4173`

Comandos sugeridos (sin modificar package.json):
```bash
# 1) Levantar la app en dev
npm run dev
# en otra terminal, abrir Cypress apuntando al dev server (ajusta puerto si es necesario)
CYPRESS_baseUrl=http://localhost:5173 \
CYPRESS_E2E_EMAIL=usuario@test.com \
CYPRESS_E2E_PASSWORD=secret \
npx cypress open

# Para ejecutar en modo headless
CYPRESS_baseUrl=http://localhost:5173 \
CYPRESS_E2E_EMAIL=usuario@test.com \
CYPRESS_E2E_PASSWORD=secret \
npx cypress run --browser chrome
```

El test se encuentra en `cypress/e2e/auth_login.cy.ts` y valida login → `/dashboard`.


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

## 📚 Documentación Adicional

- [Arquitectura del Sistema](docs/ARCHITECTURE.drawio)
- [Guía de Deployment](docs/DEPLOY.md)
- [Configuración de GitHub Actions](docs/GITHUB_ACTIONS_SETUP.md)
- [Integración con Sentry](docs/SENTRY_INTEGRATION.md)
- [Onboarding para Desarrolladores](docs/ONBOARDING.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Ejecuta los tests (`npm run test`)
4. Commit tus cambios (`git commit -m 'Add amazing feature'`)
5. Push a la rama (`git push origin feature/amazing-feature`)
6. Abre un Pull Request

## 📧 Soporte

Para soporte técnico o preguntas sobre el proyecto, consulta la documentación en la carpeta `docs/` o contacta al equipo de desarrollo.