#!/bin/bash

# Health check script for monitoring
BASE_URL="http://localhost:3001"
TIMEOUT=5

check_endpoint() {
    local url=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url")
    
    if [ "$response" == "200" ]; then
        echo "✅ $name: OK ($response)"
        return 0
    else
        echo "❌ $name: FAILED ($response)"
        return 1
    fi
}

echo "🔍 Health Check Report"
echo "======================"

check_endpoint "$BASE_URL/" "Web Interface"
check_endpoint "$BASE_URL/health" "API Health"
check_endpoint "$BASE_URL/health/db" "Database"
check_endpoint "$BASE_URL/health/redis" "Redis"
check_endpoint "$BASE_URL/api/v1/jobs" "Jobs API"

echo "======================"
