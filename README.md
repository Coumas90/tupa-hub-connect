# TUPÁ Hub - Sistema de Integración POS

TUPÁ Hub es una plataforma de integración que conecta diferentes sistemas Point of Sale (POS) con Odoo, proporcionando sincronización automática de datos y gestión centralizada de integraciones.

## 🚀 Características Principales

- **Integración Multi-POS**: Soporte para Fudo, Bistrosoft y otros sistemas POS
- **Sincronización con Odoo**: Push automático de datos a Odoo ERP
- **Panel de Administración**: Gestión centralizada de clientes e integraciones
- **Monitoreo en Tiempo Real**: Logs detallados y estado de sincronizaciones
- **SDK Reutilizable**: Librería TypeScript para nuevas integraciones
- **Sistema de Roles**: Control de acceso basado en roles (admin/user)

## 🏗️ Arquitectura del Sistema

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

## 📋 Requisitos Previos

- **Node.js** v18+ y npm
- **Cuenta de Supabase** (para backend)
- **Acceso a sistemas POS** (credenciales API)

## ⚡ Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd tupa-hub
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase
Este proyecto usa **Supabase** como backend y no requiere archivos `.env` tradicionales.

**Configuración de Secrets** (para producción):
- `SUPABASE_URL`: URL del proyecto Supabase
- `SUPABASE_ANON_KEY`: Clave pública de Supabase  
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio (solo Edge Functions)

**APIs Externas** (configuradas por cliente en la UI):
- API Keys de POS (Fudo, Bistrosoft, etc.)
- Credenciales de Odoo
- Tokens de servicios de notificación

### 4. Iniciar desarrollo
```bash
npm run dev
```

## 🛠️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm test` | Ejecuta suite de tests con Vitest |
| `npm run test:ui` | Abre interfaz visual de testing |
| `npm run build` | Genera build de producción |
| `npm run build:dev` | Build en modo desarrollo |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | Ejecuta ESLint |

## 🏛️ Estructura del Proyecto

```
src/
├── components/          # Componentes React reutilizables
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── admin/          # Componentes específicos de admin
├── pages/              # Páginas de la aplicación
├── hooks/              # Custom React hooks
├── lib/                # Utilidades y configuración
│   ├── api/           # Cliente HTTP y configuración
│   └── integrations/   # Lógica de integraciones POS
├── integrations/       # Configuración de Supabase
└── __tests__/          # Tests unitarios

sdk/                    # TUPÁ SDK independiente
├── adapters/          # Adaptadores por POS
├── schemas/           # Validaciones Zod
└── types.ts           # Tipos TypeScript

supabase/              # Configuración del backend
├── functions/         # Edge Functions
└── migrations/        # Migraciones de DB
```

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

El proyecto usa **Vitest** + **React Testing Library** para testing:

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm test -- --watch

# Con interfaz visual
npm run test:ui

# Coverage
npm test -- --coverage
```

### Estructura de Tests
- **UI Components**: `src/__tests__/components/`
- **Pages**: `src/__tests__/pages/`
- **Hooks**: `src/__tests__/hooks/`
- **SDK**: `sdk/__tests__/`

## 🔒 Seguridad

### Autenticación
- **Supabase Auth** con email/password
- **Row Level Security (RLS)** en todas las tablas
- **Roles de usuario**: admin, user

### Manejo de Secrets
- **API Keys**: Almacenadas en Supabase Secrets
- **Credenciales POS**: Configuradas por cliente vía UI
- **Tokens**: Rotación automática donde sea posible

### Políticas RLS Implementadas
- `client_configs`: Solo usuarios autenticados
- `integration_logs`: Lectura/creación autenticada  
- `user_roles`: Solo lectura de rol propio

## 📊 Monitoreo y Logs

### Tipos de Logs
- **Integration Logs**: Sincronizaciones POS → TUPÁ
- **Error Logs**: Fallos de API y conexión
- **Performance Logs**: Tiempos de respuesta
- **Auth Logs**: Accesos y seguridad

### Métricas Clave
- Tasa de éxito de sincronización
- Latencia promedio de APIs
- Volumen de transacciones procesadas
- Errores por cliente/integración

## 🚀 Deployment

### Producción con Lovable
1. Click en "Publish" en la interfaz de Lovable
2. El deploy se hace automáticamente
3. URL de producción disponible instantáneamente

### Supabase Backend
- **Edge Functions**: Deploy automático vía git
- **Database**: Migraciones ejecutadas automáticamente
- **Secrets**: Configurados vía Supabase Dashboard

## 🔧 Configuración Avanzada

### Variables de Configuración
| Variable | Descripción | Default |
|----------|-------------|---------|
| `sync_frequency` | Intervalo de sync en minutos | 15 |
| `simulation_mode` | Modo prueba (no envía a Odoo) | false |
| `timeout` | Timeout de APIs en ms | 10000 |

### Personalización SDK
```typescript
import { TupaHub } from '@tupa/sdk';

const client = new TupaHub({
  adapter: 'custom-pos',
  config: {
    baseUrl: 'https://api.custom-pos.com',
    apiKey: 'your-api-key'
  }
});
```

## 📚 Documentación Adicional

- **[API Reference](./sdk/README.md)** - Documentación del SDK
- **[Edge Functions](./supabase/functions/)** - Funciones serverless
- **[Database Schema](./supabase/migrations/)** - Estructura de datos
- **[Testing Guide](./__tests__/README.md)** - Guía de testing

## 🤝 Contribución

### Flujo de Desarrollo
1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-integracion`
3. Desarrollar con tests incluidos
4. Pull Request con descripción detallada

### Estándares
- **TypeScript** estricto
- **Tests unitarios** obligatorios
- **ESLint** + **Prettier** para código
- **Conventional Commits** para mensajes

## 📞 Soporte

- **Issues**: [GitHub Issues](link-to-issues)
- **Slack**: Canal #tupa-dev  
- **Email**: dev@tupa.com
- **Docs**: [docs.tupa.com](link-to-docs)

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver [LICENSE](./LICENSE) para detalles.

---

<div align="center">
  <strong>Construido con ❤️ por el equipo TUPÁ</strong><br>
  <em>Conectando el presente con el futuro del retail</em>
</div>