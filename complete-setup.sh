#!/bin/bash

echo "🚀 Complete Setup for Ethiopian Bossjob Platform"
echo "================================================="

# Step 1: Check if database exists
echo -e "\n1️⃣ Checking database..."
if PGPASSWORD='kasu@11@22' psql -h localhost -U sa -lqt | cut -d \| -f 1 | grep -qw bossjob_ethiopia; then
    echo "✅ Database exists"
else
    echo "📦 Creating database..."
    PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d postgres -c "CREATE DATABASE bossjob_ethiopia;" 2>/dev/null || echo "Database might already exist"
fi

# Step 2: Run migrations
echo -e "\n2️⃣ Running migrations..."
node src/database/migrate.js

if [ $? -ne 0 ]; then
    echo "❌ Migration failed"
    exit 1
fi

# Step 3: Seed database
echo -e "\n3️⃣ Seeding database..."
node src/database/seed.js

if [ $? -ne 0 ]; then
    echo "❌ Seeding failed"
    exit 1
fi

# Step 4: Start server
echo -e "\n4️⃣ Starting server..."
echo "================================================="
npm run dev
