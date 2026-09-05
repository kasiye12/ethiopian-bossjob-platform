#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🚀 Quick Functionality Check"
echo "============================"

# 1. Server Status
echo -e "\n1️⃣ Server:"
curl -s $BASE_URL/health | python3 -m json.tool 2>/dev/null | head -5

# 2. Jobs Available
echo -e "\n2️⃣ Jobs:"
curl -s $BASE_URL/api/v1/jobs | python3 -c "
import json, sys
data = json.load(sys.stdin)
jobs = data.get('data', [])
print(f'   Total Jobs: {len(jobs)}')
if jobs:
    for job in jobs[:3]:
        print(f'   - {job.get(\"title\")} | {job.get(\"company_name\")} | ETB {job.get(\"salary_min_etb\", \"N/A\")}')
"

# 3. Companies
echo -e "\n3️⃣ Companies:"
curl -s $BASE_URL/api/v1/companies | python3 -c "
import json, sys
data = json.load(sys.stdin)
companies = data.get('data', [])
print(f'   Total Companies: {len(companies)}')
for comp in companies[:3]:
    print(f'   - {comp.get(\"company_name\")} | {comp.get(\"company_position\", \"N/A\")}')
"

# 4. Admin Login Test
echo -e "\n4️⃣ Admin Login:"
response=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251900000000","password":"Admin@123"}')
if echo "$response" | grep -q "Login successful"; then
    echo "   ✅ Admin login working"
else
    echo "   ❌ Admin login failed"
fi

# 5. Employer Login Test
echo -e "\n5️⃣ Employer Login:"
response=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251911111111","password":"Owner@123"}')
if echo "$response" | grep -q "Login successful"; then
    echo "   ✅ Employer login working"
else
    echo "   ❌ Employer login failed"
fi

# 6. Candidate Login Test
echo -e "\n6️⃣ Candidate Login:"
response=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251977777777","password":"Test@123"}')
if echo "$response" | grep -q "Login successful"; then
    echo "   ✅ Candidate login working"
else
    echo "   ❌ Candidate login failed"
fi

echo -e "\n============================"
echo "✅ Quick Check Complete!"
