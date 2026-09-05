#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🧪 Testing Login with Different Phone Formats"
echo "=============================================="

# Test different formats for existing user +251977777777
test_phones=(
    "+251977777777"
    "0977777777"
    "977777777"
    "251977777777"
)

for phone in "${test_phones[@]}"; do
    echo -e "\n📱 Testing: '$phone'"
    
    response=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"phone_number\":\"$phone\",\"password\":\"Test@123\"}")
    
    if echo "$response" | grep -q "Login successful"; then
        echo "   ✅ SUCCESS"
    else
        message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "   ❌ FAILED: $message"
    fi
done

echo -e "\n======================================"
