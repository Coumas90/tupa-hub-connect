#!/bin/bash
# Dependency Fortress Phase - TUPÁ Hub Audit
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_ROOT/audit-logs/DEPENDENCY_FORTRESS.log"

# Create audit-logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Redirect all output to log file
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🏰 Starting Dependency Fortress Phase - $(date)"
echo "=============================================="

# Phase 1: Run npm audit for critical vulnerabilities
echo ""
echo "🔍 Phase 1: Running npm audit for critical vulnerabilities..."
AUDIT_PASSED=false
CRITICAL_VULNS=0

if command -v npm &> /dev/null; then
    echo "Scanning for critical security vulnerabilities..."
    
    # Run npm audit and capture output
    if npm audit --audit-level=critical --json > npm-audit-output.json 2>/dev/null; then
        echo "✅ No critical vulnerabilities found"
        AUDIT_PASSED=true
    else
        echo "❌ Critical vulnerabilities detected"
        
        # Parse vulnerabilities if jq is available
        if command -v jq &> /dev/null && [[ -f npm-audit-output.json ]]; then
            CRITICAL_VULNS=$(jq -r '.metadata.vulnerabilities.critical // 0' npm-audit-output.json 2>/dev/null || echo "0")
            HIGH_VULNS=$(jq -r '.metadata.vulnerabilities.high // 0' npm-audit-output.json 2>/dev/null || echo "0")
            
            echo "Critical vulnerabilities: $CRITICAL_VULNS"
            echo "High vulnerabilities: $HIGH_VULNS"
            
            # Show vulnerable packages
            echo ""
            echo "Vulnerable packages:"
            jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | "- \(.key): \(.value.severity) - \(.value.title)"' npm-audit-output.json 2>/dev/null || echo "Unable to parse vulnerability details"
        else
            echo "⚠️  jq not available, cannot parse vulnerability details"
            # Fallback: run npm audit in human-readable format
            npm audit --audit-level=high 2>/dev/null || echo "Audit completed with vulnerabilities"
        fi
        
        AUDIT_PASSED=false
    fi
    
    # Cleanup temp file
    rm -f npm-audit-output.json
else
    echo "⚠️  npm not found, skipping vulnerability scan"
fi

# Phase 2: Verify Supabase migrations status
echo ""
echo "🗄️  Phase 2: Verifying Supabase migrations status..."
MIGRATIONS_OK=true

