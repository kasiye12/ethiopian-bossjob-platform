#!/bin/bash

BASE_URL="http://localhost:3000"
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

echo "🎯 FINAL PLATFORM CHECK"
echo "======================="

# 1. Server
echo -e "\n🔍 SERVER"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health | grep -q "200"
check $? "Server running on port 3000"

# 2. All Pages
echo -e "\n🔍 PAGES"
pages=("/" "/jobs.html" "/companies.html" "/hr-dashboard.html" "/dashboard.html" "/chat.html" "/resume.html" "/profile.html" "/analytics.html" "/boss-ai.html" "/admin.html" "/payment.html" "/status.html" "/api-docs" "/company-positions.html")

for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    if [ "$status" == "200" ] || [ "$status" == "304" ]; then
        check 0 "Page: $page"
    else
        check 1 "Page: $page ($status)"
    fi
done

# 3. API
echo -e "\n🔍 API"
curl -s $BASE_URL/api/v1 | grep -q "success"
check $? "API Index"

curl -s $BASE_URL/api/v1/jobs | grep -q "success"
check $? "Jobs API"

curl -s $BASE_URL/api/v1/companies | grep -q "success"
check $? "Companies API"

# 4. Authentication
echo -e "\n🔍 AUTHENTICATION"
for cred in "+251900000000:Admin@123" "+251955555555:HrMgr@123" "+251977777777:Test@123"; do
    phone="${cred%%:*}"
    pass="${cred##*:}"
    res=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"phone_number\":\"$phone\",\"password\":\"$pass\"}")
    echo "$res" | grep -q "Login successful"
    check $? "Login: $phone"
done

# 5. Registration
echo -e "\n🔍 REGISTRATION"
REG_RES=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"phone_number\":\"0912345678\",\"password\":\"Test@123\",\"full_name\":\"New User\",\"role\":\"candidate\"}")
echo "$REG_RES" | grep -q "success\|exists"
check $? "Registration with local format"

# 6. Database
echo -e "\n🔍 DATABASE"
PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null
check $? "Database connection"

userCount=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
check $? "Users: $userCount"

jobCount=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM jobs;" 2>/dev/null | xargs)
check $? "Jobs: $jobCount"

# Summary
echo -e "\n==============================="
echo "📊 RESULTS: $PASS passed, $FAIL failed"
echo "==============================="

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "🎉 PLATFORM IS 100% OPERATIONAL!"
    echo ""
    echo "📍 ACCESS:"
    echo "   Web: http://localhost:3000"
    echo "   API: http://localhost:3000/api/v1"
    echo "   Docs: http://localhost:3000/api-docs"
    echo ""
    echo "🔑 CREDENTIALS:"
    echo "   Admin: +251900000000 / Admin@123"
    echo "   HR Manager: +251955555555 / HrMgr@123"
    echo "   Candidate: +251977777777 / Test@123"
    echo ""
else
    echo ""
    echo "⚠️  $FAIL check(s) failed"
    echo ""
fi
