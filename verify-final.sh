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
echo -e "\n🔍 2. WEB PAGES (16 pages)"
pages=("/" "/jobs.html" "/jobs-full.html" "/companies.html" "/hr-dashboard.html" "/dashboard.html" "/chat.html" "/resume.html" "/profile.html" "/analytics.html" "/boss-ai.html" "/admin.html" "/payment.html" "/status.html" "/api-docs" "/company-positions.html")

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
api_endpoints=("/api/v1" "/api/v1/jobs" "/api/v1/companies" "/api/v1/jobs/categories" "/health/db" "/health/redis")

for endpoint in "${api_endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    if [ "$status" == "200" ] || [ "$status" == "304" ]; then
        check 0 "API: $endpoint"
    else
        check 1 "API: $endpoint (Status: $status)"
    fi
done

# 4. Authentication (ALL USERS)
echo -e "\n🔍 4. AUTHENTICATION (8 Users)"

declare -A users=(
    ["+251900000000"]="Admin@123"
    ["+251911111111"]="Owner@123"
    ["+251922222222"]="Founder@123"
    ["+251933333333"]="Ceo@12345"
    ["+251944444444"]="HrDir@123"
    ["+251955555555"]="HrMgr@123"
    ["+251966666666"]="HrOff@123"
    ["+251977777777"]="Test@123"
)

for phone in "${!users[@]}"; do
    password="${users[$phone]}"
    res=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"phone_number\":\"$phone\",\"password\":\"$password\"}")
    
    if echo "$res" | grep -q "Login successful"; then
        check 0 "Login: $phone"
    else
        check 1 "Login: $phone"
    fi
done

# 5. Database
echo -e "\n🔍 5. DATABASE"
PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null
check $? "Database connection"

userCount=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
check $? "Users: $userCount"

companyCount=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null | xargs)
check $? "Companies: $companyCount"

jobCount=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM jobs;" 2>/dev/null | xargs)
check $? "Jobs: $jobCount"

# 6. Redis (via Docker)
echo -e "\n🔍 6. REDIS (Docker)"
docker exec bossjob_redis redis-cli ping 2>/dev/null | grep -q "PONG"
check $? "Redis connected (Docker)"

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
    echo "🔑 ALL TEST CREDENTIALS WORKING:"
    echo "   Admin: +251900000000 / Admin@123"
    echo "   Owner: +251911111111 / Owner@123"
    echo "   Founder: +251922222222 / Founder@123"
    echo "   CEO: +251933333333 / Ceo@12345"
    echo "   HR Director: +251944444444 / HrDir@123"
    echo "   HR Manager: +251955555555 / HrMgr@123"
    echo "   HR Officer: +251966666666 / HrOff@123"
    echo "   Candidate: +251977777777 / Test@123"
    echo ""
else
    echo ""
    echo "⚠️  $FAIL check(s) failed."
    echo ""
fi
