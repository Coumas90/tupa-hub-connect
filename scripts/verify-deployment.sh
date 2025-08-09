#!/bin/bash

# Deployment Security Headers Verification Script
# Usage: ./scripts/verify-deployment.sh <URL>
# Example: ./scripts/verify-deployment.sh https://tuapp.com

set -e

URL=${1:-"https://localhost:3000"}
FAILED=0

echo "🔒 Verifying security headers for: $URL"
echo "================================================"

# Function to check if header exists and matches expected value
check_header() {
    local path=$1
    local header=$2
    local expected=$3
    local url="$URL$path"
    
    echo "📍 Checking $path..."
    
    # Get headers with curl
    response=$(curl -s -I "$url" 2>/dev/null || echo "CURL_FAILED")
    
    if [[ "$response" == "CURL_FAILED" ]]; then
        echo "❌ FAILED: Could not reach $url"
        FAILED=1
        return
    fi
    
    # Check if header exists
    header_value=$(echo "$response" | grep -i "^$header:" | sed 's/.*: //' | tr -d '\r\n' || echo "")
    
    if [[ -z "$header_value" ]]; then
        echo "❌ FAILED: $header header is missing"
        FAILED=1
        return
    fi
    
    # Check if header matches expected value (partial match for CSP)
    if [[ "$expected" == *"CONTAINS"* ]]; then
        expected_clean=$(echo "$expected" | sed 's/CONTAINS://')
        if [[ "$header_value" == *"$expected_clean"* ]]; then
            echo "✅ PASSED: $header header contains expected value"
        else
            echo "❌ FAILED: $header header does not contain '$expected_clean'"
            echo "   Found: $header_value"
            FAILED=1
        fi
    else
        if [[ "$header_value" == "$expected" ]]; then
            echo "✅ PASSED: $header header is correctly set"
        else
            echo "❌ FAILED: $header header mismatch"
            echo "   Expected: $expected"
            echo "   Found: $header_value"
            FAILED=1
        fi
    fi
}

# Test global headers (/)
echo ""
echo "🌐 Testing global headers (/)..."
check_header "/" "X-Frame-Options" "DENY"
check_header "/" "X-Content-Type-Options" "nosniff"
check_header "/" "Strict-Transport-Security" "CONTAINS:max-age=63072000"
check_header "/" "Content-Security-Policy" "CONTAINS:default-src 'self'"
check_header "/" "Content-Security-Policy" "CONTAINS:frame-ancestors 'none'"

# Test /consumo specific headers
echo ""
echo "🔒 Testing /consumo specific headers..."
check_header "/consumo" "Content-Security-Policy" "CONTAINS:default-src 'none'"
check_header "/consumo" "X-Frame-Options" "DENY"

# Test other critical pages
echo ""
echo "📄 Testing other critical pages..."
check_header "/academia" "X-Frame-Options" "DENY"
check_header "/recetas" "Content-Security-Policy" "CONTAINS:default-src 'self'"

# Check for security anti-patterns
echo ""
echo "🚫 Checking for security anti-patterns..."

# Check if unsafe-inline is present and required domains
response=$(curl -s -I "$URL" 2>/dev/null || echo "CURL_FAILED")
if [[ "$response" != "CURL_FAILED" ]]; then
    csp_header=$(echo "$response" | grep -i "content-security-policy:" | tr -d '\r\n' || echo "")

    if [[ "$csp_header" == *"'unsafe-inline'"* ]]; then
        echo "❌ FAILED: unsafe-inline detected in CSP"
        FAILED=1
    fi

    if [[ "$csp_header" != *"*.supabase.co"* ]]; then
        echo "❌ FAILED: Supabase domains not found in CSP"
        FAILED=1
    else
        echo "✅ PASSED: Supabase domains properly configured"
    fi
fi

# Summary
echo ""
echo "================================================"
if [[ $FAILED -eq 0 ]]; then
    echo "🎉 SUCCESS: All security headers are properly configured!"
    exit 0
else
    echo "💥 FAILURE: Some security headers are missing or misconfigured!"
    echo ""
    echo "🛠️  Troubleshooting steps:"
    echo "1. Check if vercel.json is deployed correctly"
    echo "2. Verify headers configuration in public/_headers"
    echo "3. Ensure deployment platform recognizes header configuration"
    echo "4. Test headers locally: curl -I http://localhost:3000/"
    exit 1
fi