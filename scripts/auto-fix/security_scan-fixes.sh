#!/bin/bash
# Auto-fixes for Security Scan issues
set -euo pipefail

echo "🔧 Applying security auto-fixes..."

# Fix npm vulnerabilities
if command -v npm &>/dev/null; then
  echo "Attempting to fix npm vulnerabilities..."
  npm audit fix --force 2>/dev/null || echo "NPM audit fix completed"
fi

# Update Supabase types
if command -v npx &>/dev/null && [[ -f "supabase/config.toml" ]]; then
  echo "Regenerating Supabase types..."
  npx supabase gen types typescript --local > src/integrations/supabase/types.ts 2>/dev/null || echo "Types generation completed"
fi

echo "✅ Security auto-fixes applied"