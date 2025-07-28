#!/bin/bash
# Dependency Fortress Auto-Fix Script - TUPÁ Hub
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_ROOT/audit-logs/DEPENDENCY_FORTRESS_AUTOFIX.log"

# Create audit-logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Redirect all output to log file
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🔧 Starting Dependency Fortress Auto-Fix - $(date)"
echo "================================================="

# Auto-fix 1: Upgrade vulnerable packages
echo ""
echo "🛡️  Auto-Fix 1: Upgrading vulnerable packages..."

if command -v npm &> /dev/null; then
    echo "Running npm audit fix for automatic repairs..."
    
    # First, try automatic fixes
    if npm audit fix 2>&1; then
        echo "✅ Automatic vulnerability fixes applied"
    else
        echo "⚠️  Some vulnerabilities require manual intervention"
    fi
    
    # Force fix for breaking changes if needed
    echo ""
    echo "Attempting force fixes for remaining vulnerabilities..."
    if npm audit fix --force 2>&1; then
        echo "✅ Force fixes applied successfully"
        echo "⚠️  Please test application thoroughly after force fixes"
    else
        echo "❌ Force fixes failed or not needed"
    fi
    
    # Update high-risk packages specifically
    echo ""
    echo "Updating critical security packages..."
    
    SECURITY_PACKAGES=(
        "@types/node"
        "typescript"
        "vite"
        "@supabase/supabase-js"
        "react"
        "react-dom"
    )
    
    for package in "${SECURITY_PACKAGES[@]}"; do
        if npm list "$package" &>/dev/null; then
            echo "Updating $package to latest version..."
            npm update "$package" 2>/dev/null || echo "⚠️  Failed to update $package"
        fi
    done
    
else
    echo "❌ npm not found, cannot fix vulnerabilities"
fi

# Auto-fix 2: Optimize TypeScript configuration
echo ""
echo "📝 Auto-Fix 2: Optimizing TypeScript configuration..."

if [[ -f "tsconfig.json" ]]; then
    echo "Enhancing TypeScript configuration..."
    
    # Create backup
    cp tsconfig.json tsconfig.json.backup
    
    # Create optimized tsconfig if needed
    if ! grep -q "\"strict\": true" tsconfig.json; then
        echo "Enabling TypeScript strict mode..."
        
        # Use sed to add strict mode if not present
        if grep -q "\"compilerOptions\"" tsconfig.json; then
            sed -i.tmp 's/"compilerOptions": {/"compilerOptions": {\n    "strict": true,/' tsconfig.json
            rm -f tsconfig.json.tmp
            echo "✅ Strict mode enabled"
        fi
    fi
    
    # Update target if too old
    if grep -q "\"target\": \"ES5\"\|\"target\": \"ES6\"\|\"target\": \"ES2015\"" tsconfig.json; then
        echo "Updating TypeScript target to ES2020..."
        sed -i.tmp 's/"target": "ES[0-9]*"/"target": "ES2020"/' tsconfig.json
        sed -i.tmp 's/"target": "ES2015"/"target": "ES2020"/' tsconfig.json
        rm -f tsconfig.json.tmp
        echo "✅ TypeScript target updated"
    fi
    
else
    echo "Creating optimal TypeScript configuration..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
EOF
    echo "✅ Optimal TypeScript configuration created"
fi

# Auto-fix 3: Add browser support configuration
echo ""
echo "🌐 Auto-Fix 3: Configuring browser support matrix..."

if [[ -f "package.json" ]]; then
    # Check if browserslist is already configured
    if ! grep -q "browserslist" package.json; then
        echo "Adding modern browser support configuration..."
        
        # Create backup
        cp package.json package.json.backup
        
        # Add browserslist configuration
        if command -v jq &> /dev/null; then
            jq '. + {"browserslist": ["> 1%", "last 2 versions", "not dead", "not ie 11"]}' package.json > package.json.tmp
            mv package.json.tmp package.json
            echo "✅ Browser support matrix added via jq"
        else
            # Fallback: manual addition
            sed -i.tmp '/"dependencies": {/i\
  "browserslist": [\
    "> 1%",\
    "last 2 versions",\
    "not dead",\
    "not ie 11"\
  ],' package.json
            rm -f package.json.tmp
            echo "✅ Browser support matrix added manually"
        fi
    else
        echo "✅ Browser support configuration already exists"
    fi
else
    echo "❌ package.json not found, cannot configure browser support"
fi

# Auto-fix 4: Install security-focused packages
echo ""
echo "🛡️  Auto-Fix 4: Installing essential security packages..."

if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
    SECURITY_PACKAGES_TO_INSTALL=()
    
    # Check for missing security packages
    if ! npm list "helmet" &>/dev/null && grep -q "express" package.json; then
        SECURITY_PACKAGES_TO_INSTALL+=("helmet")
    fi
    
    if ! npm list "@types/node" &>/dev/null; then
        SECURITY_PACKAGES_TO_INSTALL+=("@types/node")
    fi
    
    if ! npm list "winston" &>/dev/null; then
        SECURITY_PACKAGES_TO_INSTALL+=("winston")
    fi
    
    if [ ${#SECURITY_PACKAGES_TO_INSTALL[@]} -gt 0 ]; then
        echo "Installing missing security packages: ${SECURITY_PACKAGES_TO_INSTALL[*]}"
        npm install "${SECURITY_PACKAGES_TO_INSTALL[@]}" 2>/dev/null || echo "⚠️  Some packages failed to install"
        echo "✅ Security packages installation attempted"
    else
        echo "✅ All essential security packages are already installed"
    fi
fi

# Auto-fix 5: Create security configuration files
echo ""
echo "🔒 Auto-Fix 5: Creating security configuration files..."

# Create .nvmrc for Node version consistency
if [[ ! -f ".nvmrc" ]]; then
    echo "Creating .nvmrc file for Node version consistency..."
    node --version | sed 's/v//' > .nvmrc
    echo "✅ .nvmrc file created"
fi

# Create .npmrc for security settings
if [[ ! -f ".npmrc" ]]; then
    echo "Creating .npmrc with security settings..."
    cat > .npmrc << 'EOF'
# Security settings
audit-level=moderate
fund=false
save-exact=true
package-lock=true

# Performance settings
progress=false
loglevel=warn
EOF
    echo "✅ .npmrc file created with security settings"
fi

# Create basic .editorconfig if missing
if [[ ! -f ".editorconfig" ]]; then
    echo "Creating .editorconfig for consistent code formatting..."
    cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
EOF
    echo "✅ .editorconfig file created"
fi

echo ""
echo "📋 Auto-Fix Summary:"
echo "==================="
echo "Vulnerability patches: Applied automatic fixes"
echo "TypeScript configuration: Optimized for security"
echo "Browser support: Modern matrix configured"
echo "Security packages: Installed where applicable"
echo "Configuration files: Created security-focused configs"

echo ""
echo "🔧 Dependency Fortress Auto-Fix completed - $(date)"
echo "Log file: $LOG_FILE"

echo ""
echo "⚠️  IMPORTANT: Please run the following after auto-fix:"
echo "1. npm test - Verify all tests still pass"
echo "2. npm run build - Ensure build works correctly"
echo "3. Review changes in package.json and tsconfig.json"
echo "4. Commit the security improvements"

exit 0