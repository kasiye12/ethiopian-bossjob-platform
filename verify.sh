#!/bin/bash

echo "🔍 Verifying Ethiopian Bossjob Platform"
echo "========================================"

BASE_URL="http://localhost:3001"
PASS=0
FAIL=0

check() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
        PASS=$((PASS+1))
    else
        echo "❌ $2"
        FAIL=$((FAIL+1))
    fi
}

# Check server
echo -e "\n1. Checking Web Server..."
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/ | grep -q "200"
check $? "Web server responding"

# Check health
echo -e "\n2. Checking Health Endpoint..."
curl -s $BASE_URL/health | grep -q "OK"
check $? "Health check passed"

# Check database
echo -e "\n3. Checking Database..."
curl -s $BASE_URL/health/db | grep -q "connected"
check $? "Database connected"

# Check Redis
echo -e "\n4. Checking Redis..."
curl -s $BASE_URL/health/redis | grep -q "PONG"
check $? "Redis connected"

# Check jobs API
echo -e "\n5. Checking Jobs API..."
curl -s $BASE_URL/api/v1/jobs | grep -q "success"
check $? "Jobs API working"

# Check static pages
echo -e "\n6. Checking Static Pages..."
for page in "index.html" "dashboard.html" "chat.html" "profile.html" "status.html" "company-register.html" "post-job.html"; do
    curl -s -o /dev/null -w "%{http_code}" $BASE_URL/$page | grep -q "200"
    check $? "Page: /$page"
done

echo -e "\n========================================"
echo "Results: $PASS passed, $FAIL failed"
echo "========================================"

if [ $FAIL -eq 0 ]; then
    echo "🎉 Platform is fully operational!"
else
    echo "⚠️  Some checks failed. Review the errors above."
fi
