#!/bin/bash

BASE_URL="http://localhost:3001"
TOKEN=""

echo "🧪 Testing HR Features"
echo "======================"

# Login as employer
echo -e "\n1️⃣ Login as Employer..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251922345678","password":"Boss@123"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✅ Token obtained"

# Search talents
echo -e "\n2️⃣ Search Talents..."
curl -s "$BASE_URL/api/v1/talents/search?city=Addis%20Ababa" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo ""

# Get recommended talents
echo -e "\n3️⃣ Get Recommended Talents..."
curl -s "$BASE_URL/api/v1/talents/recommended" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo ""

# Get interviews
echo -e "\n4️⃣ Get Interviews..."
curl -s "$BASE_URL/api/v1/interviews" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo ""

echo -e "\n======================"
echo "✅ HR Features Test Complete!"
