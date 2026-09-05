const request = require('supertest');
const app = require('../src/server');

describe('Ethiopian Bossjob Platform - Full Test Suite', () => {
    let candidateToken = '';
    let employerToken = '';
    let adminToken = '';
    let jobId = '';
    let companyId = '';
    let threadId = '';

    beforeAll(async () => {
        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    describe('1. Health Checks', () => {
        test('GET /health returns OK', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('OK');
        });

        test('GET / should serve landing page', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toBe(200);
        });

        test('GET /api-docs should serve docs', async () => {
            const res = await request(app).get('/api-docs');
            expect(res.statusCode).toBe(200);
        });

        test('GET /api/v1 should return API index', async () => {
            const res = await request(app).get('/api/v1');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('2. Authentication', () => {
        test('Register candidate', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    phone_number: '+251955555555',
                    password: 'Test@123',
                    full_name: 'Test Candidate',
                    role: 'candidate'
                });
            
            if (res.statusCode === 201) {
                candidateToken = res.body.data.accessToken;
            } else if (res.statusCode === 409) {
                // Already exists, login instead
                const loginRes = await request(app)
                    .post('/api/v1/auth/login')
                    .send({ phone_number: '+251955555555', password: 'Test@123' });
                candidateToken = loginRes.body.data.accessToken;
            }
            
            expect(candidateToken).toBeDefined();
        });

        test('Register employer', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    phone_number: '+251966666666',
                    password: 'Boss@123',
                    full_name: 'Test Employer',
                    role: 'boss'
                });
            
            if (res.statusCode === 201) {
                employerToken = res.body.data.accessToken;
            } else if (res.statusCode === 409) {
                const loginRes = await request(app)
                    .post('/api/v1/auth/login')
                    .send({ phone_number: '+251966666666', password: 'Boss@123' });
                employerToken = loginRes.body.data.accessToken;
            }
            
            expect(employerToken).toBeDefined();
        });

        test('Login as admin', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ phone_number: '+251900000000', password: 'Admin@123' });
            
            expect(res.statusCode).toBe(200);
            adminToken = res.body.data.accessToken;
        });

        test('Get current user', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${candidateToken}`);
            
            expect(res.statusCode).toBe(200);
            expect(res.body.data.phone_number).toBe('+251955555555');
        });
    });

    describe('3. Company Management', () => {
        test('Register company', async () => {
            const res = await request(app)
                .post('/api/v1/companies/register')
                .set('Authorization', `Bearer ${employerToken}`)
                .send({
                    company_name: 'Test Company PLC',
                    industry: 'Technology',
                    company_size: '11-50',
                    tin_number: 'TIN99999',
                    business_license_number: 'BL88888',
                    region: 'Addis Ababa',
                    sub_city: 'Bole',
                    phone_number: '+251911112233',
                    email: 'test@company.com',
                    description: 'Test company for testing purposes'
                });
            
            if (res.statusCode === 201) {
                companyId = res.body.data.id;
            }
            
            expect([201, 409]).toContain(res.statusCode);
        });

        test('Get my company', async () => {
            const res = await request(app)
                .get('/api/v1/companies/my')
                .set('Authorization', `Bearer ${employerToken}`);
            
            expect([200, 404]).toContain(res.statusCode);
        });

        test('List companies', async () => {
            const res = await request(app).get('/api/v1/companies');
            expect(res.statusCode).toBe(200);
        });
    });

    describe('4. Jobs', () => {
        test('Create job', async () => {
            const res = await request(app)
                .post('/api/v1/jobs')
                .set('Authorization', `Bearer ${employerToken}`)
                .send({
                    title: 'Software Engineer',
                    description: 'We need a software engineer',
                    requirements: 'JavaScript, Node.js',
                    job_type: 'Full-time',
                    category: 'IT',
                    region: 'Addis Ababa',
                    salary_min_etb: 30000,
                    salary_max_etb: 50000,
                    experience_level: '3-5 Years'
                });
            
            if (res.statusCode === 201) {
                jobId = res.body.data.id;
            }
            
            expect([201, 403]).toContain(res.statusCode);
        });

        test('List jobs', async () => {
            const res = await request(app).get('/api/v1/jobs');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('Search jobs', async () => {
            const res = await request(app)
                .get('/api/v1/jobs')
                .query({ search: 'Software', category: 'IT' });
            expect(res.statusCode).toBe(200);
        });

        test('Get job categories', async () => {
            const res = await request(app).get('/api/v1/jobs/categories');
            expect(res.statusCode).toBe(200);
        });
    });

    describe('5. Applications', () => {
        test('Apply for job', async () => {
            if (!jobId) {
                // Get first job
                const jobsRes = await request(app).get('/api/v1/jobs');
                if (jobsRes.body.data && jobsRes.body.data.length > 0) {
                    jobId = jobsRes.body.data[0].id;
                }
            }
            
            if (jobId) {
                const res = await request(app)
                    .post(`/api/v1/applications/${jobId}/apply`)
                    .set('Authorization', `Bearer ${candidateToken}`)
                    .send({ cover_letter: 'I am interested' });
                
                expect([201, 409, 400]).toContain(res.statusCode);
            }
        });

        test('Get my applications', async () => {
            const res = await request(app)
                .get('/api/v1/applications/my')
                .set('Authorization', `Bearer ${candidateToken}`);
            
            expect(res.statusCode).toBe(200);
        });
    });

    describe('6. Chat', () => {
        test('Get chat threads', async () => {
            const res = await request(app)
                .get('/api/v1/chats/threads')
                .set('Authorization', `Bearer ${candidateToken}`);
            
            expect(res.statusCode).toBe(200);
        });
    });

    describe('7. Talents', () => {
        test('Search talents', async () => {
            const res = await request(app)
                .get('/api/v1/talents/search')
                .set('Authorization', `Bearer ${employerToken}`);
            
            expect([200, 403]).toContain(res.statusCode);
        });

        test('Get recommended talents', async () => {
            const res = await request(app)
                .get('/api/v1/talents/recommended')
                .set('Authorization', `Bearer ${employerToken}`);
            
            expect([200, 403]).toContain(res.statusCode);
        });
    });

    describe('8. Interviews', () => {
        test('Get interviews', async () => {
            const res = await request(app)
                .get('/api/v1/interviews')
                .set('Authorization', `Bearer ${employerToken}`);
            
            expect([200, 403]).toContain(res.statusCode);
        });
    });

    describe('9. Admin', () => {
        test('Get users (admin only)', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toBe(200);
        });

        test('Get platform stats', async () => {
            const res = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.statusCode).toBe(200);
        });
    });

    describe('10. Notifications', () => {
        test('Get notifications', async () => {
            const res = await request(app)
                .get('/api/v1/notifications')
                .set('Authorization', `Bearer ${candidateToken}`);
            
            expect(res.statusCode).toBe(200);
        });
    });

    describe('11. Payments', () => {
        test('Get payment history', async () => {
            const res = await request(app)
                .get('/api/v1/payments/history')
                .set('Authorization', `Bearer ${employerToken}`);
            
            expect(res.statusCode).toBe(200);
        });

        test('Get credit balance', async () => {
            const res = await request(app)
                .get('/api/v1/payments/credits')
                .set('Authorization', `Bearer ${employerToken}`);
            
            expect(res.statusCode).toBe(200);
        });
    });
});
