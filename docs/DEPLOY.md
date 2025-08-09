# Deployment Guide - TUPÁ Hub

## 🚀 Overview

TUPÁ Hub is deployed using Lovable's hosting platform with Supabase as the backend. This guide covers deployment processes, environment configuration, and troubleshooting.

## 📋 Prerequisites

- Supabase project configured
- Lovable account with project access
- GitHub repository (optional, for CI/CD)
- Domain name (optional, for custom domains)

## 🔧 Environment Configuration

### ⚠️ Important: No VITE_ Variables

**This project does NOT use VITE_ environment variables** due to Lovable limitations. Configuration is centralized in `src/lib/config.ts`.

### Supabase Configuration

**Required in Supabase Dashboard > Settings > API:**
```
Project URL: https://your-project-id.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (backend only)
```

**Required Supabase Secrets** (for Edge Functions):
```bash
# Core Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.your-project-id.supabase.co:5432/postgres

# External Services
OPENAI_API_KEY=sk-...  # For AI features
RESEND_API_KEY=re_...  # For email notifications
```

### Client-Specific Configuration

**Stored in `client_configs` table** (configured via Admin UI):
```sql
-- Example client configuration
INSERT INTO client_configs (client_id, pos_type, pos_version, sync_frequency, simulation_mode) 
VALUES ('client-123', 'fudo', 'v1', 15, false);
```

**POS API Configuration** (per client):
- Fudo POS: API URL + API Key
- Bistrosoft: API URL + Authentication credentials
- Odoo: Server URL + Database + Username + Password

## 🏗️ Deployment Process

### 1. Automatic Deployment (Recommended)

**Via Lovable Dashboard:**
1. Push changes to your repository
2. Lovable automatically detects changes
3. Build process starts automatically
4. Preview available at `https://preview--your-project.lovable.app`
5. Production deploy via "Publish" button

**Build Process:**
```bash
# Automatic build steps
npm install           # Install dependencies
npm run build        # Vite production build
# Edge functions deploy automatically
# Static files deployed to CDN
```

### 2. Manual Deployment

**For development testing:**
```bash
# Local build test
npm run build
npm run preview

# Local development
npm run dev
```

### 3. Edge Functions Deployment

**Automatic with main deployment:**
- All functions in `supabase/functions/` deploy automatically
- Configuration from `supabase/config.toml` applied
- Secrets must be configured in Supabase Dashboard

**Manual Edge Function Deploy:**
```bash
# Via Supabase CLI (if needed)
supabase functions deploy --project-ref your-project-id
```

## 🌐 Domain Configuration

### Custom Domain Setup

**In Lovable Dashboard:**
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records:
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: your-project.lovable.app
   ```
4. SSL certificates auto-provisioned

### Environment-Specific URLs

```bash
# Development
LOCAL: http://localhost:8080

# Staging
PREVIEW: https://preview--your-project.lovable.app

# Production
PRODUCTION: https://your-project.lovable.app
CUSTOM_DOMAIN: https://your-domain.com
```

## 🔒 Security Configuration

### Authentication Settings

**Supabase Auth Configuration:**
```bash
# Auth Settings (Dashboard > Authentication > Settings)
Site URL: https://your-production-domain.com
Redirect URLs: 
  - https://preview--your-project.lovable.app
  - https://your-production-domain.com
  - http://localhost:8080 (development only)

# Email Settings
Email Confirmations: Disabled (for faster testing)
Email Invitations: Enabled
```

### Content Security Policy (CSP)

**Production CSP** (`public/_headers`):
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-__CSP_NONCE__' https://your-project-id.supabase.co; style-src 'self' 'nonce-__CSP_NONCE__'; img-src 'self' data: https:; connect-src 'self' https://your-project-id.supabase.co wss://your-project-id.supabase.co; font-src 'self' data:; frame-ancestors 'none';
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

**Development CSP** (more permissive):
```
/*
  Content-Security-Policy: default-src 'self'; connect-src 'self' https: wss:;
```

### Row Level Security (RLS)

**All tables have RLS enabled:**
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## 🚨 Troubleshooting Deployment

### Common Build Issues

**Dependency Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

**TypeScript Errors:**
```bash
# Type check only
npx tsc --noEmit

# Build with type checking
npm run build
```

### Edge Function Issues

**Function not deploying:**
```bash
# Check function syntax
cd supabase/functions/your-function
deno check index.ts

# Check configuration
cat ../../config.toml
```

**Function errors:**
```bash
# View logs in Supabase Dashboard
https://supabase.com/dashboard/project/your-project-id/functions/your-function/logs
```

### Database Migration Issues

**Failed migration:**
```sql
-- Check migration status
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC;

-- Rollback if needed (contact support)
```

### Environment Issues

**Auth redirect errors:**
1. Check Site URL in Supabase Auth settings
2. Verify Redirect URLs include all environments
3. Test with different browsers/incognito mode

**API connection errors:**
1. Verify Supabase URL and keys in `src/lib/config.ts`
2. Check CORS configuration in Supabase
3. Verify RLS policies allow intended access

## 📊 Monitoring & Performance

### Metrics to Monitor

**Supabase Dashboard:**
- API requests per minute
- Database query performance
- Edge function execution time
- Error rates by function

**Application Metrics:**
- Page load times
- User authentication success rate
- POS synchronization success rate
- Integration error rates

### Performance Optimization

**Frontend:**
```bash
# Bundle analysis
npm run build -- --analyze

# Lighthouse performance audit
npx lighthouse https://your-domain.com --view
```

**Backend:**
- Monitor slow queries in Supabase dashboard
- Optimize RLS policies for performance
- Use database indexes appropriately

## 🔄 Rollback Procedures

### Application Rollback

**Via Lovable:**
1. Go to project history
2. Select previous working version
3. Click "Revert to this version"
4. Confirm rollback

### Database Rollback

**Migration rollback** (contact Supabase support):
- Migrations are not automatically reversible
- Database backup restoration may be required
- Always test migrations in staging first

## 🧪 Testing in Production

### Smoke Tests

**Post-deployment checklist:**
- [ ] Login/logout functionality
- [ ] LocationSwitcher works for multi-location users
- [ ] Admin panel accessible to admin users
- [ ] POS sync test (simulation mode)
- [ ] Email notifications working
- [ ] Edge functions responding

### Load Testing

**Basic load test:**
```bash
# Using Apache Bench
ab -n 100 -c 10 https://your-domain.com/

# Monitor Supabase dashboard during test
```

## 📞 Emergency Contacts

**For deployment emergencies:**
- Lovable Support: support@lovable.dev
- Supabase Support: https://supabase.com/dashboard/support
- Team Lead: [Internal contact]
- DevOps Engineer: [Internal contact]

---

**⚠️ Important Notes:**
- Always test deployments in preview environment first
- Keep Supabase backups current
- Monitor error rates after each deployment
- Document any manual configuration changes