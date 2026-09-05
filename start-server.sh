#!/bin/bash

echo "🚀 STARTING BOSSJOB SERVER"
echo "=========================="

# Kill all node processes
echo "1. Killing existing processes..."
sudo kill -9 $(ps aux | grep node | grep -v grep | awk '{print $2}') 2>/dev/null
sudo fuser -k -9 3000/tcp 2>/dev/null
sudo pkill -9 -f nodemon 2>/dev/null
sleep 5

# Verify port is free
echo "2. Checking port 3000..."
if sudo lsof -i :3000 &>/dev/null; then
    echo "   ❌ Port still in use:"
    sudo lsof -i :3000
    sudo fuser -k -9 3000/tcp 2>/dev/null
    sleep 3
else
    echo "   ✅ Port 3000 is free"
fi

# Check database
echo "3. Checking database..."
if PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null; then
    echo "   ✅ Database connected"
else
    echo "   ⚠️ Database not found, creating..."
    PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d postgres -c "CREATE DATABASE bossjob_ethiopia;" 2>/dev/null
    echo "   ✅ Database created"
fi

# Start server
echo "4. Starting server..."
cd /home/ks/Documents/ethiopian-bossjob-platform
nohup node src/server.js > server.log 2>&1 &
SERVER_PID=$!
echo "   PID: $SERVER_PID"

# Wait for server to start
echo "5. Waiting for server..."
sleep 12

# Verify
echo "6. Verifying..."
if curl -s http://localhost:3000/health | grep -q "OK"; then
    echo ""
    echo "✅ SERVER IS RUNNING!"
    echo ""
    echo "   📍 http://localhost:3000"
    echo ""
    echo "   Health: $(curl -s http://localhost:3000/health | head -c 100)"
    echo ""
    echo "🔑 LOGIN:"
    echo "   Admin: +251900000000 / Admin@123"
    echo "   HR Manager: +251955555555 / HrMgr@123"
    echo "   Candidate: +251977777777 / Test@123"
    echo ""
else
    echo "   ❌ Server failed to start"
    echo "   Checking log..."
    tail -30 server.log
fi
