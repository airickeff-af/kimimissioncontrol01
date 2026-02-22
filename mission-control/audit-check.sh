#!/bin/bash
# Audit Check Script - 95/100 Required

echo "🔍 RUNNING AUDIT CHECK"
echo "======================"

SCORE=100
ERRORS=0

# Check for console.logs
echo "Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console.log" *.html 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "  ⚠️  Found $CONSOLE_LOGS console.log statements (-5 points)"
    SCORE=$((SCORE - 5))
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ No console.log statements"
fi

# Check for placeholder text
echo "Checking for placeholder text..."
PLACEHOLDERS=$(grep -ri "lorem ipsum\|placeholder\|todo\|fixme" *.html 2>/dev/null | wc -l)
if [ "$PLACEHOLDERS" -gt 0 ]; then
    echo "  ⚠️  Found $PLACEHOLDERS placeholders (-10 points)"
    SCORE=$((SCORE - 10))
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ No placeholder text"
fi

# Check for broken links
echo "Checking link consistency..."
NAV_LINKS=$(grep -o 'href="[^"]*"' index.html 2>/dev/null | sort | uniq | wc -l)
if [ "$NAV_LINKS" -ge 5 ]; then
    echo "  ✅ Navigation links present ($NAV_LINKS)"
else
    echo "  ⚠️  Limited navigation links (-5 points)"
    SCORE=$((SCORE - 5))
    ERRORS=$((ERRORS + 1))
fi

# Check for responsive meta tag
echo "Checking mobile responsiveness..."
RESPONSIVE=$(grep -l "viewport" *.html 2>/dev/null | wc -l)
if [ "$RESPONSIVE" -gt 0 ]; then
    echo "  ✅ Viewport meta tag present"
else
    echo "  ⚠️  Missing viewport meta tag (-5 points)"
    SCORE=$((SCORE - 5))
    ERRORS=$((ERRORS + 1))
fi

# Final score
echo ""
echo "======================"
echo "AUDIT SCORE: $SCORE/100"
echo "ERRORS: $ERRORS"
echo "======================"

if [ "$SCORE" -ge 95 ]; then
    echo "✅ PASSED - Ready for deployment"
    exit 0
else
    echo "❌ FAILED - Fix issues before deployment"
    exit 1
fi
