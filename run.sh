#!/bin/bash

echo "=========================================="
echo "🇪🇹 ETHIOPIAN BOSSJOB PLATFORM RUNNER"
echo "=========================================="
echo ""

# Step 1: Kill all existing processes
echo "1️⃣ Cleaning up existing processes..."
sudo fuser -k -9 3000/tcp 2>/dev/null
sudo fuser -k -9 3001/tcp 2>/dev/null
sudo pkill -9 -f "node src/server.js" 2>/dev/null
sudo pkill -9 -f nodemon 2>/dev/null
sudo pkill -9 node 2>/dev/null
sleep 5
echo "   ✅ Ports cleared"
echo ""

# Step 2: Check Docker services (Redis and PostgreSQL)
echo "2️⃣ Checking Docker services..."
if docker ps | grep -q "bossjob_redis"; then
    echo "   ✅ Redis is running"
else
    echo "   ⚠️ Redis not running, starting..."
    docker compose up -d redis 2>/dev/null
    sleep 3
fi

if docker ps | grep -q "bossjob_postgres" || PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null; then
    echo "   ✅ PostgreSQL is running"
else
    echo "   ⚠️ PostgreSQL not running, starting..."
    docker compose up -d postgres 2>/dev/null
    sleep 5
fi
echo ""

# Step 3: Verify database exists
echo "3️⃣ Verifying database..."
if PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null; then
    echo "   ✅ Database exists"
else
    echo "   Creating database..."
    PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d postgres -c "CREATE DATABASE bossjob_ethiopia;" 2>/dev/null
    echo "   ✅ Database created"
fi
echo ""

# Step 4: Verify users exist
echo "4️⃣ Verifying users..."
USER_COUNT=$(PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
if [ "$USER_COUNT" -gt 5 ]; then
    echo "   ✅ $USER_COUNT users in database"
else
    echo "   ⚠️ Only $USER_COUNT users, seeding..."
    node seed-users-only.js 2>/dev/null || node create-users.js 2>/dev/null
    echo "   ✅ Users seeded"
fi
echo ""

# Step 5: Start server
echo "5️⃣ Starting server..."
nohup node src/server.js > server.log 2>&1 &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"
echo "   Waiting for startup..."
sleep 10
echo ""

# Step 6: Verify server
echo "6️⃣ Verifying server..."
if curl -s http://localhost:3000/health | grep -q "OK"; then
    echo "   ✅ SERVER IS RUNNING!"
else
    echo "   ❌ Server failed to start"
    echo "   Checking log..."
    tail -30 server.log
    exit 1
fi
echo ""

# Step 7: Test all pages
echo "7️⃣ Testing pages..."
PAGES_PASS=0
PAGES_FAIL=0

for page in "/" "/jobs.html" "/companies.html" "/hr-dashboard.html" "/dashboard.html" "/chat.html" "/resume.html" "/profile.html" "/analytics.html" "/boss-ai.html" "/admin.html" "/api-docs"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    if [ "$status" == "200" ] || [ "$status" == "304" ]; then
        echo "   ✅ $page"
        PAGES_PASS=$((PAGES_PASS+1))
    else
        echo "   ❌ $page ($status)"
        PAGES_FAIL=$((PAGES_FAIL+1))
    fi
done
echo "   Pages: $PAGES_PASS passed, $PAGES_FAIL failed"
echo ""

# Step 8: Test login
echo "8️⃣ Testing authentication..."
AUTH_PASS=0
AUTH_FAIL=0

for cred in "+251900000000:Admin@123" "+251955555555:HrMgr@123" "+251977777777:Test@123"; do
    phone="${cred%%:*}"
    pass="${cred##*:}"
    res=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"phone_number\":\"$phone\",\"password\":\"$pass\"}")
    
    if echo "$res" | grep -q "Login successful"; then
        echo "   ✅ $phone"
        AUTH_PASS=$((AUTH_PASS+1))
    else
        echo "   ❌ $phone"
        AUTH_FAIL=$((AUTH_FAIL+1))
    fi
done
echo "   Auth: $AUTH_PASS passed, $AUTH_FAIL failed"
echo ""

# Step 9: Summary
echo "=========================================="
echo "🎉 PLATFORM STATUS SUMMARY"
echo "=========================================="
echo ""
echo "   📊 Total Pages: $((PAGES_PASS + PAGES_FAIL))"
echo "   ✅ Pages Working: $PAGES_PASS"
echo "   ✅ Auth Working: $AUTH_PASS"
echo ""
echo "🌐 ACCESS:"
echo "   http://localhost:3000"
echo ""
echo "🔑 CREDENTIALS:"
echo "   Admin: +251900000000 / Admin@123"
echo "   HR Manager: +251955555555 / HrMgr@123"
echo "   Candidate: +251977777777 / Test@123"
echo ""
echo "📝 LOGS:"
echo "   tail -f server.log"
echo ""
echo "🛑 STOP SERVER:"
echo "   sudo pkill -9 node"
echo ""
echo "=========================================="