if [[ -d "supabase/migrations" ]]; then
    MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" | wc -l)
    echo "Found $MIGRATION_COUNT migration files"
    
    # Check for pending migrations (basic check)
    if command -v supabase &> /dev/null; then
        echo "Checking migration status with Supabase CLI..."
        if supabase status 2>/dev/null | grep -q "Database"; then
            echo "✅ Supabase connection verified"
        else
            echo "⚠️  Unable to verify Supabase connection status"
            MIGRATIONS_OK=false
        fi
    else
        echo "⚠️  Supabase CLI not found, skipping migration verification"
        MIGRATIONS_OK=false
    fi
    
    # Check for migration file format
    INVALID_MIGRATIONS=0
    for migration in supabase/migrations/*.sql; do
        if [[ -f "$migration" ]]; then
            filename=$(basename "$migration")
            if [[ ! "$filename" =~ ^[0-9]{14}_.+\.sql$ ]]; then
                echo "❌ Invalid migration filename format: $filename"
                INVALID_MIGRATIONS=$((INVALID_MIGRATIONS + 1))
                MIGRATIONS_OK=false
            fi
        fi
    done
    
    if [[ $INVALID_MIGRATIONS -eq 0 ]]; then
        echo "✅ All migration files follow correct naming convention"
    else
        echo "❌ Found $INVALID_MIGRATIONS invalid migration files"
    fi
else
    echo "⚠️  No Supabase migrations directory found"
    MIGRATIONS_OK=false
fi

# Phase 3: Check browser support matrix
echo ""
echo "🌐 Phase 3: Checking browser support matrix..."
BROWSER_SUPPORT_OK=true

# Check for browserslist configuration
if [[ -f "package.json" ]]; then
    echo "Checking browserslist configuration..."
    
    if command -v npx &> /dev/null; then
        # Check current browser support
        if npx browserslist 2>/dev/null | head -10; then
            echo "✅ Browser support matrix configured"
            
            # Count supported browsers
            BROWSER_COUNT=$(npx browserslist 2>/dev/null | wc -l)
            echo "Supporting $BROWSER_COUNT browser versions"
            
            # Check for outdated browser support
            OUTDATED_COUNT=$(npx browserslist 2>/dev/null | grep -E "(ie|IE)" | wc -l)
            if [[ $OUTDATED_COUNT -gt 0 ]]; then
                echo "⚠️  Supporting $OUTDATED_COUNT outdated IE versions"
                BROWSER_SUPPORT_OK=false
            fi
        else
            echo "❌ Unable to determine browser support matrix"
            BROWSER_SUPPORT_OK=false
        fi
    else
        echo "⚠️  npx not available, cannot verify browser support"
        BROWSER_SUPPORT_OK=false
    fi
    
    # Check for modern build targets
    if grep -q "\"target\":" package.json; then
        echo "✅ Build target specified in package.json"
    else
        echo "⚠️  No build target specified"
    fi
else
    echo "❌ package.json not found"
    BROWSER_SUPPORT_OK=false
fi

# Phase 4: Check TypeScript configuration
echo ""
echo "📝 Phase 4: Verifying TypeScript configuration..."
TS_CONFIG_OK=true

if [[ -f "tsconfig.json" ]]; then
    echo "✅ TypeScript configuration found"
    
    # Check for strict mode
    if grep -q "\"strict\": true" tsconfig.json; then
        echo "✅ TypeScript strict mode enabled"
    else
        echo "⚠️  TypeScript strict mode not enabled"
        TS_CONFIG_OK=false
    fi
    
    # Check for modern target
    if grep -q "\"target\": \"ES2020\"\|\"target\": \"ES2021\"\|\"target\": \"ES2022\"" tsconfig.json; then
        echo "✅ Modern TypeScript target configured"
    else
        echo "⚠️  Consider upgrading TypeScript target to ES2020+"
    fi
else
    echo "❌ TypeScript configuration not found"
    TS_CONFIG_OK=false
fi

# Phase 5: Dependency analysis
echo ""
echo "📦 Phase 5: Analyzing dependency health..."
DEPS_HEALTHY=true

if [[ -f "package.json" ]] && command -v npm &> /dev/null; then
    # Check for outdated packages
    echo "Checking for outdated packages..."
    if npm outdated --json > outdated-packages.json 2>/dev/null; then
        if [[ -s outdated-packages.json ]] && [[ "$(cat outdated-packages.json)" != "{}" ]]; then
            echo "⚠️  Outdated packages detected:"
            
            if command -v jq &> /dev/null; then
                jq -r 'to_entries[] | "- \(.key): \(.value.current) → \(.value.latest)"' outdated-packages.json 2>/dev/null || cat outdated-packages.json
            else
                cat outdated-packages.json
            fi
            DEPS_HEALTHY=false
        else
            echo "✅ All packages are up to date"
        fi
    else
        echo "⚠️  Unable to check for outdated packages"
        DEPS_HEALTHY=false
    fi
    
    # Cleanup temp file
    rm -f outdated-packages.json
    
    # Check dependency count
    TOTAL_DEPS=$(npm list --depth=0 --json 2>/dev/null | jq -r '.dependencies | length' 2>/dev/null || echo "unknown")
    echo "Total dependencies: $TOTAL_DEPS"
    
    # Check for security-related packages
    SECURITY_DEPS=0
    for pkg in "helmet" "@supabase/supabase-js" "bcrypt" "jsonwebtoken" "express-rate-limit"; do
        if npm list "$pkg" &>/dev/null; then
            SECURITY_DEPS=$((SECURITY_DEPS + 1))
        fi
    done
    echo "Security-focused packages installed: $SECURITY_DEPS"
fi

# Phase 6: Generate dependency fortress summary
echo ""
echo "📋 Dependency Fortress Summary:"
echo "==============================="
echo "Critical vulnerabilities: $([ "$AUDIT_PASSED" = true ] && echo "✅ NONE" || echo "❌ $CRITICAL_VULNS found")"
echo "Supabase migrations: $([ "$MIGRATIONS_OK" = true ] && echo "✅ OK" || echo "❌ ISSUES FOUND")"
echo "Browser support matrix: $([ "$BROWSER_SUPPORT_OK" = true ] && echo "✅ CONFIGURED" || echo "❌ NEEDS ATTENTION")"
echo "TypeScript configuration: $([ "$TS_CONFIG_OK" = true ] && echo "✅ OPTIMAL" || echo "⚠️  IMPROVABLE")"
echo "Dependency health: $([ "$DEPS_HEALTHY" = true ] && echo "✅ HEALTHY" || echo "⚠️  OUTDATED PACKAGES")"

# Determine overall phase result
PHASE_SUCCESS=true

if [ "$AUDIT_PASSED" = false ] || [ "$MIGRATIONS_OK" = false ] || [ "$BROWSER_SUPPORT_OK" = false ]; then
    echo ""
    echo "❌ Dependency Fortress Phase: FAILED"
    echo "Critical issues found:"
    [ "$AUDIT_PASSED" = false ] && echo "  - Critical security vulnerabilities detected"
    [ "$MIGRATIONS_OK" = false ] && echo "  - Supabase migration issues"
    [ "$BROWSER_SUPPORT_OK" = false ] && echo "  - Browser support configuration problems"
    PHASE_SUCCESS=false
else
    echo ""
    echo "✅ Dependency Fortress Phase: PASSED"
    
    # Show warnings for non-critical issues
    if [ "$TS_CONFIG_OK" = false ] || [ "$DEPS_HEALTHY" = false ]; then
        echo ""
        echo "⚠️  Non-critical recommendations:"
        [ "$TS_CONFIG_OK" = false ] && echo "  - Optimize TypeScript configuration"
        [ "$DEPS_HEALTHY" = false ] && echo "  - Update outdated packages"
    fi
fi

echo ""
echo "🏰 Dependency Fortress Phase completed - $(date)"
echo "Log file: $LOG_FILE"

# Exit with appropriate code
if [ "$PHASE_SUCCESS" = true ]; then
    exit 0
else
    exit 1
fi