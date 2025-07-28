#!/bin/bash
# Security Scan Phase - TUPÁ Hub Audit
set -euo pipefail

echo "🔍 Starting Security Scan Phase..."

# Run Supabase security linter
echo "Running Supabase security checks..."
npx supabase db lint 2>&1 || echo "Supabase linter completed with warnings"

# Check for hardcoded secrets
echo "Scanning for hardcoded secrets..."
if command -v grep &>/dev/null; then
  grep -r --exclude-dir=node_modules --exclude-dir=.git -i "password\|secret\|api.key\|token" . || echo "No obvious secrets found"
fi

# Dependency vulnerability scan
echo "Checking for vulnerable dependencies..."
if command -v npm &>/dev/null; then
  npm audit --audit-level=moderate 2>&1 || echo "Dependency audit completed"
fi

echo "✅ Security scan phase completed"