#!/bin/bash
set -e

# Build should have been run before this script
npx vite preview --port 4173 >/tmp/vite-preview.log 2>&1 &
PID=$!
sleep 2

headers=$(curl -s -I http://localhost:4173/)
body=$(curl -s http://localhost:4173/)

kill $PID

if ! echo "$headers" | grep -qi "Content-Security-Policy"; then
  echo "❌ CSP header missing" >&2
  exit 1
fi

if echo "$headers" | grep -qi "'unsafe-inline'"; then
  echo "❌ CSP header contains unsafe-inline" >&2
  exit 1
fi

if ! echo "$headers" | grep -qi "frame-ancestors 'none'"; then
  echo "❌ frame-ancestors missing from header" >&2
  exit 1
fi

if ! echo "$headers" | grep -qi "X-Frame-Options: DENY"; then
  echo "❌ X-Frame-Options header missing" >&2
  exit 1
fi

if ! echo "$body" | grep -qi "Content-Security-Policy"; then
  echo "❌ CSP meta tag missing" >&2
  exit 1
fi

if echo "$body" | grep -qi "'unsafe-inline'"; then
  echo "❌ CSP meta tag contains unsafe-inline" >&2
  exit 1
fi

if ! echo "$body" | grep -qi "frame-ancestors 'none'"; then
  echo "❌ frame-ancestors missing in meta tag" >&2
  exit 1
fi

echo "✅ CSP headers and meta tag are properly configured"

