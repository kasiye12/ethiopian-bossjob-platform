const pool = require('../config/database');

async function createAdditionalTables() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('📦 Creating additional tables...');
        
        // Saved Talents Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS saved_talents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                talent_id UUID REFERENCES users(id) ON DELETE CASCADE,
                job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(employer_id, talent_id)
            )
        `);
        console.log('✅ Saved talents table created');
        
        // Viewed Talents Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS viewed_talents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                talent_id UUID REFERENCES users(id) ON DELETE CASCADE,
                viewed_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(employer_id, talent_id)
            )
        `);
        console.log('✅ Viewed talents table created');
        
        // Interviews Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS interviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
                job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
                interview_date DATE NOT NULL,
                interview_time TIME NOT NULL,
                interview_type VARCHAR(20) DEFAULT 'in-person',
                location VARCHAR(255),
                notes TEXT,
                calendar_type VARCHAR(20) DEFAULT 'gregorian',
                status VARCHAR(20) DEFAULT 'scheduled',
                feedback TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Interviews table created');
        
        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_saved_talents_employer ON saved_talents(employer_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_viewed_talents_employer ON viewed_talents(employer_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_interviews_employer ON interviews(employer_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id)');
        console.log('✅ Indexes created');
        
        await client.query('COMMIT');
        console.log('\n✅ Additional tables created successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createAdditionalTables().catch(console.error);
