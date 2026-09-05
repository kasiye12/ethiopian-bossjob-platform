const pool = require('./src/config/database');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connection successful!');
        console.log('Current time:', result.rows[0].current_time);
        
        // Test creating a table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_connection (
                id SERIAL PRIMARY KEY,
                test_time TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Table creation successful!');
        
        // Test inserting data
        await pool.query('INSERT INTO test_connection DEFAULT VALUES');
        console.log('✅ Data insertion successful!');
        
        // Clean up
        await pool.query('DROP TABLE test_connection');
        console.log('✅ Cleanup successful!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testConnection();
