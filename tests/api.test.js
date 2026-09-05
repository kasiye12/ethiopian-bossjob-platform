const request = require('supertest');
const app = require('../src/server');

describe('Ethiopian Bossjob Platform API Tests', () => {
    let authToken = '';
    let jobId = '';
    let companyId = '';

    describe('Health Checks', () => {
        test('GET /health should return OK', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('OK');
        });

        test('GET / should return welcome message', async () => {
            const res = await request(app).get('/');
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Authentication', () => {
        test('POST /api/v1/auth/register should create user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    phone_number: '+251988765432',
                    password: 'Test@123',
                    full_name: 'Test Candidate',
                    role: 'candidate'
                });
            
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            authToken = res.body.data.accessToken;
        });

        test('POST /api/v1/auth/login should authenticate', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    phone_number: '+251988765432',
                    password: 'Test@123'
                });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
        });

        test('GET /api/v1/auth/me should return user', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.statusCode).toBe(200);
            expect(res.body.data.phone_number).toBe('+251988765432');
        });
    });

    describe('Jobs', () => {
        test('GET /api/v1/jobs should list jobs', async () => {
            const res = await request(app).get('/api/v1/jobs');
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        test('GET /api/v1/jobs with search should filter', async () => {
            const res = await request(app)
                .get('/api/v1/jobs')
                .query({ search: 'developer' });
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Companies', () => {
        test('GET /api/v1/companies should list companies', async () => {
            const res = await request(app).get('/api/v1/companies');
            expect(res.statusCode).toBe(200);
        });
    });
});
