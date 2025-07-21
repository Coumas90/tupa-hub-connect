#!/bin/bash

# Local Development Security Headers Test
# Tests security headers on local development server
# Usage: ./scripts/local-header-test.sh [PORT]

set -e

PORT=${1:-3000}
LOCAL_URL="http://localhost:$PORT"

echo "🧪 Testing local development security headers..."
echo "URL: $LOCAL_URL"
echo "================================================"

# Check if local server is running
if ! curl -s "$LOCAL_URL" > /dev/null; then
    echo "❌ Local server is not running on port $PORT"
    echo "💡 Start your dev server with: npm run dev"
    exit 1
fi

echo "✅ Local server is running"

# Test headers that should be present locally
echo ""
echo "📋 Checking headers..."

# Get headers
response=$(curl -s -I "$LOCAL_URL" 2>/dev/null)

# Check Content-Type
content_type=$(echo "$response" | grep -i "content-type:" | head -1 | sed 's/.*: //' | tr -d '\r\n' || echo "")
if [[ "$content_type" == *"text/html"* ]]; then
    echo "✅ Content-Type: $content_type"
else
    echo "❌ Unexpected Content-Type: $content_type"
fi

# Note about local vs production headers
echo ""
echo "📝 Note: Security headers are configured for production deployment"
echo "   Local development may not show all production headers"
echo "   Production headers are set via:"
echo "   - public/_headers (general deployment)"
echo "   - vercel.json (Vercel-specific)"

# Test application routes
echo ""
echo "🔍 Testing application routes..."

routes=("/" "/consumo" "/academia" "/recetas" "/dashboard")

for route in "${routes[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_URL$route" || echo "000")
    
    if [[ "$status" == "200" ]]; then
        echo "✅ $route - HTTP $status"
    elif [[ "$status" == "302" ]] || [[ "$status" == "401" ]]; then
        echo "⚠️  $route - HTTP $status (redirect/auth required)"
    else
        echo "❌ $route - HTTP $status"
    fi
done

echo ""
echo "🎯 To test production headers:"
echo "   ./scripts/verify-deployment.sh https://your-production-url.com"