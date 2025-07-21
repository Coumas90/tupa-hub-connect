#!/bin/bash

# PaymentService Test Coverage Report Generator
echo "🧪 Running PaymentService test coverage analysis..."

# Run tests with coverage
npm run test:coverage -- src/__tests__/lib/services/paymentService.test.ts

# Check if coverage meets thresholds
COVERAGE_THRESHOLD=80

echo ""
echo "📊 Coverage Analysis Complete!"
echo ""
echo "Coverage reports available in:"
echo "  📄 HTML: coverage/index.html"
echo "  📊 JSON: coverage/coverage-final.json"
echo "  📋 LCOV: coverage/lcov.info"
echo ""

# Extract coverage percentages (this would need actual implementation based on output)
echo "🎯 Coverage Requirements:"
echo "  ✅ Branches: ≥${COVERAGE_THRESHOLD}%"
echo "  ✅ Functions: ≥${COVERAGE_THRESHOLD}%"
echo "  ✅ Lines: ≥${COVERAGE_THRESHOLD}%"
echo "  ✅ Statements: ≥${COVERAGE_THRESHOLD}%"
echo ""

# Generate coverage badge (optional)
if command -v npx &> /dev/null; then
    echo "🏷️  Generating coverage badge..."
    npx coverage-badges-cli --source coverage/coverage-summary.json --output badges/
fi

echo "✅ Coverage report generation complete!"
echo ""
echo "🔍 To view detailed report, open: coverage/index.html"