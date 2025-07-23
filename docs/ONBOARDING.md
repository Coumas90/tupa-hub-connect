# Onboarding Guide - TUPÁ Hub

## 👋 Welcome to TUPÁ Hub

This guide will help new developers get up to speed with the TUPÁ Hub platform. Follow these steps to set up your development environment and understand the codebase.

## 🚀 Quick Start

## ⚙️ Gestión de Configuración

### Variables Públicas
Editar en `src/lib/config.ts`:
```typescript
export const config = {
  supabase: {
    url: "https://your-project.supabase.co",
    anonKey: "eyJ0eXAi...public_key"
  },
  app: {
    theme: 'dark',
    maxUsers: 100,
    featureFlags: {
      academia: true,
      pos_sync: true
    }
  }
} as const;
```

### Secrets Privados
Ir a **Supabase Dashboard > Settings > Functions > Secrets**

Agregar clave-valor:
- **Nombre**: `OPENAI_API_KEY`
- **Valor**: `sk-...` (copiar del proveedor)

**Acceder en Edge Functions:**
```typescript
// supabase/functions/example/index.ts
const openAIKey = Deno.env.get('OPENAI_API_KEY');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
```

**Configurar nuevos secrets:**
1. Usar el botón de configuración en el chat de Lovable
2. Alternativamente: Supabase Dashboard > Functions > Secrets
3. Verificar en Edge Function logs si se cargan correctamente

### 1. Environment Setup

**Prerequisites:**
```bash
Node.js >= 18.0.0
npm >= 8.0.0
Git
VS Code (recommended)
```

**Clone and Install:**
```bash
git clone <repository-url>
cd tupa-hub
npm install
npm run dev
```

**Access the app:**
- Local: http://localhost:8080
- Preview: https://preview--your-project.lovable.app

### 2. Essential Tools

**VS Code Extensions:**
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

**Browser Extensions:**
- React Developer Tools
- Supabase DevTools

## 🏗️ Architecture Overview

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Shadcn/ui** - Component library
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management

### Backend Stack
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data security
- **Edge Functions** - Serverless functions
- **Real-time subscriptions** - Live data updates

### Key Concepts

**Location Context:**
- Multi-tenant architecture
- Users belong to groups
- Groups have multiple locations
- Data is filtered by active location

**Audit Fields:**
- All tables have `created_by` and `updated_by`
- Automatically populated via triggers
- Tracks data changes for compliance

**POS Integrations:**
- SDK-based architecture
- Adapter pattern for different POS systems
- Configurable sync intervals per client

## 📁 Codebase Structure

```
src/
├── components/          # Reusable React components
│   ├── ui/             # Base components (shadcn/ui)
│   ├── admin/          # Admin-specific components
│   └── forms/          # Form components
├── contexts/           # React contexts
│   └── LocationContext.tsx  # Multi-location state
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configuration
│   ├── api/           # API clients and configuration
│   ├── integrations/  # POS integration logic
│   └── utils.ts       # Helper functions
├── pages/              # Page components (routes)
├── integrations/       # Supabase integration
│   └── supabase/      # Auto-generated types
└── __tests__/          # Test files

supabase/
├── functions/          # Edge Functions
├── migrations/         # Database migrations
└── config.toml        # Supabase configuration

sdk/                    # Reusable SDK for integrations
├── adapters/          # POS system adapters
├── schemas/           # Zod validation schemas
└── types.ts          # TypeScript types
```

## 🔧 Development Workflow

### 1. Feature Development

**Branch naming:**
```bash
git checkout -b feature/location-switcher-ui
git checkout -b fix/auth-redirect-issue
git checkout -b docs/api-documentation
```

**Development process:**
1. Create feature branch
2. Write tests first (TDD approach)
3. Implement feature
4. Test locally
5. Create pull request
6. Code review
7. Merge to main

### 2. Testing Strategy

**Run tests:**
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# UI tests with interface
npm run test:ui

# Coverage report
npm test -- --coverage
```

**Test structure:**
```typescript
// Example test
import { render, screen } from '@testing-library/react';
import { LocationSwitcher } from '@/components/LocationSwitcher';

describe('LocationSwitcher', () => {
  it('should render location options', () => {
    render(<LocationSwitcher />);
    expect(screen.getByText('Main Store')).toBeInTheDocument();
  });
});
```

### 3. Database Development

**Making schema changes:**
```bash
# Create migration (via Lovable interface)
# Test in preview environment
# Deploy to production
```

**Testing migrations:**
```sql
-- Always test with sample data
-- Verify RLS policies work correctly
-- Check audit triggers function
-- Test rollback procedures
```

## 🐛 Debugging Guide

### Frontend Debugging

**Browser DevTools:**
```javascript
// React DevTools
// Check component state and props

// Network tab
// Verify API calls and responses

// Console
// Check for JavaScript errors and warnings

// Application tab
// Inspect localStorage, sessionStorage
// Check Supabase auth state
```

**Common Issues:**

**Location Context Not Loading:**
```typescript
// Check LocationContext provider wraps app
// Verify user has group assigned
// Check console for auth errors
// Validate RLS policies
```

**Component Not Rendering:**
```typescript
// Check conditional rendering logic
// Verify data dependencies
// Check for TypeScript errors
// Validate prop passing
```

**Styling Issues:**
```bash
# Check Tailwind class conflicts
# Verify CSS specificity
# Check responsive design breakpoints
# Validate design system tokens
```

### Backend Debugging

**Edge Functions:**
```bash
# View logs in Supabase Dashboard
https://supabase.com/dashboard/project/PROJECT_ID/functions/FUNCTION_NAME/logs

