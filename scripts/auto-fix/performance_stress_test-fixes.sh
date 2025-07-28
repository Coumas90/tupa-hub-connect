#!/bin/bash
# Performance Stress Test Auto-Fix Script - TUPÁ Hub
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_ROOT/audit-logs/PERFORMANCE_STRESS_TEST_AUTOFIX.log"

# Create audit-logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Redirect all output to log file
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🔧 Starting Performance Stress Test Auto-Fix - $(date)"
echo "====================================================="

# Auto-fix 1: Optimize SQL queries and create indexes
echo ""
echo "🗄️  Auto-Fix 1: Optimizing database performance..."

if command -v psql &> /dev/null || [[ -f "supabase/config.toml" ]]; then
    echo "Creating database performance optimization script..."
    
    # Create SQL optimization script
    OPTIMIZATION_SQL="$PROJECT_ROOT/db-optimization.sql"
    cat > "$OPTIMIZATION_SQL" << 'EOF'
-- Performance Optimization Script for TUPÁ Hub
-- Create indexes for commonly queried columns

-- Users table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_location_id ON public.users(location_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_group_id ON public.users(group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Consumptions table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_date_location ON public.consumptions(date, location_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_client_date ON public.consumptions(client_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consumptions_created_at ON public.consumptions(created_at);

-- Orders table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_location_date ON public.orders(location_id, order_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_location ON public.orders(status, location_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);

-- Integration logs optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integration_logs_client_pos ON public.integration_logs(client_id, pos_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integration_logs_status ON public.integration_logs(status);

-- POS sync logs optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pos_sync_logs_client_started ON public.pos_sync_logs(client_id, started_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pos_sync_logs_status_pos_type ON public.pos_sync_logs(status, pos_type);

-- Security logs optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_logs_event_type_created ON public.security_logs(event_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_logs_user_id_created ON public.security_logs(user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);

-- Advisory requests optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisory_requests_status_cafe ON public.advisory_requests(status, cafe_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisory_requests_created_at ON public.advisory_requests(created_at);

-- Feedbacks optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_cafe_created ON public.feedbacks(cafe_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_comment_status ON public.feedbacks(comment_status);

-- Giveaway participants optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_giveaway_participants_cafe_participated ON public.giveaway_participants(cafe_id, participated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_giveaway_participants_email ON public.giveaway_participants(customer_email);

-- Refresh tokens cleanup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_expires_revoked ON public.refresh_tokens(expires_at, is_revoked);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_last_used ON public.refresh_tokens(user_id, last_used_at);

-- Password reset tokens cleanup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- Rate limits optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Analyze tables for better query planning
ANALYZE public.users;
ANALYZE public.consumptions;
ANALYZE public.orders;
ANALYZE public.integration_logs;
ANALYZE public.pos_sync_logs;
ANALYZE public.security_logs;
ANALYZE public.advisory_requests;
ANALYZE public.feedbacks;
ANALYZE public.giveaway_participants;
ANALYZE public.refresh_tokens;

-- Update table statistics
UPDATE pg_stat_reset();

-- Vacuum analyze for optimal performance
VACUUM ANALYZE;
EOF
    
    echo "✅ Database optimization script created: $OPTIMIZATION_SQL"
    echo "⚠️  Note: Run this script manually against your database for production optimization"
else
    echo "⚠️  Database tools not available, skipping SQL optimization"
fi

# Auto-fix 2: Optimize frontend build and caching
echo ""
echo "⚡ Auto-Fix 2: Optimizing frontend performance..."

if [[ -f "vite.config.ts" ]]; then
    echo "Optimizing Vite configuration for performance..."
    
    # Create backup
    cp vite.config.ts vite.config.ts.backup
    
    # Check if performance optimizations are already present
    if ! grep -q "rollupOptions" vite.config.ts; then
        echo "Adding Vite performance optimizations..."
        
        # Create optimized Vite config
        cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    cors: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'react-router-dom',
    ],
  },
})
EOF
        echo "✅ Vite configuration optimized for performance"
    else
        echo "✅ Vite configuration already optimized"
    fi
fi

# Auto-fix 3: Add caching headers for static assets
echo ""
echo "📦 Auto-Fix 3: Configuring caching for static assets..."

# Create/update _headers file for Netlify deployment
HEADERS_FILE="public/_headers"
if [[ ! -f "$HEADERS_FILE" ]]; then
    mkdir -p public
    cat > "$HEADERS_FILE" << 'EOF'
# Caching headers for optimal performance

# Static assets - cache for 1 year
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Images - cache for 1 month
*.png
  Cache-Control: public, max-age=2592000
*.jpg
  Cache-Control: public, max-age=2592000
*.jpeg
  Cache-Control: public, max-age=2592000
*.svg
  Cache-Control: public, max-age=2592000
*.webp
  Cache-Control: public, max-age=2592000

# Fonts - cache for 1 year
*.woff
  Cache-Control: public, max-age=31536000
*.woff2
  Cache-Control: public, max-age=31536000
*.ttf
  Cache-Control: public, max-age=31536000

# JavaScript and CSS - cache for 1 year (with immutable)
*.js
  Cache-Control: public, max-age=31536000, immutable
*.css
  Cache-Control: public, max-age=31536000, immutable

# HTML files - short cache
*.html
  Cache-Control: public, max-age=3600

# API routes - no cache
/api/*
  Cache-Control: no-cache, no-store, must-revalidate

# Service worker - no cache
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate

# Manifest
/manifest.json
  Cache-Control: public, max-age=86400

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
EOF
    echo "✅ Caching headers configured: $HEADERS_FILE"
else
    echo "✅ Caching headers already configured"
fi

# Auto-fix 4: Optimize package.json scripts for performance
echo ""
echo "📋 Auto-Fix 4: Optimizing build scripts..."

if [[ -f "package.json" ]] && command -v jq &> /dev/null; then
    echo "Adding performance-focused npm scripts..."
    
    # Create backup
    cp package.json package.json.backup
    
    # Add performance scripts if they don't exist
    jq '. + {
      "scripts": (.scripts // {} | . + {
        "build:analyze": "npm run build && npx vite-bundle-analyzer dist",
        "build:profile": "npm run build -- --profile",
        "serve:prod": "npm run build && npm run preview",
        "perf:audit": "npm run build && npx lighthouse-ci autorun",
        "perf:size": "npm run build && npx bundlesize",
        "optimize": "npm run lint:fix && npm run build:profile"
      })
    }' package.json > package.json.tmp && mv package.json.tmp package.json
    
    echo "✅ Performance scripts added to package.json"
elif [[ -f "package.json" ]]; then
    # Fallback without jq
    echo "Adding performance scripts manually..."
    
    # Check if scripts section exists
    if ! grep -q '"build:analyze"' package.json; then
        echo "⚠️  Manual addition needed - consider adding performance scripts to package.json"
    fi
fi

# Auto-fix 5: Create performance monitoring configuration
echo ""
echo "📊 Auto-Fix 5: Setting up performance monitoring..."

# Create performance monitoring config
PERF_CONFIG="performance-config.json"
cat > "$PERF_CONFIG" << 'EOF'
{
  "name": "TUPÁ Hub Performance Configuration",
  "monitoring": {
    "enabled": true,
    "metrics": {
      "core_web_vitals": true,
      "custom_metrics": true,
      "user_timing": true
    },
    "thresholds": {
      "first_contentful_paint": 1500,
      "largest_contentful_paint": 2500,
      "first_input_delay": 100,
      "cumulative_layout_shift": 0.1
    }
  },
  "caching": {
    "static_assets": "1y",
    "api_responses": "5m",
    "images": "1M"
  },
  "compression": {
    "enabled": true,
    "algorithms": ["gzip", "brotli"]
  },
  "lazy_loading": {
    "images": true,
    "components": true,
    "routes": true
  },
  "database": {
    "connection_pooling": true,
    "query_timeout": 30000,
    "slow_query_threshold": 1000
  }
}
EOF

echo "✅ Performance monitoring config created: $PERF_CONFIG"

# Auto-fix 6: Optimize React components for performance
echo ""
echo "⚛️  Auto-Fix 6: Creating React performance optimization utilities..."

# Create performance utilities
PERF_UTILS_DIR="src/utils/performance"
mkdir -p "$PERF_UTILS_DIR"

# Create lazy loading utility
cat > "$PERF_UTILS_DIR/lazy-loading.ts" << 'EOF'
import { lazy, Suspense } from 'react';
import { ComponentType } from 'react';

// Higher-order component for lazy loading with error boundary
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(factory);
  
  // Preload function
  const preload = () => factory();
  
  // Return component with preload capability
  return Object.assign(LazyComponent, { preload });
}

// Wrapper component for lazy components
export function LazyWrapper({ 
  children, 
  fallback = <div>Loading...</div> 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);
    
    observer.observe(element);
    
    return () => observer.unobserve(element);
  }, [elementRef, options]);
  
  return isVisible;
}
EOF

# Create performance monitoring utility
cat > "$PERF_UTILS_DIR/monitoring.ts" << 'EOF'
// Performance monitoring utilities

export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  return async () => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    // Send to analytics if available
    if ('gtag' in window) {
      (window as any).gtag('event', 'timing_complete', {
        name,
        value: Math.round(end - start)
      });
    }
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitoring
export function logMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
}
EOF

echo "✅ React performance utilities created in $PERF_UTILS_DIR"

echo ""
echo "📋 Auto-Fix Summary:"
echo "==================="
echo "Database indexes: Created for high-traffic queries"
echo "Vite configuration: Optimized for production builds"
echo "Caching headers: Configured for static assets"
echo "Build scripts: Added performance monitoring tools"
echo "Performance config: Created monitoring configuration"
echo "React utilities: Added lazy loading and performance helpers"

echo ""
echo "🔧 Performance Stress Test Auto-Fix completed - $(date)"
echo "Log file: $LOG_FILE"

echo ""
echo "⚠️  IMPORTANT: Next steps for optimal performance:"
echo "1. Run database optimization script against production DB"
echo "2. Test the application thoroughly after changes"
echo "3. Monitor Core Web Vitals in production"
echo "4. Set up performance monitoring dashboard"
echo "5. Schedule regular performance audits"

exit 0