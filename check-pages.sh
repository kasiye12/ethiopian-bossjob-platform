#!/bin/bash

BASE_URL="http://localhost:3001"
PASS=0
FAIL=0

echo "🔍 Checking All Pages"
echo "====================="

pages=(
    "/"
    "/jobs.html"
    "/companies.html"
    "/hr-dashboard.html"
    "/dashboard.html"
    "/chat.html"
    "/profile.html"
    "/resume.html"
    "/analytics.html"
    "/boss-ai.html"
    "/admin.html"
    "/payment.html"
    "/company-positions.html"
    "/status.html"
    "/api-docs"
    "/index-lang.html"
)

for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    
    if [ "$status" == "200" ]; then
        echo "✅ $page (200)"
        PASS=$((PASS+1))
    else
        echo "❌ $page ($status)"
        FAIL=$((FAIL+1))
    fi
done

echo ""
echo "====================="
echo "✅ Passed: $PASS"
echo "❌ Failed: $FAIL"
echo "====================="
