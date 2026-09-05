#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🧪 Testing Registration with Different Phone Formats"
echo "====================================================="

# Test different phone formats
test_phones=(
    "+251912345678"
    "0912345678"
    "912345678"
    "251912345678"
    "+251 91 234 5678"
    "0912-345-678"
)

for phone in "${test_phones[@]}"; do
    echo -e "\n📱 Testing: '$phone'"
    
    response=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
        -H "Content-Type: application/json" \
        -d "{\"phone_number\":\"$phone\",\"password\":\"Test@123\",\"full_name\":\"Test User $(date +%s)\",\"role\":\"candidate\"}")
    
    if echo "$response" | grep -q "Registration successful"; then
        echo "   ✅ SUCCESS"
        echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"   Phone: {d['data']['user']['phone_number']}\")" 2>/dev/null
    elif echo "$response" | grep -q "already exists"; then
        echo "   ⚠️  ALREADY EXISTS"
    else
        message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "   ❌ FAILED: $message"
    fi
done

echo -e "\n======================================"
echo "✅ Registration Testing Complete!"
