const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'bossjob_ethiopia',
    user: 'sa',
    password: 'kasu@11@22',
});

async function createCompaniesAndJobs() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('🌱 Creating companies and jobs...\n');
        
        // Get user IDs
        const userResult = await client.query(
            "SELECT id, phone_number, full_name FROM users WHERE role = 'boss' OR role = 'admin'"
        );
        
        const userMap = {};
        userResult.rows.forEach(row => {
            userMap[row.phone_number] = { id: row.id, name: row.full_name };
            console.log(`   User: ${row.full_name} (${row.phone_number}) -> ${row.id}`);
        });
        
        // Create companies
        const companies = [
            { phone: '+251911111111', name: 'Ethio Tech Solutions PLC', tin: 'TIN10001', position: 'Owner' },
            { phone: '+251922222222', name: 'Habesha Innovations', tin: 'TIN10002', position: 'Founder' },
            { phone: '+251933333333', name: 'Addis Digital Group', tin: 'TIN10003', position: 'CEO' },
            { phone: '+251944444444', name: 'Ethiopian Finance Corp', tin: 'TIN10004', position: 'HR Director' },
            { phone: '+251955555555', name: 'Green Valley Trading', tin: 'TIN10005', position: 'HR Manager' },
            { phone: '+251966666666', name: 'Blue Nile Services', tin: 'TIN10006', position: 'HR Officer' },
        ];
        
        const companyMap = {};
        
        for (const company of companies) {
            const userId = userMap[company.phone]?.id;
            
            if (!userId) {
                console.log(`   ❌ User not found for phone: ${company.phone}`);
                continue;
            }
            
            // Check if company exists
            const existing = await client.query(
                'SELECT id FROM companies WHERE tin_number = $1',
                [company.tin]
            );
            
            if (existing.rows.length > 0) {
                companyMap[company.name] = existing.rows[0].id;
                console.log(`   ✅ Existing: ${company.name}`);
            } else {
                const result = await client.query(
                    `INSERT INTO companies (owner_id, company_name, tin_number, business_license_number, industry, company_size, region, sub_city, phone_number, email, description, is_verified, verification_status, company_position)
                     VALUES ($1, $2, $3, $4, 'Technology', '11-50', 'Addis Ababa', 'Bole', '+251911223344', $5, $6, true, 'verified', $7)
                     RETURNING id`,
                    [userId, company.name, company.tin, `BL-${company.tin}`, `info@${company.name.toLowerCase().replace(/\s/g, '')}.com`, `Leading company in Ethiopia`, company.position]
                );
                companyMap[company.name] = result.rows[0].id;
                console.log(`   ✅ Created: ${company.name} (${company.position})`);
            }
        }
        
        // Create jobs
        const jobs = [
            { company: 'Ethio Tech Solutions PLC', title: 'Data Encoder', salaryMin: 15000, salaryMax: 20000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Ethio Tech Solutions PLC', title: 'Senior Go Backend Engineer', salaryMin: 20000, salaryMax: 35000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Habesha Innovations', title: 'Java Developer', salaryMin: 25000, salaryMax: 30000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Addis Digital Group', title: 'Backend Developer', salaryMin: null, salaryMax: null, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Ethio Tech Solutions PLC', title: 'C++ Developer', salaryMin: 3000, salaryMax: 5000, type: 'Remote', category: 'IT', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Ethiopian Finance Corp', title: 'Senior Accountant', salaryMin: 20000, salaryMax: 30000, type: 'On-site', category: 'Finance', experience: '3-5 Yrs Exp', education: 'Bachelor' },
            { company: 'Green Valley Trading', title: 'Sales Representative', salaryMin: 10000, salaryMax: 15000, type: 'On-site', category: 'Sales', experience: '1-3 Yrs Exp', education: 'Diploma' },
            { company: 'Blue Nile Services', title: 'Customer Service Officer', salaryMin: 8000, salaryMax: 12000, type: 'On-site', category: 'Customer Service', experience: '1-3 Yrs Exp', education: 'Diploma' },
        ];
        
        console.log('\n📦 Creating jobs...');
        
        for (const job of jobs) {
            const companyId = companyMap[job.company];
            const ownerPhone = Object.keys(userMap).find(phone => {
                const company = companies.find(c => c.name === job.company);
                return company && company.phone === phone;
            });
            const postedBy = ownerPhone ? userMap[ownerPhone]?.id : null;
            
            if (!companyId || !postedBy) {
                console.log(`   ❌ Skipping: ${job.title} (no company/user)`);
                continue;
            }
            
            const slug = `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            
            await client.query(
                `INSERT INTO jobs (company_id, posted_by, title, slug, description, requirements, job_type, category, region, sub_city, salary_min_etb, salary_max_etb, experience_level, education_level_required, status, published_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Addis Ababa', 'Bole', $9, $10, $11, $12, 'active', NOW())
                 ON CONFLICT (slug) DO NOTHING`,
                [companyId, postedBy, job.title, slug, `We are looking for ${job.title}`, `Requirements for ${job.title}`, job.type, job.category, job.salaryMin, job.salaryMax, job.experience, job.education]
            );
            console.log(`   ✅ ${job.title} - ${job.company}`);
        }
        
        await client.query('COMMIT');
        console.log('\n✅ Companies and jobs created successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createCompaniesAndJobs();
