#!/bin/bash

BASE_URL="http://localhost:3001"
TOKEN=""
COMPANY_ID=""
JOB_ID=""

echo "🎯 Full Platform Testing"
echo "========================"

# Test 1: Register Candidate
echo -e "\n1️⃣ Register Candidate"
curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251911234567","password":"Test@123","full_name":"Abebe Kebede","role":"candidate"}' | head -c 200

# Test 2: Register Employer
echo -e "\n\n2️⃣ Register Employer"
curl -s -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251922345678","password":"Boss@123","full_name":"Sara Mohammed","role":"boss"}' | head -c 200

# Test 3: Login Employer
echo -e "\n\n3️⃣ Login Employer"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251922345678","password":"Boss@123"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:20}..."

# Test 4: Register Company
echo -e "\n\n4️⃣ Register Company"
curl -s -X POST $BASE_URL/api/v1/companies/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Tech Solutions PLC","industry":"Technology","company_size":"11-50","tin_number":"TIN12345","business_license_number":"BL67890","region":"Addis Ababa","sub_city":"Bole","phone_number":"+251911223344","email":"info@tech.com","description":"Leading tech company"}' | head -c 200

# Test 5: Post Job
echo -e "\n\n5️⃣ Post Job"
curl -s -X POST $BASE_URL/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Software Developer","description":"Looking for experienced developer","requirements":"3+ years experience","job_type":"Full-time","category":"IT","region":"Addis Ababa","salary_min_etb":30000,"salary_max_etb":50000,"experience_level":"3-5 Years"}' | head -c 200

# Test 6: List Jobs
echo -e "\n\n6️⃣ List Jobs"
curl -s $BASE_URL/api/v1/jobs | head -c 200

# Test 7: Health
echo -e "\n\n7️⃣ Health Check"
curl -s $BASE_URL/health

echo -e "\n\n✅ Testing Complete!"
