const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bossjob_ethiopia',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'kasu@11@22',
});

async function createTables() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('📦 Creating database tables...');
        
        // Users Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                phone_number VARCHAR(15) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE,
                password_hash VARCHAR(255),
                full_name VARCHAR(255),
                role VARCHAR(20) DEFAULT 'candidate',
                fayda_id_number VARCHAR(12) UNIQUE,
                is_fayda_verified BOOLEAN DEFAULT FALSE,
                verification_status VARCHAR(20) DEFAULT 'unverified',
                preferred_language VARCHAR(10) DEFAULT 'am',
                profile_picture_url TEXT,
                date_of_birth DATE,
                gender VARCHAR(10),
                is_active BOOLEAN DEFAULT TRUE,
                last_login_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Users table created');
        
        // Candidate Profiles Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidate_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                profession_title VARCHAR(255),
                years_of_experience INT DEFAULT 0,
                education_level VARCHAR(50),
                current_location VARCHAR(255),
                expected_salary_min NUMERIC(12,2),
                expected_salary_max NUMERIC(12,2),
                notice_period_days INT,
                skills TEXT[],
                languages TEXT[],
                cv_url TEXT,
                summary TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Candidate profiles table created');
        
        // Companies Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID REFERENCES users(id),
                company_name VARCHAR(255) NOT NULL,
                tin_number VARCHAR(20) UNIQUE NOT NULL,
                trade_license_url TEXT,
                business_license_number VARCHAR(100),
                company_logo_url TEXT,
                industry VARCHAR(100),
                company_size VARCHAR(50),
                website VARCHAR(255),
                description TEXT,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_status VARCHAR(20) DEFAULT 'pending',
                region VARCHAR(100) NOT NULL,
                zone VARCHAR(100),
                sub_city VARCHAR(100),
                woreda VARCHAR(20),
                house_number VARCHAR(50),
                phone_number VARCHAR(15),
                email VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Companies table created');
        
        // Jobs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
                posted_by UUID REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE,
                description TEXT NOT NULL,
                requirements TEXT,
                responsibilities TEXT,
                job_type VARCHAR(50) NOT NULL,
                category VARCHAR(100) NOT NULL,
                sub_category VARCHAR(100),
                region VARCHAR(100) NOT NULL,
                zone VARCHAR(100),
                sub_city VARCHAR(100),
                woreda VARCHAR(20),
                salary_min_etb NUMERIC(12,2),
                salary_max_etb NUMERIC(12,2),
                salary_period VARCHAR(20) DEFAULT 'monthly',
                is_salary_negotiable BOOLEAN DEFAULT FALSE,
                experience_level VARCHAR(50),
                education_level_required VARCHAR(50),
                number_of_positions INT DEFAULT 1,
                deadline_date DATE,
                status VARCHAR(20) DEFAULT 'active',
                is_featured BOOLEAN DEFAULT FALSE,
                is_urgent BOOLEAN DEFAULT FALSE,
                views_count INT DEFAULT 0,
                applications_count INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                published_at TIMESTAMPTZ DEFAULT NOW(),
                closed_at TIMESTAMPTZ
            )
        `);
        console.log('✅ Jobs table created');
        
        // Chat Threads Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS chat_threads (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
                candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
                boss_id UUID REFERENCES users(id) ON DELETE CASCADE,
                thread_status VARCHAR(50) DEFAULT 'open',
                last_message_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(job_id, candidate_id)
            )
        `);
        console.log('✅ Chat threads table created');
        
        // Messages Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
                sender_id UUID REFERENCES users(id),
                message_type VARCHAR(20) DEFAULT 'text',
                body TEXT,
                attachment_url TEXT,
                metadata JSONB,
                read_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Messages table created');
        
        // Applications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
                candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'applied',
                cover_letter TEXT,
                expected_salary NUMERIC(12,2),
                available_from DATE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(job_id, candidate_id)
            )
        `);
        console.log('✅ Applications table created');
        
        // Notifications Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50),
                title VARCHAR(255),
                body TEXT,
                data JSONB,
                read_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Notifications table created');
        
        // Payment Transactions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID REFERENCES companies(id),
                user_id UUID REFERENCES users(id),
                amount NUMERIC(12,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'ETB',
                payment_method VARCHAR(50),
                status VARCHAR(20) DEFAULT 'pending',
                transaction_reference VARCHAR(100) UNIQUE,
                payment_provider VARCHAR(50),
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Payment transactions table created');
        
        // Credit Transactions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS credit_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                company_id UUID REFERENCES companies(id),
                amount INT NOT NULL,
                transaction_type VARCHAR(20) NOT NULL,
                reference_type VARCHAR(50),
                reference_id UUID,
                balance_after INT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Credit transactions table created');
        
        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_region ON jobs(region)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at DESC)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_chat_threads_candidate ON chat_threads(candidate_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_chat_threads_boss ON chat_threads(boss_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)');
        console.log('✅ Indexes created');
        
        await client.query('COMMIT');
        console.log('\n✅ All tables created successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
createTables().catch(console.error);
