#!/bin/bash

BASE_URL="http://localhost:3001"

echo "🎯 Testing User Roles and Permissions"
echo "======================================"

# Define users with their expected roles
declare -A users=(
    ["+251900000000"]="Admin@123:admin"
    ["+251911111111"]="Owner@123:boss"
    ["+251922222222"]="Founder@123:boss"
    ["+251933333333"]="Ceo@12345:boss"
    ["+251944444444"]="HrDir@123:boss"
    ["+251955555555"]="HrMgr@123:boss"
    ["+251966666666"]="HrOff@123:boss"
    ["+251977777777"]="Test@123:candidate"
    ["+251988888888"]="Test@123:candidate"
    ["+251999999999"]="Test@123:candidate"
)

for phone in "${!users[@]}"; do
    IFS=':' read -r password expectedRole <<< "${users[$phone]}"
    
    echo -e "\n📱 Testing: $phone"
    echo "   Expected Role: $expectedRole"
    
    # Login
    loginResponse=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"phone_number\":\"$phone\",\"password\":\"$password\"}")
    
    if echo "$loginResponse" | grep -q "Login successful"; then
        token=$(echo "$loginResponse" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        actualRole=$(echo "$loginResponse" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
        
        echo "   ✅ Login: SUCCESS"
        echo "   Actual Role: $actualRole"
        
        if [ "$actualRole" == "$expectedRole" ]; then
            echo "   ✅ Role Match: CORRECT"
        else
            echo "   ❌ Role Match: MISMATCH"
        fi
        
        # Test role-specific endpoints
        case $expectedRole in
            "admin")
                echo -e "\n   🔍 Testing Admin Permissions:"
                adminRes=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/admin/users \
                    -H "Authorization: Bearer $token")
                echo "   Admin Users Endpoint: $adminRes"
                ;;
            "boss")
                echo -e "\n   🔍 Testing Employer Permissions:"
                companyRes=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/companies/my \
                    -H "Authorization: Bearer $token")
                echo "   Company Endpoint: $companyRes"
                
                talentRes=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/talents/search \
                    -H "Authorization: Bearer $token")
                echo "   Talent Search Endpoint: $talentRes"
                ;;
            "candidate")
                echo -e "\n   🔍 Testing Candidate Permissions:"
                profileRes=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/candidates/my-profile \
                    -H "Authorization: Bearer $token")
                echo "   Profile Endpoint: $profileRes"
                
                jobsRes=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/v1/jobs)
                echo "   Jobs List Endpoint: $jobsRes"
                ;;
        esac
        
    else
        message=$(echo "$loginResponse" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        echo "   ❌ Login: FAILED ($message)"
    fi
done

echo -e "\n======================================"
echo "✅ Role Testing Complete!"
