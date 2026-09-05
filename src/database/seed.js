const bcrypt = require('bcrypt');
const pool = require('../config/database');
const logger = require('../utils/logger');

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🌱 Seeding database...');
        
        // Create admin user
        const adminPassword = await bcrypt.hash('Admin@123', 10);
        const adminResult = await client.query(
            `INSERT INTO users (phone_number, email, password_hash, full_name, role, is_fayda_verified, verification_status)
             VALUES ('+251900000000', 'admin@bossjob.et', $1, 'System Admin', 'admin', true, 'verified')
             ON CONFLICT (phone_number) DO NOTHING
             RETURNING id`,
            [adminPassword]
        );
        console.log('✅ Admin user created');
        
        // Create sample employer
        const employerPassword = await bcrypt.hash('Boss@123', 10);
        const employerResult = await client.query(
            `INSERT INTO users (phone_number, email, password_hash, full_name, role)
             VALUES ('+251922345678', 'employer@tech.com', $1, 'Sara Mohammed', 'boss')
             ON CONFLICT (phone_number) DO NOTHING
             RETURNING id`,
            [employerPassword]
        );
        console.log('✅ Employer user created');
        
        let employerId;
        if (employerResult.rows.length > 0) {
            employerId = employerResult.rows[0].id;
        } else {
            const existing = await client.query('SELECT id FROM users WHERE phone_number = $1', ['+251922345678']);
            employerId = existing.rows[0].id;
        }
        
        // Create sample company
        const companyResult = await client.query(
            `INSERT INTO companies (owner_id, company_name, tin_number, business_license_number, industry, company_size, region, sub_city, phone_number, email, description, is_verified, verification_status)
             VALUES ($1, 'Tech Solutions PLC', 'TIN12345678', 'BL12345', 'Technology', '11-50', 'Addis Ababa', 'Bole', '+251911223344', 'info@techsolutions.com', 'Leading technology company in Ethiopia', true, 'verified')
             ON CONFLICT (tin_number) DO NOTHING
             RETURNING id`,
            [employerId]
        );
        console.log('✅ Sample company created');
        
        let companyId;
        if (companyResult.rows.length > 0) {
            companyId = companyResult.rows[0].id;
        } else {
            const existing = await client.query('SELECT id FROM companies WHERE tin_number = $1', ['TIN12345678']);
            companyId = existing.rows[0].id;
        }
        
        // Create sample jobs
        const jobs = [
            {
                title: 'Senior Software Developer',
                description: 'We are looking for an experienced software developer to join our team.',
                requirements: '5+ years experience in web development, proficiency in JavaScript, Node.js',
                job_type: 'Full-time',
                category: 'IT',
                region: 'Addis Ababa',
                sub_city: 'Bole',
                salary_min_etb: 40000,
                salary_max_etb: 60000,
                experience_level: '5-10 Years',
                education_level_required: 'Bachelor'
            },
            {
                title: 'Marketing Manager',
                description: 'Lead our marketing team and drive growth.',
                requirements: '3+ years in marketing, strong communication skills',
                job_type: 'Full-time',
                category: 'Sales',
                region: 'Addis Ababa',
                sub_city: 'Bole',
                salary_min_etb: 25000,
                salary_max_etb: 35000,
                experience_level: '3-5 Years',
                education_level_required: 'Bachelor'
            },
            {
                title: 'Accountant',
                description: 'Manage financial records and prepare reports.',
                requirements: 'Degree in Accounting, 2+ years experience',
                job_type: 'Full-time',
                category: 'Finance',
                region: 'Addis Ababa',
                sub_city: 'Bole',
                salary_min_etb: 15000,
                salary_max_etb: 25000,
                experience_level: '1-2 Years',
                education_level_required: 'Bachelor'
            }
        ];
        
        for (const job of jobs) {
            const slug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
            await client.query(
                `INSERT INTO jobs (company_id, posted_by, title, slug, description, requirements, job_type, category, region, sub_city, salary_min_etb, salary_max_etb, experience_level, education_level_required, status, published_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', NOW())
                 ON CONFLICT (slug) DO NOTHING`,
                [companyId, employerId, job.title, slug, job.description, job.requirements, job.job_type, job.category, job.region, job.sub_city, job.salary_min_etb, job.salary_max_etb, job.experience_level, job.education_level_required]
            );
        }
        console.log('✅ Sample jobs created');
        
        await client.query('COMMIT');
        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Test Credentials:');
        console.log('   Admin: +251900000000 / Admin@123');
        console.log('   Employer: +251922345678 / Boss@123');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase().catch(console.error);
