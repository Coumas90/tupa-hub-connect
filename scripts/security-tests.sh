#!/bin/bash

# Basic Vulnerability Tests for TUPÁ Hub
# Tests XSS, iframe embedding, and CSP enforcement
# Usage: ./scripts/security-tests.sh [URL] (defaults to localhost:3000)

set -e

URL=${1:-"http://localhost:3000"}
TEST_RESULTS=()

echo "🔒 Running basic vulnerability tests on: $URL"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [[ "$status" == "PASS" ]]; then
        echo -e "${GREEN}✅ $test_name: $message${NC}"
    elif [[ "$status" == "FAIL" ]]; then
        echo -e "${RED}❌ $test_name: $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $test_name: $message${NC}"
    fi
    
    TEST_RESULTS+=("$test_name: $status - $message")
}

# Test 1: XSS Injection Prevention in /consumo forms
echo ""
echo "🧪 Test 1: XSS Injection in /consumo forms"
echo "----------------------------------------"

xss_payload="<script>alert('XSS')</script>"
encoded_payload=$(echo "$xss_payload" | sed 's/</\%3C/g; s/>/\%3E/g; s/ /\%20/g; s/'/\%27/g')

# Test XSS in potential form fields
response=$(curl -s -X POST "$URL/consumo" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "search=$encoded_payload" \
    -w "%{http_code}" -o /tmp/xss_test.html || echo "000")

if [[ "$response" == "200" ]] || [[ "$response" == "302" ]]; then
    # Check if the payload was reflected in the response
    if grep -q "<script>" /tmp/xss_test.html 2>/dev/null; then
        log_test "XSS_INJECTION" "FAIL" "XSS payload was reflected in response"
    else
        log_test "XSS_INJECTION" "PASS" "XSS payload was properly sanitized"
    fi
else
    log_test "XSS_INJECTION" "WARN" "Could not test - endpoint returned $response"
fi

# Test 2: Iframe Embedding Prevention
echo ""
echo "🧪 Test 2: Iframe Embedding Prevention"
echo "------------------------------------"

# Check X-Frame-Options header
headers=$(curl -s -I "$URL/consumo" || echo "")

if echo "$headers" | grep -qi "X-Frame-Options: DENY"; then
    log_test "IFRAME_PREVENTION" "PASS" "X-Frame-Options: DENY header present"
elif echo "$headers" | grep -qi "X-Frame-Options"; then
    frame_options=$(echo "$headers" | grep -i "X-Frame-Options" | cut -d':' -f2 | tr -d ' \r\n')
    log_test "IFRAME_PREVENTION" "WARN" "X-Frame-Options set to: $frame_options"
else
    log_test "IFRAME_PREVENTION" "FAIL" "X-Frame-Options header missing"
fi

# Test CSP frame-src directive
if echo "$headers" | grep -qi "Content-Security-Policy.*frame-src.*none"; then
    log_test "CSP_FRAME_SRC" "PASS" "CSP frame-src 'none' directive present"
else
    log_test "CSP_FRAME_SRC" "WARN" "CSP frame-src 'none' not found"
fi

# Test 3: CSP Blocks External Scripts
echo ""
echo "🧪 Test 3: CSP External Script Blocking"
echo "--------------------------------------"

# Check CSP script-src directive
csp_header=$(echo "$headers" | grep -i "Content-Security-Policy" | head -1)

if [[ -n "$csp_header" ]]; then
    log_test "CSP_PRESENT" "PASS" "Content-Security-Policy header found"
    
    # Check script-src directive
    if echo "$csp_header" | grep -qi "script-src"; then
        if echo "$csp_header" | grep -qi "script-src.*'self'"; then
            log_test "CSP_SCRIPT_SRC" "PASS" "script-src includes 'self'"
        else
            log_test "CSP_SCRIPT_SRC" "WARN" "script-src directive found but may be permissive"
        fi
        
        # Check for unsafe directives
        if echo "$csp_header" | grep -qi "script-src.*'unsafe-eval'"; then
            log_test "CSP_UNSAFE_EVAL" "WARN" "unsafe-eval found in script-src"
        else
            log_test "CSP_UNSAFE_EVAL" "PASS" "No unsafe-eval in script-src"
        fi
        
        if echo "$csp_header" | grep -qi "script-src.*'unsafe-inline'"; then
            log_test "CSP_UNSAFE_INLINE" "FAIL" "unsafe-inline found in script-src"
        else
            log_test "CSP_UNSAFE_INLINE" "PASS" "No unsafe-inline in script-src"
        fi
    else
        log_test "CSP_SCRIPT_SRC" "FAIL" "No script-src directive in CSP"
    fi
else
    log_test "CSP_PRESENT" "FAIL" "Content-Security-Policy header missing"
fi

# Test 4: Additional Security Headers
echo ""
echo "🧪 Test 4: Additional Security Headers"
echo "------------------------------------"

# Check X-Content-Type-Options
if echo "$headers" | grep -qi "X-Content-Type-Options: nosniff"; then
    log_test "CONTENT_TYPE_OPTIONS" "PASS" "X-Content-Type-Options: nosniff present"
else
    log_test "CONTENT_TYPE_OPTIONS" "WARN" "X-Content-Type-Options header missing"
fi

# Check Strict-Transport-Security
if echo "$headers" | grep -qi "Strict-Transport-Security"; then
    if echo "$headers" | grep -qi "max-age"; then
        log_test "HSTS" "PASS" "HSTS header with max-age present"
    else
        log_test "HSTS" "WARN" "HSTS header found but missing max-age"
    fi
else
    log_test "HSTS" "WARN" "HSTS header missing (OK for localhost)"
fi

# Test 5: Basic Input Validation
echo ""
echo "🧪 Test 5: Input Validation Tests"
echo "-------------------------------"

# Test SQL injection patterns (basic)
sql_payload="'; DROP TABLE users; --"
encoded_sql=$(echo "$sql_payload" | sed 's/;/\%3B/g; s/ /\%20/g; s/'/\%27/g')

response=$(curl -s -X POST "$URL/consumo" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "search=$encoded_sql" \
    -w "%{http_code}" -o /tmp/sql_test.html || echo "000")

if [[ "$response" == "200" ]] || [[ "$response" == "302" ]]; then
    # Basic check - look for database error messages
    if grep -qi "error\|exception\|sql" /tmp/sql_test.html 2>/dev/null; then
        log_test "SQL_INJECTION" "WARN" "Potential SQL error messages in response"
    else
        log_test "SQL_INJECTION" "PASS" "No obvious SQL injection vulnerabilities"
    fi
else
    log_test "SQL_INJECTION" "WARN" "Could not test - endpoint returned $response"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "=============="

pass_count=0
fail_count=0
warn_count=0

for result in "${TEST_RESULTS[@]}"; do
    if [[ "$result" == *"PASS"* ]]; then
        ((pass_count++))
    elif [[ "$result" == *"FAIL"* ]]; then
        ((fail_count++))
    elif [[ "$result" == *"WARN"* ]]; then
        ((warn_count++))
    fi
done

echo "✅ Passed: $pass_count"
echo "❌ Failed: $fail_count"
echo "⚠️  Warnings: $warn_count"

if [[ $fail_count -gt 0 ]]; then
    echo ""
    echo -e "${RED}🚨 CRITICAL: $fail_count security tests failed!${NC}"
    exit 1
elif [[ $warn_count -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: $warn_count security concerns found${NC}"
    exit 0
else
    echo ""
    echo -e "${GREEN}🔒 All security tests passed!${NC}"
fi

# Cleanup
rm -f /tmp/xss_test.html /tmp/sql_test.html