#!/bin/bash

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Testing Ethiopian Bossjob Platform API"
echo "========================================="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Root URL
echo -e "${YELLOW}1️⃣ Testing Root URL${NC}"
response=$(curl -s $BASE_URL/)
if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Root URL working${NC}"
else
    echo -e "${RED}❌ Root URL failed${NC}"
fi

# Test 2: Health Check
echo -e "\n${YELLOW}2️⃣ Testing Health Check${NC}"
response=$(curl -s $BASE_URL/health)
echo "Response: $response"
if echo "$response" | grep -q "OK"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Test 3: Auth Test Route
echo -e "\n${YELLOW}3️⃣ Testing Auth Test Route${NC}"
response=$(curl -s $BASE_URL/api/v1/auth/test)
echo "Response: $response"
if echo "$response" | grep -q "working"; then
    echo -e "${GREEN}✅ Auth test route working${NC}"
else
    echo -e "${RED}❌ Auth test route failed${NC}"
fi

# Test 4: Register User
echo -e "\n${YELLOW}4️⃣ Testing User Registration${NC}"
echo "Sending POST request..."
response=$(curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+251911234567",
    "password": "Test@123",
    "full_name": "Abebe Kebede",
    "role": "candidate"
  }')

echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

if echo "$response" | grep -q "accessToken"; then
    echo -e "${GREEN}✅ Registration successful${NC}"
    TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "$TOKEN" > .token
elif echo "$response" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠️  User already exists${NC}"
else
    echo -e "${RED}❌ Registration failed${NC}"
fi

# Test 5: Login
echo -e "\n${YELLOW}5️⃣ Testing Login${NC}"
echo "Sending POST request..."
response=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+251911234567",
    "password": "Test@123"
  }')

echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

if echo "$response" | grep -q "accessToken"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "$TOKEN" > .token
    echo -e "${YELLOW}Token saved${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
fi

# Test 6: Get Current User
echo -e "\n${YELLOW}6️⃣ Testing Get Current User${NC}"
if [ -f .token ]; then
    TOKEN=$(cat .token)
    echo "Using token: ${TOKEN:0:20}..."
    response=$(curl -s $BASE_URL/api/v1/auth/me \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    
    if echo "$response" | grep -q "phone_number"; then
        echo -e "${GREEN}✅ Get user successful${NC}"
    else
        echo -e "${RED}❌ Get user failed${NC}"
    fi
else
    echo -e "${RED}❌ No token found${NC}"
fi

# Test 7: List Jobs
echo -e "\n${YELLOW}7️⃣ Testing Jobs List${NC}"
response=$(curl -s $BASE_URL/api/v1/jobs)
echo "Response:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

if echo "$response" | grep -q "success"; then
    echo -e "${GREEN}✅ Jobs list working${NC}"
else
    echo -e "${RED}❌ Jobs list failed${NC}"
fi

# Test 8: Database Health
echo -e "\n${YELLOW}8️⃣ Testing Database Health${NC}"
response=$(curl -s $BASE_URL/health/db)
echo "Response: $response"
if echo "$response" | grep -q "connected"; then
    echo -e "${GREEN}✅ Database connected${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
fi

# Test 9: Redis Health
echo -e "\n${YELLOW}9️⃣ Testing Redis Health${NC}"
response=$(curl -s $BASE_URL/health/redis)
echo "Response: $response"
if echo "$response" | grep -q "PONG\|OK"; then
    echo -e "${GREEN}✅ Redis connected${NC}"
else
    echo -e "${RED}❌ Redis connection failed${NC}"
fi

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ API Testing Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
