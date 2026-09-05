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

echo "🎯 COMPLETE PLATFORM CHECK"
echo "=========================="

# Server
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health | grep -q "200"
check $? "Server running"

# Pages
echo -e "\n📄 PAGES:"
for page in "/" "/jobs.html" "/companies.html" "/hr-dashboard.html" "/dashboard.html" "/chat.html" "/resume.html" "/profile.html" "/analytics.html" "/boss-ai.html" "/admin.html" "/payment.html" "/status.html" "/api-docs" "/company-positions.html"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    if [ "$status" == "200" ] || [ "$status" == "304" ]; then
        check 0 "$page"
    else
        check 1 "$page ($status)"
    fi
done

# API
echo -e "\n🔌 API:"
curl -s $BASE_URL/api/v1/jobs | grep -q "success"
check $? "Jobs API"

curl -s $BASE_URL/api/v1/companies | grep -q "success"
check $? "Companies API"

# Auth
echo -e "\n🔐 AUTH:"
for cred in "+251900000000:Admin@123" "+251955555555:HrMgr@123" "+251977777777:Test@123"; do
    phone="${cred%%:*}"
    pass="${cred##*:}"
    res=$(curl -s -X POST $BASE_URL/api/v1/auth/login -H "Content-Type: application/json" -d "{\"phone_number\":\"$phone\",\"password\":\"$pass\"}")
    echo "$res" | grep -q "Login successful"
    check $? "Login: $phone"
done

# Summary
echo -e "\n=========================="
echo "✅ PASSED: $PASS | ❌ FAILED: $FAIL"
echo "=========================="

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "🎉 PLATFORM 100% OPERATIONAL!"
    echo "📍 http://localhost:3000"
    echo ""
    echo "🔑 LOGIN:"
    echo "   Admin: +251900000000 / Admin@123"
    echo "   HR: +251955555555 / HrMgr@123"
    echo "   Candidate: +251977777777 / Test@123"
    echo ""
fi
