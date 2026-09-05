#!/bin/bash

echo "🎯 Final Platform Verification"
echo "==============================="

PASS=0
FAIL=0

check() {
    if [ $1 -eq 0 ]; then
        echo "  ✅ $2"
        PASS=$((PASS+1))
    else
        echo "  ❌ $2"
        FAIL=$((FAIL+1))
    fi
}

BASE_URL="http://localhost:3001"

echo -e "\n🔍 1. Server Status"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health | grep -q "200"
check $? "Server running"

echo -e "\n🔍 2. Pages Loading"
pages=("/" "/jobs.html" "/companies.html" "/hr-dashboard.html" "/chat.html" "/resume.html" "/analytics.html" "/boss-ai.html" "/admin.html" "/payment.html" "/status.html" "/api-docs")

for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    if [ "$status" == "200" ] || [ "$status" == "304" ]; then
        check 0 "Page: $page"
    else
        check 1 "Page: $page (Status: $status)"
    fi
done

echo -e "\n🔍 3. API Endpoints"
curl -s $BASE_URL/api/v1 | grep -q "success"
check $? "API Index"

curl -s $BASE_URL/api/v1/jobs | grep -q "success"
check $? "Jobs API"

curl -s $BASE_URL/health/db | grep -q "connected"
check $? "Database health"

curl -s $BASE_URL/health/redis | grep -q "PONG"
check $? "Redis health"

echo -e "\n🔍 4. Database"
PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null
check $? "Database connection"

USER_COUNT=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM users;")
check $? "Users table ($USER_COUNT users)"

JOB_COUNT=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM jobs;")
check $? "Jobs table ($JOB_COUNT jobs)"

echo -e "\n🔍 5. Authentication Test"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251900000000","password":"Admin@123"}')

echo "$LOGIN_RESPONSE" | grep -q "Login successful"
check $? "Admin login"

echo -e "\n==============================="
echo "📊 Results: $PASS passed, $FAIL failed"
echo "==============================="

if [ $FAIL -eq 0 ]; then
    echo -e "\n🎉 Platform is 100% OPERATIONAL!"
    echo "📍 Access at: http://localhost:3001"
else
    echo -e "\n⚠️  Some checks failed. Review above."
fi
