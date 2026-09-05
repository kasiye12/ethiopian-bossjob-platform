#!/bin/bash

echo "🔄 CLEAN START - Ethiopian Bossjob Platform"
echo "============================================"

# Kill all related processes
echo "1. Killing existing processes..."

# Kill processes on ports 3000 and 3001
for port in 3000 3001 3002; do
    sudo fuser -k ${port}/tcp 2>/dev/null
    echo "   ✅ Killed processes on port ${port}"
done

# Kill node and nodemon processes
sudo pkill -f "node src/server.js" 2>/dev/null
sudo pkill -f nodemon 2>/dev/null
echo "   ✅ Killed node/nodemon processes"

# Wait
sleep 5

# Verify ports are free
echo -e "\n2. Verifying ports..."
for port in 3000 3001 3002; do
    if sudo lsof -i :${port} &>/dev/null; then
        echo "   ❌ Port ${port} still in use"
        sudo lsof -i :${port}
    else
        echo "   ✅ Port ${port} is free"
    fi
done

# Start server
echo -e "\n3. Starting server..."
echo "============================================"
npm run dev
