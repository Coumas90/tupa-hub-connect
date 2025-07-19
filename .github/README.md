# GitHub Actions - Configuración de CI/CD

Este proyecto utiliza GitHub Actions para automatizar procesos de seguridad, testing y quality assurance.

## Workflows Configurados

### 1. audit.yml - Seguridad y Tests Básicos
Workflow simple que ejecuta en cada push a `main` y `dev`:
- ✅ Security audit con `npm audit`
- ✅ Tests unitarios
- ✅ Build de producción
- ✅ Linting

### 2. ci.yml - Pipeline Completo de CI/CD
Pipeline avanzado con matriz de Node.js versions:
- 🔒 Security audit (nivel moderate)
- 🧪 Tests en Node 18 y 20
- 📊 Coverage de tests
- 🔍 Type checking con TypeScript
- 📝 Dependency review en PRs
- 🏗️ Build verification

## Dependabot
Configuración automática para:
- 📅 Revisión semanal (lunes 9:00)
- 🔄 Agrupación de updates minor/patch
- 🏷️ Labels automáticas
- 👥 Reviewers asignados

## Comandos Locales

```bash
# Ejecutar auditoría de seguridad
npm audit --audit-level=moderate

# Tests con coverage
npm test -- --coverage

# Build y lint
npm run build && npm run lint

# Type checking
npx tsc --noEmit
```

## Configuración de Seguridad

### Niveles de Audit
- **moderate**: Vulnerabilidades moderadas o superiores
- **high**: Solo vulnerabilidades altas y críticas
- **critical**: Solo vulnerabilidades críticas

### Licencias Permitidas
- MIT, ISC, Apache-2.0
- BSD-2-Clause, BSD-3-Clause

## Resolución de Fallos

### Security Audit Fails
```bash
# Ver detalles
npm audit

# Fix automático
npm audit fix

# Fix de breaking changes
npm audit fix --force
```

### Tests Fail
```bash
# Ejecutar en modo watch
npm test -- --watch

# Ver coverage detallado
npm test -- --coverage --reporter=verbose
```

### Dependabot PRs
1. Revisar cambios en el PR
2. Verificar que los tests pasan
3. Mergear si todo está OK
4. Dependabot cerrará PRs obsoletas automáticamente