# Local testing
deno run --allow-net supabase/functions/function-name/index.ts
```

**Database Issues:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Monitor slow queries
SELECT query, mean_exec_time FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

-- Verify audit triggers
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'your_table'::regclass;
```

**Common Database Issues:**

**RLS Policy Blocking Access:**
```sql
-- Temporarily disable RLS for debugging (dev only)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Check user's role and group assignment
SELECT u.id, u.group_id, ur.role 
FROM users u 
LEFT JOIN user_roles ur ON ur.user_id = u.id 
WHERE u.id = auth.uid();
```

**Slow Queries:**
```sql
-- Add missing indexes
CREATE INDEX idx_table_column ON table(column);

-- Check query execution plan
EXPLAIN ANALYZE SELECT * FROM table WHERE condition;
```

### Authentication Debugging

**Auth State Issues:**
```typescript
// Check Supabase client configuration
import { supabase } from '@/integrations/supabase/client';

// Verify session state
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Check auth redirect URLs
// Verify Site URL in Supabase dashboard
```

**Common Auth Problems:**

**Redirect Loop:**
```typescript
// Check Site URL configuration
// Verify redirect URLs include all environments
// Clear browser storage and cookies
```

**Token Expired:**
```typescript
// Check token refresh settings
// Verify refresh token rotation
// Monitor session duration limits
```

## 🧪 Testing & Quality Assurance

### Code Quality Standards

**ESLint Configuration:**
```json
{
  "extends": ["@typescript-eslint/recommended"],
  "rules": {
    "no-unused-vars": "error",
    "prefer-const": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**Type Safety:**
```typescript
// Always use proper TypeScript types
interface User {
  id: string;
  email: string;
  group_id: string;
  location_id?: string;
}

// Avoid 'any' type
const userData: User = await fetchUser();
```

### Testing Best Practices

**Unit Tests:**
```typescript
// Test individual functions
// Mock external dependencies
// Cover edge cases
// Maintain good test coverage (>80%)
```

**Integration Tests:**
```typescript
// Test component interactions
// Test API endpoint workflows
// Test database operations
// Test authentication flows
```

**E2E Tests (Cypress):**
```typescript
// Test critical user journeys
// Test multi-location workflows
// Test admin functionality
// Test POS sync processes
```

## 🔒 Security Guidelines

### Authentication & Authorization

**RLS Policy Development:**
```sql
-- Always use security definer functions for complex logic
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Apply to policies
CREATE POLICY "Admins can access all data" 
ON table_name FOR ALL 
USING (is_admin());
```

**API Security:**
```typescript
// Always validate input data
import { z } from 'zod';

const schema = z.object({
  client_id: z.string().min(1),
  pos_type: z.enum(['fudo', 'bistrosoft'])
});

// Validate before processing
const validatedData = schema.parse(requestBody);
```

### Data Protection

**Sensitive Data Handling:**
```typescript
// Never log sensitive information
console.log({ user_id }); // ✅ OK
console.log({ password }); // ❌ Never

// Use environment variables for secrets
const apiKey = Deno.env.get('POS_API_KEY');
```

**Input Sanitization:**
```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
const cleanHtml = DOMPurify.sanitize(userInput);

// Validate SQL queries (use query builder)
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', sanitizedId); // ✅ Safe
```

## 📚 Learning Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)

### Internal Resources
- `README.md` - Project overview
- `docs/ARCHITECTURE.drawio` - System architecture
- `docs/DEPLOY.md` - Deployment guide
- `docs/SECURITY.md` - Security procedures

### Team Resources
- Team Slack: #tupahub-dev
- Code Reviews: GitHub Pull Requests
- Daily Standups: 9:00 AM
- Sprint Planning: Bi-weekly

## 🆘 Getting Help

### Debugging Steps
1. **Read the error message carefully**
2. **Check the console for additional details**
3. **Search the codebase for similar patterns**
4. **Check documentation and comments**
5. **Ask a teammate for help**

### Team Support
- **Code Questions**: Ask in #tupahub-dev Slack
- **Architecture Decisions**: Discuss with tech lead
- **Urgent Issues**: Contact on-call engineer
- **DevOps Issues**: Contact infrastructure team

### External Support
- **Supabase Issues**: Supabase Discord/Support
- **React/TypeScript**: Stack Overflow
- **General Web Dev**: MDN Web Docs

---

## ✅ Onboarding Checklist

**Day 1:**
- [ ] Development environment set up
- [ ] Can run the application locally
- [ ] Has access to Supabase dashboard
- [ ] Understands basic architecture

**Week 1:**
- [ ] Completed first feature/bug fix
- [ ] Understands location context system
- [ ] Can run and write tests
- [ ] Familiar with deployment process

**Month 1:**
- [ ] Comfortable with full stack development
- [ ] Understands POS integration patterns
- [ ] Can debug complex issues independently
- [ ] Contributing to architecture decisions

**Welcome to the team! 🎉**