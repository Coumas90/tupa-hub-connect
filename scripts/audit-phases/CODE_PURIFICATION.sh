#!/bin/bash
# Code Purification Phase - TUPÁ Hub Audit
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_ROOT/audit-logs/CODE_PURIFICATION.log"

# Create audit-logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Redirect all output to log file
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🧹 Starting Code Purification Phase - $(date)"
echo "=========================================="

# Phase 1: Run test coverage with 90% threshold
echo ""
echo "📊 Phase 1: Running test coverage analysis..."
COVERAGE_PASSED=false

if command -v npm &> /dev/null; then
    echo "Running vitest coverage with 90% threshold..."
    
    # Temporarily update vitest config for 90% threshold
    TEMP_CONFIG="vitest.temp.config.ts"
    cp vitest.config.ts "$TEMP_CONFIG"
    
    # Update thresholds to 90%
    sed -i.bak 's/branches: 80/branches: 90/g; s/functions: 80/functions: 90/g; s/lines: 80/lines: 90/g; s/statements: 80/statements: 90/g' "$TEMP_CONFIG"
    
    if npm run test:coverage -- --config "$TEMP_CONFIG" --reporter=verbose; then
        echo "✅ Coverage meets 90% threshold"
        COVERAGE_PASSED=true
    else
        echo "❌ Coverage below 90% threshold"
        COVERAGE_PASSED=false
    fi
    
    # Cleanup temp config
    rm -f "$TEMP_CONFIG" "${TEMP_CONFIG}.bak"
else
    echo "⚠️  npm not found, skipping coverage analysis"
fi

# Phase 2: Scan for TypeScript 'any' types
echo ""
echo "🔍 Phase 2: Scanning for TypeScript 'any' types..."
ANY_COUNT=0

if find src -name "*.ts" -o -name "*.tsx" | xargs grep -n ": any\|<any>\|any\[\]\|any |" > /dev/null 2>&1; then
    echo "Found TypeScript 'any' types:"
    find src -name "*.ts" -o -name "*.tsx" | xargs grep -n ": any\|<any>\|any\[\]\|any |" || true
    ANY_COUNT=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -c ": any\|<any>\|any\[\]\|any |" | awk '{sum+=$1} END {print sum+0}')
    echo "❌ Found $ANY_COUNT 'any' type usages"
else
    echo "✅ No 'any' types found"
fi

# Phase 3: Remove all TODO comments
echo ""
echo "🗑️  Phase 3: Scanning and removing TODO comments..."
TODO_COUNT=0

if find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "// TODO\|//TODO\|/* TODO\|/\*TODO" > /dev/null 2>&1; then
    echo "Found TODO comments:"
    find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "// TODO\|//TODO\|/* TODO\|/\*TODO" || true
    TODO_COUNT=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -c "// TODO\|//TODO\|/* TODO\|/\*TODO" | awk '{sum+=$1} END {print sum+0}')
    
    echo "Removing TODO comments..."
    find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -exec sed -i.bak '/\/\/ TODO/d; /\/\/TODO/d; /\/\* TODO/d; /\/\*TODO/d' {} \;
    
    # Cleanup backup files
    find src -name "*.bak" -delete
    
    echo "✅ Removed $TODO_COUNT TODO comments"
else
    echo "✅ No TODO comments found"
fi

# Phase 4: Generate purification summary
echo ""
echo "📋 Code Purification Summary:"
echo "============================="
echo "Coverage threshold (90%): $([ "$COVERAGE_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "TypeScript 'any' types: $ANY_COUNT found"
echo "TODO comments: $TODO_COUNT removed"

# Determine overall phase result
PHASE_SUCCESS=true

if [ "$COVERAGE_PASSED" = false ] || [ "$ANY_COUNT" -gt 0 ]; then
    echo ""
    echo "❌ Code Purification Phase: FAILED"
    echo "Reasons:"
    [ "$COVERAGE_PASSED" = false ] && echo "  - Coverage below 90% threshold"
    [ "$ANY_COUNT" -gt 0 ] && echo "  - TypeScript 'any' types found"
    PHASE_SUCCESS=false
else
    echo ""
    echo "✅ Code Purification Phase: PASSED"
fi

echo ""
echo "🧹 Code Purification Phase completed - $(date)"
echo "Log file: $LOG_FILE"

# Exit with appropriate code
if [ "$PHASE_SUCCESS" = true ]; then
    exit 0
else
    exit 1
fi