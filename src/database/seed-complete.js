const bcrypt = require('bcrypt');
const pool = require('../config/database');
const logger = require('../utils/logger');

async function seedCompleteData() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🌱 Seeding comprehensive sample data...\n');
        
        // ==================== USERS ====================
        console.log('📦 Creating users...');
        
        const users = [
            { phone: '+251900000000', email: 'admin@bossjob.et', password: 'Admin@123', name: 'System Admin', role: 'admin', gender: 'Male' },
            { phone: '+251911111111', email: 'owner@company.com', password: 'Owner@123', name: 'Abebe Bekele', role: 'boss', gender: 'Male' },
            { phone: '+251922222222', email: 'founder@company.com', password: 'Founder@123', name: 'Sara Mohammed', role: 'boss', gender: 'Female' },
            { phone: '+251933333333', email: 'ceo@company.com', password: 'Ceo@12345', name: 'Daniel Tadesse', role: 'boss', gender: 'Male' },
            { phone: '+251944444444', email: 'hrdirector@company.com', password: 'HrDir@123', name: 'Tigist Haile', role: 'boss', gender: 'Female' },
            { phone: '+251955555555', email: 'hrmanager@company.com', password: 'HrMgr@123', name: 'Yonas Girma', role: 'boss', gender: 'Male' },
            { phone: '+251966666666', email: 'hrofficer@company.com', password: 'HrOff@123', name: 'Meron Alemu', role: 'boss', gender: 'Female' },
            { phone: '+251977777777', email: 'candidate1@email.com', password: 'Test@123', name: 'Kasiye Taye', role: 'candidate', gender: 'Male' },
            { phone: '+251988888888', email: 'candidate2@email.com', password: 'Test@123', name: 'Hana Tesfaye', role: 'candidate', gender: 'Female' },
            { phone: '+251999999999', email: 'candidate3@email.com', password: 'Test@123', name: 'Samuel Worku', role: 'candidate', gender: 'Male' },
            { phone: '+251910101010', email: 'candidate4@email.com', password: 'Test@123', name: 'Liya Kebede', role: 'candidate', gender: 'Female' },
            { phone: '+251920202020', email: 'candidate5@email.com', password: 'Test@123', name: 'Dawit Mengistu', role: 'candidate', gender: 'Male' },
        ];
        
        const userIds = {};
        
        for (const user of users) {
            const passwordHash = await bcrypt.hash(user.password, 10);
            const result = await client.query(
                `INSERT INTO users (phone_number, email, password_hash, full_name, role, gender, is_active, verification_status)
                 VALUES ($1, $2, $3, $4, $5, $6, true, 'verified')
                 ON CONFLICT (phone_number) DO UPDATE SET role = $5, is_active = true
                 RETURNING id`,
                [user.phone, user.email, passwordHash, user.name, user.role, user.gender]
            );
            userIds[user.phone] = result.rows[0].id;
            console.log(`   ✅ ${user.name} (${user.role})`);
        }
        
        // ==================== CANDIDATE PROFILES ====================
        console.log('\n📦 Creating candidate profiles...');
        
        const candidates = [
            { userId: userIds['+251977777777'], title: 'Data Encoder', experience: 3, education: 'Bachelor', location: 'Addis Ababa, Bole', skills: ['Data Entry', 'Microsoft Excel', 'Typing', 'Database Management'] },
            { userId: userIds['+251988888888'], title: 'Software Developer', experience: 5, education: 'Bachelor', location: 'Addis Ababa, Kazanchis', skills: ['JavaScript', 'Node.js', 'React', 'PostgreSQL'] },
            { userId: userIds['+251999999999'], title: 'Accountant', experience: 4, education: 'Bachelor', location: 'Addis Ababa, Piassa', skills: ['Accounting', 'Excel', 'Tax', 'Financial Analysis'] },
            { userId: userIds['+251910101010'], title: 'Marketing Specialist', experience: 3, education: 'Master', location: 'Addis Ababa, Bole', skills: ['Digital Marketing', 'SEO', 'Content Writing', 'Social Media'] },
            { userId: userIds['+251920202020'], title: 'Project Manager', experience: 7, education: 'Master', location: 'Addis Ababa, CMC', skills: ['Project Management', 'Agile', 'Scrum', 'Leadership'] },
        ];
        
        for (const candidate of candidates) {
            await client.query(
                `INSERT INTO candidate_profiles (user_id, profession_title, years_of_experience, education_level, current_location, expected_salary_min, expected_salary_max, skills, summary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (user_id) DO NOTHING`,
                [candidate.userId, candidate.title, candidate.experience, candidate.education, candidate.location, 15000, 35000, candidate.skills, `Experienced ${candidate.title} with ${candidate.experience} years of experience`]
            );
            console.log(`   ✅ ${candidate.title} profile created`);
        }
        
        // ==================== COMPANIES ====================
        console.log('\n📦 Creating companies...');
        
        const companies = [
            { ownerId: userIds['+251911111111'], name: 'Ethio Tech Solutions PLC', tin: 'TIN10001', industry: 'Technology', size: '51-200', region: 'Addis Ababa', subCity: 'Bole', position: 'Owner', verified: true },
            { ownerId: userIds['+251922222222'], name: 'Habesha Innovations', tin: 'TIN10002', industry: 'Technology', size: '11-50', region: 'Addis Ababa', subCity: 'Kazanchis', position: 'Founder', verified: true },
            { ownerId: userIds['+251933333333'], name: 'Addis Digital Group', tin: 'TIN10003', industry: 'E-commerce', size: '201-500', region: 'Addis Ababa', subCity: 'Bole', position: 'CEO', verified: true },
            { ownerId: userIds['+251944444444'], name: 'Ethiopian Finance Corp', tin: 'TIN10004', industry: 'Finance', size: '500+', region: 'Addis Ababa', subCity: 'Piassa', position: 'HR Director', verified: true },
            { ownerId: userIds['+251955555555'], name: 'Green Valley Trading', tin: 'TIN10005', industry: 'Retail', size: '51-200', region: 'Addis Ababa', subCity: 'Merkato', position: 'HR Manager', verified: true },
            { ownerId: userIds['+251966666666'], name: 'Blue Nile Services', tin: 'TIN10006', industry: 'Services', size: '11-50', region: 'Addis Ababa', subCity: 'Bole', position: 'HR Officer', verified: true },
        ];
        
        const companyIds = {};
        
        for (const company of companies) {
            const result = await client.query(
                `INSERT INTO companies (owner_id, company_name, tin_number, business_license_number, industry, company_size, region, sub_city, phone_number, email, description, is_verified, verification_status, company_position)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'verified', $13)
                 ON CONFLICT (tin_number) DO UPDATE SET is_verified = true, company_position = $13
                 RETURNING id`,
                [company.ownerId, company.name, company.tin, `BL-${company.tin}`, company.industry, company.size, company.region, company.subCity, '+251911223344', `info@${company.name.toLowerCase().replace(/\s/g, '')}.com`, `Leading ${company.industry} company in Ethiopia`, company.verified, company.position]
            );
            companyIds[company.name] = result.rows[0].id;
            console.log(`   ✅ ${company.name} (${company.position})`);
        }
        
        // ==================== JOBS ====================
        console.log('\n📦 Creating jobs...');
        
        const jobs = [
            { company: 'Ethio Tech Solutions PLC', title: 'Data Encoder', salaryMin: 15000, salaryMax: 20000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Ethio Tech Solutions PLC', title: 'Senior Go Backend Engineer', salaryMin: 20000, salaryMax: 35000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Habesha Innovations', title: 'Java Developer', salaryMin: 25000, salaryMax: 30000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Addis Digital Group', title: 'Backend Developer', salaryMin: null, salaryMax: null, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Ethio Tech Solutions PLC', title: 'C++ Developer', salaryMin: 3000, salaryMax: 5000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Addis Digital Group', title: 'AI Application Engineer', salaryMin: 3000, salaryMax: 6000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '5-10 Yrs Exp', education: 'Edu not required', jobType: 'Full-time' },
            { company: 'Habesha Innovations', title: 'SEO Technical Engineer', salaryMin: 2500, salaryMax: 5000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '5-10 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Ethio Tech Solutions PLC', title: 'Senior Go Developer', salaryMin: 3000, salaryMax: 5000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '5-10 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Addis Digital Group', title: 'Java Developer', salaryMin: 3400, salaryMax: 5000, type: 'Remote', category: 'IT', region: 'Addis Ababa', experience: '5-10 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Ethiopian Finance Corp', title: 'Business Development Manager', salaryMin: null, salaryMax: null, type: 'Remote', category: 'Sales', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Green Valley Trading', title: 'SEO Specialist', salaryMin: 1500, salaryMax: 3000, type: 'Remote', category: 'Marketing', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Diploma', jobType: 'Full-time' },
            { company: 'Blue Nile Services', title: 'SEO Administrator', salaryMin: 1500, salaryMax: 3000, type: 'Remote', category: 'Marketing', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Diploma', jobType: 'Full-time' },
            { company: 'Ethiopian Finance Corp', title: 'Senior Accountant', salaryMin: 20000, salaryMax: 30000, type: 'On-site', category: 'Finance', region: 'Addis Ababa', experience: '3-5 Yrs Exp', education: 'Bachelor', jobType: 'Full-time' },
            { company: 'Green Valley Trading', title: 'Sales Representative', salaryMin: 10000, salaryMax: 15000, type: 'On-site', category: 'Sales', region: 'Addis Ababa', experience: '1-3 Yrs Exp', education: 'Diploma', jobType: 'Full-time' },
            { company: 'Blue Nile Services', title: 'Customer Service Officer', salaryMin: 8000, salaryMax: 12000, type: 'On-site', category: 'Customer Service', region: 'Addis Ababa', experience: '1-3 Yrs Exp', education: 'Diploma', jobType: 'Full-time' },
        ];
        
        const jobIds = [];
        
        for (const job of jobs) {
            const companyId = companyIds[job.company];
            const slug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            
            const result = await client.query(
                `INSERT INTO jobs (company_id, posted_by, title, slug, description, requirements, job_type, category, region, sub_city, salary_min_etb, salary_max_etb, experience_level, education_level_required, status, views_count, applications_count, published_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', $15, $16, NOW())
                 RETURNING id`,
                [
                    companyId,
                    userIds['+251911111111'],
                    job.title,
                    slug,
                    `We are looking for a talented ${job.title} to join our team.`,
                    `Requirements for ${job.title} position`,
                    job.type,
                    job.category,
                    job.region,
                    'Bole',
                    job.salaryMin,
                    job.salaryMax,
                    job.experience,
                    job.education,
                    Math.floor(Math.random() * 500) + 100,
                    Math.floor(Math.random() * 50),
                ]
            );
            jobIds.push(result.rows[0].id);
            console.log(`   ✅ ${job.title} - ${job.company}`);
        }
        
        // ==================== APPLICATIONS ====================
        console.log('\n📦 Creating applications...');
        
        const candidateList = [
            userIds['+251977777777'],
            userIds['+251988888888'],
            userIds['+251999999999'],
            userIds['+251910101010'],
            userIds['+251920202020'],
        ];
        
        const statuses = ['applied', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'];
        
        for (let i = 0; i < 20; i++) {
            const jobId = jobIds[Math.floor(Math.random() * jobIds.length)];
            const candidateId = candidateList[Math.floor(Math.random() * candidateList.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            await client.query(
                `INSERT INTO applications (job_id, candidate_id, status, cover_letter, created_at)
                 VALUES ($1, $2, $3, $4, NOW() - (random() * interval '30 days'))
                 ON CONFLICT (job_id, candidate_id) DO NOTHING`,
                [jobId, candidateId, status, 'I am interested in this position']
            );
        }
        console.log('   ✅ 20 applications created');
        
        // ==================== NOTIFICATIONS ====================
        console.log('\n📦 Creating notifications...');
        
        const notifications = [
            { userId: userIds['+251977777777'], type: 'job_match', title: 'New Job Match!', body: 'A new Data Encoder position matches your profile' },
            { userId: userIds['+251977777777'], type: 'application', title: 'Application Viewed', body: 'Your application was viewed by Ethio Tech Solutions' },
            { userId: userIds['+251988888888'], type: 'message', title: 'New Message', body: 'You have a new message from a recruiter' },
            { userId: userIds['+251999999999'], type: 'interview', title: 'Interview Scheduled', body: 'Your interview is scheduled for next week' },
        ];
        
        for (const notif of notifications) {
            await client.query(
                `INSERT INTO notifications (user_id, type, title, body, created_at)
                 VALUES ($1, $2, $3, $4, NOW() - (random() * interval '7 days'))`,
                [notif.userId, notif.type, notif.title, notif.body]
            );
        }
        console.log('   ✅ Notifications created');
        
        await client.query('COMMIT');
        
        console.log('\n========================================');
        console.log('✅ Database seeded successfully!');
        console.log('========================================');
        console.log('\n📋 Test Credentials:');
        console.log('   Admin: +251900000000 / Admin@123');
        console.log('   Owner: +251911111111 / Owner@123');
        console.log('   Founder: +251922222222 / Founder@123');
        console.log('   CEO: +251933333333 / Ceo@12345');
        console.log('   HR Director: +251944444444 / HrDir@123');
        console.log('   HR Manager: +251955555555 / HrMgr@123');
        console.log('   HR Officer: +251966666666 / HrOff@123');
        console.log('   Candidate: +251977777777 / Test@123');
        console.log('');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedCompleteData().catch(console.error);
