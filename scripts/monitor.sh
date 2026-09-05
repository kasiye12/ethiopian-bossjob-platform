#!/bin/bash

# Continuous monitoring script
while true; do
    clear
    echo "📊 Bossjob Platform Monitor"
    echo "==========================="
    
    # Server status
    if curl -s http://localhost:3001/health &>/dev/null; then
        echo "🟢 Server: Running"
    else
        echo "🔴 Server: Down"
    fi
    
    # Database status
    if PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d bossjob_ethiopia -c "SELECT 1;" &>/dev/null; then
        echo "🟢 Database: Connected"
    else
        echo "🔴 Database: Disconnected"
    fi
    
    # Redis status
    if redis-cli ping &>/dev/null; then
        echo "🟢 Redis: Connected"
    else
        echo "🔴 Redis: Disconnected"
    fi
    
    # Memory usage
    echo ""
    echo "💾 Memory Usage:"
    free -h | grep Mem | awk '{print "   Used: " $3 " / " $2}'
    
    # Disk usage
    echo ""
    echo "📁 Disk Usage:"
    df -h / | tail -1 | awk '{print "   Used: " $3 " / " $2 " (" $5 ")"}'
    
    # Active connections
    echo ""
    echo "🔌 Active Connections:"
    if command -v netstat &>/dev/null; then
        netstat -an 2>/dev/null | grep :3001 | grep ESTABLISHED | wc -l | awk '{print "   " $1 " connections"}'
    fi
    
    echo ""
    echo "==========================="
    echo "Press Ctrl+C to exit"
    
    sleep 5
done
