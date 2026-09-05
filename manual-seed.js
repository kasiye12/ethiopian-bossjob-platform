const bcrypt = require('bcrypt');
const pool = require('./src/config/database');

async function manualSeed() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('Creating sample data...');
        
        // Create employer user
        const password = await bcrypt.hash('Boss@123', 10);
        const employerResult = await client.query(
            `INSERT INTO users (phone_number, email, password_hash, full_name, role)
             VALUES ('+251922345678', 'employer@tech.com', $1, 'Sara Mohammed', 'boss')
             ON CONFLICT (phone_number) DO UPDATE SET role = 'boss'
             RETURNING id`,
            [password]
        );
        
        const employerId = employerResult.rows[0].id;
        console.log('✅ Employer user:', employerId);
        
        // Create company
        const companyResult = await client.query(
            `INSERT INTO companies (owner_id, company_name, tin_number, business_license_number, industry, company_size, region, sub_city, phone_number, email, description, is_verified, verification_status)
             VALUES ($1, 'Tech Solutions PLC', 'TIN12345678', 'BL12345', 'Technology', '11-50', 'Addis Ababa', 'Bole', '+251911223344', 'info@techsolutions.com', 'Leading technology company in Ethiopia', true, 'verified')
             ON CONFLICT (tin_number) DO UPDATE SET is_verified = true
             RETURNING id`,
            [employerId]
        );
        
        const companyId = companyResult.rows[0].id;
        console.log('✅ Company:', companyId);
        
        // Create jobs
        const jobs = [
            {
                title: 'Senior Software Developer',
                description: 'We are looking for an experienced software developer to join our team. Must have strong problem-solving skills.',
                requirements: '5+ years experience in web development\nProficiency in JavaScript, Node.js, React\nExperience with PostgreSQL',
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
                description: 'Lead our marketing team and drive growth. Develop marketing strategies.',
                requirements: '3+ years in marketing\nStrong communication skills\nExperience with digital marketing',
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
                title: 'Junior Accountant',
                description: 'Manage financial records and prepare reports. Work with senior accountants.',
                requirements: 'Degree in Accounting\n2+ years experience\nKnowledge of Ethiopian tax laws',
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
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', NOW())`,
                [companyId, employerId, job.title, slug, job.description, job.requirements, job.job_type, job.category, job.region, job.sub_city, job.salary_min_etb, job.salary_max_etb, job.experience_level, job.education_level_required]
            );
            console.log('✅ Job created:', job.title);
        }
        
        await client.query('COMMIT');
        console.log('\n✅ Sample data created successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

manualSeed();
