const bcrypt = require('bcrypt');
const pool = require('../config/database');
const encryption = require('../utils/encryption');
const config = require('../config');
const logger = require('../utils/logger');

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        logger.info('Seeding database...');
        
        // Create admin user
        const adminPassword = await bcrypt.hash('Admin@123', config.bcrypt.saltRounds);
        const adminPhone = encryption.encrypt('+251911111111');
        
        const adminResult = await client.query(
            `INSERT INTO users (phone_number, email, password_hash, full_name, role, is_fayda_verified, verification_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (phone_number) DO NOTHING
             RETURNING id`,
            [adminPhone, 'admin@bossjob.et', adminPassword, 'System Admin', 'super_admin', true, 'verified']
        );
        
        let adminId;
        if (adminResult.rows.length > 0) {
            adminId = adminResult.rows[0].id;
        } else {
            const existingAdmin = await client.query(
                'SELECT id FROM users WHERE phone_number = $1',
                [adminPhone]
            );
            adminId = existingAdmin.rows[0].id;
        }
        
        // Create sample company
        const companyTin = 'TIN12345678';
        const companyResult = await client.query(
            `INSERT INTO companies (owner_id, company_name, tin_number, trade_license_url, industry, company_size, region, sub_city, is_verified, verification_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (tin_number) DO NOTHING
             RETURNING id`,
            [adminId, 'Sample Company Ltd', companyTin, 'https://example.com/license.pdf', 'Technology', '51-200', 'Addis Ababa', 'Bole', true, 'verified']
        );
        
        logger.info('✅ Database seeded successfully');
        
        await client.query('COMMIT');
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Failed to seed database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    seedDatabase().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = seedDatabase;
