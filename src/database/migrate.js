const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Create migrations table if not exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE,
                executed_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        
        // Get migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
        
        // Get already executed migrations
        const { rows: executedMigrations } = await client.query(
            'SELECT filename FROM migrations'
        );
        const executedSet = new Set(executedMigrations.map(m => m.filename));
        
        // Run pending migrations
        for (const file of migrationFiles) {
            if (!executedSet.has(file)) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(
                    path.join(migrationsDir, file), 
                    'utf8'
                );
                
                await client.query(sql);
                await client.query(
                    'INSERT INTO migrations (filename) VALUES ($1)',
                    [file]
                );
                
                console.log(`✅ Migration completed: ${file}`);
            }
        }
        
        await client.query('COMMIT');
        console.log('✅ All migrations completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runMigrations().catch(console.error);
}

module.exports = { runMigrations, pool };
