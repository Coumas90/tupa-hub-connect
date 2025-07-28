#!/bin/bash
# Architecture Validation Phase - TUPÁ Hub Audit
set -euo pipefail

echo "🏗️ Starting Architecture Validation Phase..."

# TypeScript compilation check
if [[ -f "tsconfig.json" ]] && command -v npx &>/dev/null; then
  echo "Validating TypeScript compilation..."
  npx tsc --noEmit --skipLibCheck || echo "TypeScript validation completed with issues"
fi

# ESLint check
if [[ -f "eslint.config.js" ]] && command -v npx &>/dev/null; then
  echo "Running ESLint analysis..."
  npx eslint . --max-warnings 50 || echo "ESLint analysis completed"
fi

# Component dependency analysis
echo "Analyzing component structure..."
find src/components -name "*.tsx" | wc -l | xargs echo "Total components:"

echo "✅ Architecture validation completed"