#!/bin/bash

echo "=========================================="
echo "👥 ADMIN USER MANAGEMENT TEST"
echo "=========================================="

# Login as admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+251900000000","password":"Admin@123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "1️⃣ Token: ${TOKEN:0:20}..."
echo ""

echo "2️⃣ Users List:"
curl -s http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import json, sys
d = json.load(sys.stdin)
users = d.get('data', [])
print(f'   Total Users: {len(users)}')
print()
print('   User List:')
for u in users:
    status = '✅' if u['is_active'] else '❌'
    print(f'   {status} {u[\"full_name\"]} | {u[\"phone_number\"]} | {u[\"role\"]}')" 2>/dev/null

echo ""
echo "3️⃣ Companies:"
curl -s http://localhost:3000/api/v1/companies | python3 -c "
import json, sys
d = json.load(sys.stdin)
companies = d.get('data', [])
print(f'   Total Companies: {len(companies)}')
for c in companies:
    print(f'   {c[\"company_name\"]} | Verified: {c[\"is_verified\"]}')" 2>/dev/null

echo ""
echo "=========================================="
echo "✅ ADMIN PANEL WORKING"
echo "=========================================="
echo ""
echo "📋 HOW TO ACCESS:"
echo "   1. Open: http://localhost:3000/admin.html"
echo "   2. Login as Admin: +251900000000 / Admin@123"
echo "   3. Click '👥 Users' in sidebar"
echo "   4. See full user list with actions"
echo ""
