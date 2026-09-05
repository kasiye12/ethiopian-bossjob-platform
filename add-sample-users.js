const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'bossjob_ethiopia',
    user: 'sa',
    password: 'kasu@11@22',
});

async function addSampleUsers() {
    const client = await pool.connect();
    
    try {
        const users = [
            { phone: '+251900000000', email: 'admin@bossjob.et', password: 'Admin@123', name: 'System Admin', role: 'admin' },
            { phone: '+251911111111', email: 'owner@company.com', password: 'Owner@123', name: 'Abebe Bekele', role: 'boss' },
            { phone: '+251922222222', email: 'founder@company.com', password: 'Founder@123', name: 'Sara Mohammed', role: 'boss' },
            { phone: '+251933333333', email: 'ceo@company.com', password: 'Ceo@12345', name: 'Daniel Tadesse', role: 'boss' },
            { phone: '+251944444444', email: 'hrdirector@company.com', password: 'HrDir@123', name: 'Tigist Haile', role: 'boss' },
            { phone: '+251955555555', email: 'hrmanager@company.com', password: 'HrMgr@123', name: 'Yonas Girma', role: 'boss' },
            { phone: '+251966666666', email: 'hrofficer@company.com', password: 'HrOff@123', name: 'Meron Alemu', role: 'boss' },
            { phone: '+251977777777', email: 'kasiye@email.com', password: 'Test@123', name: 'Kasiye Taye', role: 'candidate' },
            { phone: '+251988888888', email: 'hana@email.com', password: 'Test@123', name: 'Hana Tesfaye', role: 'candidate' },
            { phone: '+251999999999', email: 'samuel@email.com', password: 'Test@123', name: 'Samuel Worku', role: 'candidate' },
            { phone: '+251910101010', email: 'liya@email.com', password: 'Test@123', name: 'Liya Kebede', role: 'candidate' },
            { phone: '+251920202020', email: 'dawit@email.com', password: 'Test@123', name: 'Dawit Mengistu', role: 'candidate' },
        ];
        
        console.log('🌱 Adding sample users...\n');
        
        for (const user of users) {
            const hash = await bcrypt.hash(user.password, 10);
            
            // Check if exists
            const check = await client.query('SELECT id FROM users WHERE phone_number = $1', [user.phone]);
            
            if (check.rows.length > 0) {
                // Update existing
                await client.query(
                    'UPDATE users SET password_hash = $1, full_name = $2, role = $3, email = $4, is_active = true WHERE phone_number = $5',
                    [hash, user.name, user.role, user.email, user.phone]
                );
                console.log(`   ✅ Updated: ${user.name} (${user.role})`);
            } else {
                // Insert new
                await client.query(
                    `INSERT INTO users (phone_number, email, password_hash, full_name, role, is_active, verification_status)
                     VALUES ($1, $2, $3, $4, $5, true, 'verified')`,
                    [user.phone, user.email, hash, user.name, user.role]
                );
                console.log(`   ✅ Created: ${user.name} (${user.role})`);
            }
        }
        
        // Verify count
        const count = await client.query('SELECT COUNT(*) FROM users');
        console.log(`\n📊 Total users: ${count.rows[0].count}`);
        console.log('\n✅ Sample users added successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

addSampleUsers();
