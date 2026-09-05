#!/bin/bash

echo "🔄 Clean Restart for Ethiopian Bossjob Platform"
echo "==============================================="

# Kill existing processes
echo "1️⃣ Killing existing processes..."

# Kill nodemon
pkill -f nodemon 2>/dev/null
echo "   ✅ Killed nodemon"

# Kill node server
pkill -f "src/server.js" 2>/dev/null
echo "   ✅ Killed node server"

# Kill anything on port 3001
if command -v fuser &> /dev/null; then
    sudo fuser -k 3001/tcp 2>/dev/null
    echo "   ✅ Killed process on port 3001"
fi

# Kill anything on port 3000
if command -v fuser &> /dev/null; then
    sudo fuser -k 3000/tcp 2>/dev/null
    echo "   ✅ Killed process on port 3000"
fi

# Wait for processes to die
sleep 3

# Verify ports are free
echo -e "\n2️⃣ Verifying ports are free..."
if sudo lsof -i :3001 &>/dev/null; then
    echo "   ❌ Port 3001 still in use"
    echo "   Processes:"
    sudo lsof -i :3001
    echo "   Force killing..."
    sudo kill -9 $(sudo lsof -t -i:3001) 2>/dev/null
    sleep 2
else
    echo "   ✅ Port 3001 is free"
fi

if sudo lsof -i :3000 &>/dev/null; then
    echo "   ❌ Port 3000 still in use"
    echo "   Force killing..."
    sudo kill -9 $(sudo lsof -t -i:3000) 2>/dev/null
    sleep 2
else
    echo "   ✅ Port 3000 is free"
fi

# Clear old logs
echo -e "\n3️⃣ Clearing old logs..."
rm -f logs/*.log 2>/dev/null
echo "   ✅ Logs cleared"

# Start the server
echo -e "\n4️⃣ Starting server..."
echo "==============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
npm run dev
