#!/bin/bash

echo "🗄️  Setting up PostgreSQL Database"
echo "=================================="

# Check if PostgreSQL is running in Docker
if docker ps | grep -q bossjob_postgres; then
    echo "✅ PostgreSQL is running in Docker"
    
    # Create database in Docker
    echo "Creating database in Docker PostgreSQL..."
    docker exec bossjob_postgres psql -U sa -c "CREATE DATABASE bossjob_ethiopia;" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully!"
    else
        echo "⚠️  Database might already exist or there was an error"
        echo "Checking if database exists..."
        docker exec bossjob_postgres psql -U sa -lqt | cut -d \| -f 1 | grep -qw bossjob_ethiopia && echo "✅ Database exists" || echo "❌ Database does not exist"
    fi
    
elif pg_isready -h localhost -p 5432 &>/dev/null; then
    echo "✅ PostgreSQL is running locally"
    
    # Try to create database locally
    echo "Creating database locally..."
    
    # First try with your user
    PGPASSWORD='kasu@11@22' psql -h localhost -U sa -d postgres -c "CREATE DATABASE bossjob_ethiopia;" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully!"
    else
        echo "⚠️  Could not create database with user 'sa'"
        echo "Trying with postgres superuser..."
        
        # Try with sudo and postgres user
        sudo -u postgres psql -c "CREATE USER sa WITH PASSWORD 'kasu@11@22';" 2>/dev/null
        sudo -u postgres psql -c "CREATE DATABASE bossjob_ethiopia OWNER sa;" 2>&1
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bossjob_ethiopia TO sa;" 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Database created successfully with postgres superuser!"
        else
            echo "❌ Failed to create database"
            echo "Please create it manually:"
            echo "  sudo -u postgres psql"
            echo "  CREATE USER sa WITH PASSWORD 'kasu@11@22';"
            echo "  CREATE DATABASE bossjob_ethiopia OWNER sa;"
            echo "  GRANT ALL PRIVILEGES ON DATABASE bossjob_ethiopia TO sa;"
            echo "  \\q"
        fi
    fi
else
    echo "❌ PostgreSQL is not running"
    echo "Starting PostgreSQL in Docker..."
    docker compose up -d postgres
    sleep 10
    
    echo "Creating database..."
    docker exec bossjob_postgres psql -U sa -c "CREATE DATABASE bossjob_ethiopia;"
fi

echo ""
echo "✅ Database setup complete!"
