const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config');

class HomeController {
    /**
     * Welcome page for root URL
     */
    welcome = asyncHandler(async (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Welcome to Ethiopian Bossjob Platform API',
            version: '1.0.0',
            status: 'running',
            environment: config.env,
            timestamp: new Date().toISOString(),
            endpoints: {
                health: '/health',
                apiDocs: '/api-docs',
                auth: '/api/v1/auth',
                jobs: '/api/v1/jobs',
                applications: '/api/v1/applications',
                chats: '/api/v1/chats'
            },
            documentation: {
                register: 'POST /api/v1/auth/register',
                login: 'POST /api/v1/auth/login',
                logout: 'POST /api/v1/auth/logout',
                refreshToken: 'POST /api/v1/auth/refresh-token',
                getMe: 'GET /api/v1/auth/me',
                listJobs: 'GET /api/v1/jobs',
                getJob: 'GET /api/v1/jobs/:id',
                createJob: 'POST /api/v1/jobs',
                updateJob: 'PUT /api/v1/jobs/:id',
                deleteJob: 'DELETE /api/v1/jobs/:id',
                applyForJob: 'POST /api/v1/applications/:jobId/apply',
                getMyApplications: 'GET /api/v1/applications/my',
                getJobApplications: 'GET /api/v1/applications/job/:jobId',
                getChatThreads: 'GET /api/v1/chats/threads',
                getMessages: 'GET /api/v1/chats/threads/:threadId/messages',
                startChat: 'POST /api/v1/chats/threads'
            }
        });
    });

    /**
     * API Documentation endpoint
     */
    apiDocs = asyncHandler(async (req, res) => {
        res.status(200).json({
            success: true,
            title: 'Ethiopian Bossjob Platform API Documentation',
            version: '1.0.0',
            baseUrl: `${req.protocol}://${req.get('host')}`,
            authentication: {
                type: 'Bearer Token',
                description: 'Use JWT token in Authorization header',
                format: 'Authorization: Bearer <token>'
            },
            endpoints: [
                {
                    method: 'POST',
                    path: '/api/v1/auth/register',
                    description: 'Register a new user',
                    body: {
                        phone_number: 'string (required) - Ethiopian phone number +251 format',
                        email: 'string (optional) - Valid email address',
                        password: 'string (required) - Minimum 8 characters',
                        full_name: 'string (required) - Full name',
                        role: 'string (optional) - candidate or boss (default: candidate)'
                    },
                    auth: false
                },
                {
                    method: 'POST',
                    path: '/api/v1/auth/login',
                    description: 'Login user',
                    body: {
                        phone_number: 'string (required)',
                        password: 'string (required)'
                    },
                    auth: false
                },
                {
                    method: 'GET',
                    path: '/api/v1/jobs',
                    description: 'List all jobs with filters',
                    query: {
                        page: 'integer (optional) - Page number',
                        limit: 'integer (optional) - Results per page',
                        search: 'string (optional) - Search term',
                        category: 'string (optional) - Job category',
                        region: 'string (optional) - Region',
                        job_type: 'string (optional) - Full-time, Part-time, Contract, Internship, Remote'
                    },
                    auth: false
                },
                {
                    method: 'GET',
                    path: '/api/v1/jobs/:id',
                    description: 'Get job details',
                    auth: false
                },
                {
                    method: 'POST',
                    path: '/api/v1/jobs',
                    description: 'Create a new job (Employer only)',
                    body: {
                        title: 'string (required)',
                        description: 'string (required)',
                        job_type: 'string (required)',
                        category: 'string (required)',
                        region: 'string (required)',
                        salary_min_etb: 'number (optional)',
                        salary_max_etb: 'number (optional)'
                    },
                    auth: true,
                    roles: ['boss', 'admin']
                },
                {
                    method: 'POST',
                    path: '/api/v1/applications/:jobId/apply',
                    description: 'Apply for a job',
                    body: {
                        cover_letter: 'string (optional)',
                        expected_salary: 'number (optional)'
                    },
                    auth: true,
                    roles: ['candidate']
                },
                {
                    method: 'GET',
                    path: '/api/v1/applications/my',
                    description: 'Get user applications',
                    auth: true
                },
                {
                    method: 'GET',
                    path: '/api/v1/chats/threads',
                    description: 'Get chat threads',
                    auth: true
                },
                {
                    method: 'POST',
                    path: '/api/v1/chats/threads',
                    description: 'Start a new chat thread',
                    body: {
                        jobId: 'string (required) - Job UUID'
                    },
                    auth: true
                }
            ]
        });
    });
}

module.exports = new HomeController();
