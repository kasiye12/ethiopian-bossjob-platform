const pool = require('../config/database');

async function addPositionsTable() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('📦 Adding company positions...');
        
        // Add position column to companies table
        await client.query(`
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS company_position VARCHAR(50) DEFAULT 'HR Manager'
        `);
        console.log('✅ Added company_position column');
        
        // Add position column to users table for company role
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS company_position VARCHAR(50)
        `);
        console.log('✅ Added company_position to users');
        
        // Create company_positions table for reference
        await client.query(`
            CREATE TABLE IF NOT EXISTS company_positions (
                id SERIAL PRIMARY KEY,
                position_name VARCHAR(50) UNIQUE NOT NULL,
                position_level INT DEFAULT 1,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        console.log('✅ Created company_positions table');
        
        // Insert default positions
        const positions = [
            { name: 'Owner', level: 10, description: 'Company owner with full access' },
            { name: 'Founder', level: 10, description: 'Company founder with full access' },
            { name: 'CEO', level: 9, description: 'Chief Executive Officer' },
            { name: 'HR Director', level: 8, description: 'Human Resources Director' },
            { name: 'HR Manager', level: 7, description: 'Human Resources Manager' },
            { name: 'HR Officer', level: 6, description: 'Human Resources Officer' },
        ];
        
        for (const pos of positions) {
            await client.query(
                `INSERT INTO company_positions (position_name, position_level, description)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (position_name) DO NOTHING`,
                [pos.name, pos.level, pos.description]
            );
        }
        console.log('✅ Inserted default positions');
        
        await client.query('COMMIT');
        console.log('\n✅ Positions migration completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addPositionsTable().catch(console.error);
