#!/bin/bash
SCORE=100
ERRORS=0

# Check console.logs
LOGS=$(grep -r "console.log" *.html 2>/dev/null | wc -l)
if [ "$LOGS" -gt 3 ]; then
    SCORE=$((SCORE - 5))
    ERRORS=$((ERRORS + 1))
fi

# Check placeholders
PLACEHOLDERS=$(grep -ri "lorem ipsum\|placeholder\|todo\|fixme" *.html 2>/dev/null | wc -l)
if [ "$PLACEHOLDERS" -gt 0 ]; then
    SCORE=$((SCORE - 10))
    ERRORS=$((ERRORS + 1))
fi

# Check API integration
API=$(grep -l "fetch.*api" *.html 2>/dev/null | wc -l)
if [ "$API" -gt 0 ]; then
    echo "✅ Real API integration found"
fi

echo "AUDIT: $SCORE/100"
if [ "$SCORE" -ge 95 ]; then
    echo "✅ PASSED"
else
    echo "⚠️  Check errors: $ERRORS"
fi
