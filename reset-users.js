const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'bossjob_ethiopia',
    user: 'sa',
    password: 'kasu@11@22',
});

async function resetAllUsers() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 RESETTING ALL USERS...\n');
        
        // Delete existing users (but keep companies/jobs references intact)
        // First delete applications
        await client.query('DELETE FROM applications');
        console.log('✅ Cleared applications');
        
        // Delete chat messages and threads
        await client.query('DELETE FROM messages');
        await client.query('DELETE FROM chat_threads');
        console.log('✅ Cleared chat data');
        
        // Delete candidate profiles
        await client.query('DELETE FROM candidate_profiles');
        console.log('✅ Cleared candidate profiles');
        
        // Delete companies and jobs (will be recreated)
        await client.query('DELETE FROM jobs');
        await client.query('DELETE FROM companies');
        console.log('✅ Cleared companies and jobs');
        
        // Delete users
        await client.query('DELETE FROM users');
        console.log('✅ Cleared all users');
        
        // Re-create all users
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
        
        console.log('\n📦 Creating users...');
        const userIds = {};
        
        for (const user of users) {
            const hash = await bcrypt.hash(user.password, 10);
            
            const result = await client.query(
                `INSERT INTO users (phone_number, email, password_hash, full_name, role, is_active, verification_status)
                 VALUES ($1, $2, $3, $4, $5, true, 'verified')
                 RETURNING id`,
                [user.phone, user.email, hash, user.name, user.role]
            );
            
            userIds[user.phone] = result.rows[0].id;
            console.log(`   ✅ ${user.name} (${user.role}) - ${user.phone} / ${user.password}`);
        }
        
        // Create candidate profiles
        console.log('\n📦 Creating candidate profiles...');
        
        const candidates = [
            { userId: userIds['+251977777777'], title: 'Data Encoder', experience: 3, education: 'Bachelor', location: 'Addis Ababa, Bole', skills: ['Data Entry', 'Excel', 'Typing'] },
            { userId: userIds['+251988888888'], title: 'Software Developer', experience: 5, education: 'Bachelor', location: 'Addis Ababa, Kazanchis', skills: ['JavaScript', 'Node.js', 'React'] },
            { userId: userIds['+251999999999'], title: 'Accountant', experience: 4, education: 'Bachelor', location: 'Addis Ababa, Piassa', skills: ['Accounting', 'Excel', 'Tax'] },
            { userId: userIds['+251910101010'], title: 'Marketing Specialist', experience: 3, education: 'Master', location: 'Addis Ababa, Bole', skills: ['Marketing', 'SEO'] },
            { userId: userIds['+251920202020'], title: 'Project Manager', experience: 7, education: 'Master', location: 'Addis Ababa, CMC', skills: ['Agile', 'Scrum'] },
        ];
        
        for (const c of candidates) {
            await client.query(
                `INSERT INTO candidate_profiles (user_id, profession_title, years_of_experience, education_level, current_location, skills, summary)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [c.userId, c.title, c.experience, c.education, c.location, c.skills, `Experienced ${c.title}`]
            );
            console.log(`   ✅ ${c.title} profile created`);
        }
        
        // Create companies
        console.log('\n📦 Creating companies...');
        
        const companies = [
            { ownerId: userIds['+251911111111'], name: 'Ethio Tech Solutions PLC', tin: 'TIN10001', position: 'Owner' },
            { ownerId: userIds['+251922222222'], name: 'Habesha Innovations', tin: 'TIN10002', position: 'Founder' },
            { ownerId: userIds['+251933333333'], name: 'Addis Digital Group', tin: 'TIN10003', position: 'CEO' },
            { ownerId: userIds['+251944444444'], name: 'Ethiopian Finance Corp', tin: 'TIN10004', position: 'HR Director' },
            { ownerId: userIds['+251955555555'], name: 'Green Valley Trading', tin: 'TIN10005', position: 'HR Manager' },
            { ownerId: userIds['+251966666666'], name: 'Blue Nile Services', tin: 'TIN10006', position: 'HR Officer' },
        ];
        
        const companyIds = {};
        
        for (const c of companies) {
            const result = await client.query(
                `INSERT INTO companies (owner_id, company_name, tin_number, business_license_number, industry, company_size, region, sub_city, is_verified, verification_status, company_position)
                 VALUES ($1, $2, $3, $4, 'Technology', '11-50', 'Addis Ababa', 'Bole', true, 'verified', $5)
                 RETURNING id`,
                [c.ownerId, c.name, c.tin, `BL-${c.tin}`, c.position]
            );
            companyIds[c.name] = result.rows[0].id;
            console.log(`   ✅ ${c.name} (${c.position})`);
        }
        
        // Create jobs
        console.log('\n📦 Creating jobs...');
        
        const jobs = [
            { company: 'Ethio Tech Solutions PLC', title: 'Data Encoder', salaryMin: 15000, salaryMax: 20000, type: 'Remote', category: 'IT' },
            { company: 'Ethio Tech Solutions PLC', title: 'Senior Go Backend Engineer', salaryMin: 20000, salaryMax: 35000, type: 'Remote', category: 'IT' },
            { company: 'Habesha Innovations', title: 'Java Developer', salaryMin: 25000, salaryMax: 30000, type: 'Remote', category: 'IT' },
            { company: 'Addis Digital Group', title: 'Backend Developer', salaryMin: null, salaryMax: null, type: 'Remote', category: 'IT' },
            { company: 'Ethiopian Finance Corp', title: 'Senior Accountant', salaryMin: 20000, salaryMax: 30000, type: 'On-site', category: 'Finance' },
        ];
        
        for (const job of jobs) {
            const companyId = companyIds[job.company];
            await client.query(
                `INSERT INTO jobs (company_id, posted_by, title, slug, description, job_type, category, region, sub_city, salary_min_etb, salary_max_etb, status, published_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'Addis Ababa', 'Bole', $8, $9, 'active', NOW())`,
                [companyId, userIds['+251911111111'], job.title, job.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(), `We are looking for ${job.title}`, job.type, job.category, job.salaryMin, job.salaryMax]
            );
            console.log(`   ✅ ${job.title} created`);
        }
        
        // Verify final count
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        const companyCount = await client.query('SELECT COUNT(*) FROM companies');
        const jobCount = await client.query('SELECT COUNT(*) FROM jobs');
        
        console.log('\n========================================');
        console.log('✅ RESET COMPLETE!');
        console.log('========================================');
        console.log(`   Users: ${userCount.rows[0].count}`);
        console.log(`   Companies: ${companyCount.rows[0].count}`);
        console.log(`   Jobs: ${jobCount.rows[0].count}`);
        console.log('');
        console.log('🔑 ALL TEST CREDENTIALS:');
        console.log('   Admin: +251900000000 / Admin@123');
        console.log('   Owner: +251911111111 / Owner@123');
        console.log('   Founder: +251922222222 / Founder@123');
        console.log('   CEO: +251933333333 / Ceo@12345');
        console.log('   HR Director: +251944444444 / HrDir@123');
        console.log('   HR Manager: +251955555555 / HrMgr@123');
        console.log('   HR Officer: +251966666666 / HrOff@123');
        console.log('   Candidate: +251977777777 / Test@123');
        console.log('========================================');
        
    } catch (error) {
        console.error('❌ Reset failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

resetAllUsers();
