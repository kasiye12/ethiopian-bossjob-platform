const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function seedUsersOnly() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🌱 Seeding users (without encryption)...\n');
        
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
        
        const userIds = {};
        
        for (const user of users) {
            const passwordHash = await bcrypt.hash(user.password, 10);
            
            // Check if user exists
            const existing = await client.query(
                'SELECT id FROM users WHERE phone_number = $1',
                [user.phone]
            );
            
            if (existing.rows.length > 0) {
                // Update existing user
                await client.query(
                    `UPDATE users SET password_hash = $1, full_name = $2, role = $3, email = $4, is_active = true WHERE phone_number = $5`,
                    [passwordHash, user.name, user.role, user.email, user.phone]
                );
                userIds[user.phone] = existing.rows[0].id;
                console.log(`   ✅ Updated: ${user.name} (${user.role})`);
            } else {
                // Insert new user
                const result = await client.query(
                    `INSERT INTO users (phone_number, email, password_hash, full_name, role, is_active, verification_status)
                     VALUES ($1, $2, $3, $4, $5, true, 'verified')
                     RETURNING id`,
                    [user.phone, user.email, passwordHash, user.name, user.role]
                );
                userIds[user.phone] = result.rows[0].id;
                console.log(`   ✅ Created: ${user.name} (${user.role})`);
            }
        }
        
        // Create candidate profiles for candidates
        console.log('\n📦 Creating candidate profiles...');
        
        const candidates = [
            { userId: userIds['+251977777777'], title: 'Data Encoder', experience: 3, education: 'Bachelor', location: 'Addis Ababa, Bole', skills: ['Data Entry', 'Microsoft Excel', 'Typing'] },
            { userId: userIds['+251988888888'], title: 'Software Developer', experience: 5, education: 'Bachelor', location: 'Addis Ababa, Kazanchis', skills: ['JavaScript', 'Node.js', 'React'] },
            { userId: userIds['+251999999999'], title: 'Accountant', experience: 4, education: 'Bachelor', location: 'Addis Ababa, Piassa', skills: ['Accounting', 'Excel', 'Tax'] },
            { userId: userIds['+251910101010'], title: 'Marketing Specialist', experience: 3, education: 'Master', location: 'Addis Ababa, Bole', skills: ['Digital Marketing', 'SEO', 'Content'] },
            { userId: userIds['+251920202020'], title: 'Project Manager', experience: 7, education: 'Master', location: 'Addis Ababa, CMC', skills: ['Project Management', 'Agile', 'Scrum'] },
        ];
        
        for (const candidate of candidates) {
            await client.query(
                `INSERT INTO candidate_profiles (user_id, profession_title, years_of_experience, education_level, current_location, skills, summary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (user_id) DO UPDATE SET profession_title = $2, years_of_experience = $3, education_level = $4, current_location = $5, skills = $6`,
                [candidate.userId, candidate.title, candidate.experience, candidate.education, candidate.location, candidate.skills, `Experienced ${candidate.title}`]
            );
        }
        console.log('   ✅ Candidate profiles created');
        
        // Create companies
        console.log('\n📦 Creating companies...');
        
        const companies = [
            { ownerId: userIds['+251911111111'], name: 'Ethio Tech Solutions PLC', tin: 'TIN10001', industry: 'Technology', position: 'Owner' },
            { ownerId: userIds['+251922222222'], name: 'Habesha Innovations', tin: 'TIN10002', industry: 'Technology', position: 'Founder' },
            { ownerId: userIds['+251933333333'], name: 'Addis Digital Group', tin: 'TIN10003', industry: 'E-commerce', position: 'CEO' },
            { ownerId: userIds['+251944444444'], name: 'Ethiopian Finance Corp', tin: 'TIN10004', industry: 'Finance', position: 'HR Director' },
            { ownerId: userIds['+251955555555'], name: 'Green Valley Trading', tin: 'TIN10005', industry: 'Retail', position: 'HR Manager' },
            { ownerId: userIds['+251966666666'], name: 'Blue Nile Services', tin: 'TIN10006', industry: 'Services', position: 'HR Officer' },
        ];
        
        const companyIds = {};
        
        for (const company of companies) {
            const existing = await client.query(
                'SELECT id FROM companies WHERE tin_number = $1',
                [company.tin]
            );
            
            if (existing.rows.length > 0) {
                companyIds[company.name] = existing.rows[0].id;
            } else {
                const result = await client.query(
                    `INSERT INTO companies (owner_id, company_name, tin_number, business_license_number, industry, company_size, region, sub_city, phone_number, email, description, is_verified, verification_status, company_position)
                     VALUES ($1, $2, $3, $4, $5, '11-50', 'Addis Ababa', 'Bole', '+251911223344', $6, $7, true, 'verified', $8)
                     RETURNING id`,
                    [company.ownerId, company.name, company.tin, `BL-${company.tin}`, company.industry, `info@${company.name.toLowerCase().replace(/\s/g, '')}.com`, `Leading ${company.industry} company`, company.position]
                );
                companyIds[company.name] = result.rows[0].id;
            }
            console.log(`   ✅ ${company.name} (${company.position})`);
        }
        
        // Create jobs
        console.log('\n📦 Creating jobs...');
        
        const jobs = [
            { company: 'Ethio Tech Solutions PLC', title: 'Data Encoder', salaryMin: 15000, salaryMax: 20000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Ethio Tech Solutions PLC', title: 'Senior Go Backend Engineer', salaryMin: 20000, salaryMax: 35000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Habesha Innovations', title: 'Java Developer', salaryMin: 25000, salaryMax: 30000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Addis Digital Group', title: 'Backend Developer', salaryMin: null, salaryMax: null, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Ethio Tech Solutions PLC', title: 'C++ Developer', salaryMin: 3000, salaryMax: 5000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Addis Digital Group', title: 'AI Application Engineer', salaryMin: 3000, salaryMax: 6000, type: 'Remote', category: 'IT', experience: '5-10 Yrs Exp', education: 'Edu not required' },
            { company: 'Habesha Innovations', title: 'SEO Technical Engineer', salaryMin: 2500, salaryMax: 5000, type: 'Remote', category: 'IT', experience: '5-10 Yrs Exp', education: 'Bachelor' },
            { company: 'Ethio Tech Solutions PLC', title: 'Senior Go Developer', salaryMin: 3000, salaryMax: 5000, type: 'Remote', category: 'IT', experience: '5-10 Yrs Exp', education: 'Bachelor' },
            { company: 'Addis Digital Group', title: 'Java Developer', salaryMin: 3400, salaryMax: 5000, type: 'Remote', category: 'IT', experience: '5-10 Yrs Exp', education: 'Bachelor' },
            { company: 'Ethiopian Finance Corp', title: 'Business Development Manager', salaryMin: null, salaryMax: null, type: 'Remote', category: 'Sales', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Green Valley Trading', title: 'SEO Specialist', salaryMin: 1500, salaryMax: 3000, type: 'Remote', category: 'Marketing', experience: '3-5 Yrs Exp', education: 'Diploma' },
            { company: 'Blue Nile Services', title: 'SEO Administrator', salaryMin: 1500, salaryMax: 3000, type: 'Remote', category: 'Marketing', experience: '3-5 Yrs Exp', education: 'Diploma' },
            { company: 'Ethiopian Finance Corp', title: 'Senior Accountant', salaryMin: 20000, salaryMax: 30000, type: 'On-site', category: 'Finance', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Green Valley Trading', title: 'Sales Representative', salaryMin: 10000, salaryMax: 15000, type: 'On-site', category: 'Sales', experience: '1-3 Yrs Exp', education: 'Diploma' },
            { company: 'Blue Nile Services', title: 'Customer Service Officer', salaryMin: 8000, salaryMax: 12000, type: 'On-site', category: 'Customer Service', experience: '1-3 Yrs Exp', education: 'Diploma' },
        ];
        
        for (const job of jobs) {
            const companyId = companyIds[job.company];
            const slug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            
            await client.query(
                `INSERT INTO jobs (company_id, posted_by, title, slug, description, requirements, job_type, category, region, sub_city, salary_min_etb, salary_max_etb, experience_level, education_level_required, status, views_count, applications_count, published_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Addis Ababa', 'Bole', $9, $10, $11, $12, 'active', $13, $14, NOW())
                 ON CONFLICT (slug) DO NOTHING`,
                [companyId, userIds['+251911111111'], job.title, slug, `We are looking for a talented ${job.title}`, `Requirements for ${job.title}`, job.type, job.category, job.salaryMin, job.salaryMax, job.experience, job.education, Math.floor(Math.random() * 500) + 100, Math.floor(Math.random() * 50)]
            );
        }
        console.log('   ✅ 15 jobs created');
        
        await client.query('COMMIT');
        
        console.log('\n========================================');
        console.log('✅ Database seeded successfully!');
        console.log('========================================');
        console.log('\n📋 Test Credentials (ALL WORKING):');
        console.log('----------------------------------');
        console.log('   Admin: +251900000000 / Admin@123');
        console.log('   Owner: +251911111111 / Owner@123');
        console.log('   Founder: +251922222222 / Founder@123');
        console.log('   CEO: +251933333333 / Ceo@12345');
        console.log('   HR Director: +251944444444 / HrDir@123');
        console.log('   HR Manager: +251955555555 / HrMgr@123');
        console.log('   HR Officer: +251966666666 / HrOff@123');
        console.log('   Candidate 1: +251977777777 / Test@123');
        console.log('   Candidate 2: +251988888888 / Test@123');
        console.log('   Candidate 3: +251999999999 / Test@123');
        console.log('========================================\n');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedUsersOnly().catch(console.error);
