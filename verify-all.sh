#!/bin/bash

echo "🎯 COMPLETE PLATFORM VERIFICATION"
echo "=================================="
echo ""

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

# 1. Server
echo "🔍 1. SERVER STATUS"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health | grep -q "200"
check $? "Server running on port 3001"

curl -s $BASE_URL/health | grep -q "OK"
check $? "Health check OK"

# 2. Pages
echo -e "\n🔍 2. WEB PAGES"
pages=(
    "/" 
    "/jobs.html"
    "/jobs-full.html"
    "/companies.html"
    "/hr-dashboard.html"
    "/dashboard.html"
    "/chat.html"
    "/resume.html"
    "/profile.html"
    "/analytics.html"
    "/boss-ai.html"
    "/admin.html"
    "/payment.html"
    "/status.html"
    "/api-docs"
    "/company-positions.html"
)

for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    if [ "$status" == "200" ] || [ "$status" == "304" ]; then
        check 0 "Page: $page"
    else
        check 1 "Page: $page (Status: $status)"
    fi
done

# 3. API Endpoints
echo -e "\n🔍 3. API ENDPOINTS"
api_endpoints=(
    "/api/v1"
    "/api/v1/jobs"
    "/api/v1/companies"
    "/api/v1/jobs/categories"
    "/health/db"
    "/health/redis"
)

for endpoint in "${api_endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    if [ "$status" == "200" ] || [ "$status" == "304" ]; then
        check 0 "API: $endpoint"
    else
        check 1 "API: $endpoint (Status: $status)"
    fi
done

# 4. Authentication
echo -e "\n🔍 4. AUTHENTICATION"

# Admin login
adminRes=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251900000000","password":"Admin@123"}')
echo "$adminRes" | grep -q "Login successful"
check $? "Admin login"

# Employer login  
empRes=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251955555555","password":"HrMgr@123"}')
echo "$empRes" | grep -q "Login successful"
check $? "HR Manager login"

# Candidate login
candRes=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251977777777","password":"Test@123"}')
echo "$candRes" | grep -q "Login successful"
check $? "Candidate login"

# 5. Database
echo -e "\n🔍 5. DATABASE"
PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null
check $? "Database connection"

userCount=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
check $? "Users table ($userCount users)"

jobCount=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM jobs;" 2>/dev/null | xargs)
check $? "Jobs table ($jobCount jobs)"

# 6. Redis
echo -e "\n🔍 6. REDIS"
redis-cli ping | grep -q "PONG"
check $? "Redis connected"

# Summary
echo -e "\n=================================="
echo "📊 FINAL RESULTS"
echo "=================================="
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  📊 Total: $((PASS + FAIL))"
echo "=================================="

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "🎉 PLATFORM IS 100% OPERATIONAL!"
    echo ""
    echo "📍 Access Points:"
    echo "   Web: http://localhost:3001"
    echo "   API: http://localhost:3001/api/v1"
    echo "   Docs: http://localhost:3001/api-docs"
    echo ""
    echo "🔑 Test Credentials:"
    echo "   Admin: +251900000000 / Admin@123"
    echo "   HR Manager: +251955555555 / HrMgr@123"
    echo "   Candidate: +251977777777 / Test@123"
    echo ""
else
    echo ""
    echo "⚠️  $FAIL checks failed. Review above."
    echo ""
fi
