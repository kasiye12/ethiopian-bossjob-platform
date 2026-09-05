const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config');

class ApiController {
    /**
     * API Index - Lists all available endpoints
     */
    index = asyncHandler(async (req, res) => {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        res.status(200).json({
            success: true,
            name: 'Ethiopian Bossjob Platform API',
            version: '1.0.0',
            status: 'operational',
            timestamp: new Date().toISOString(),
            baseUrl: `${baseUrl}/api/v1`,
            categories: {
                authentication: {
                    description: 'User authentication and management',
                    endpoints: [
                        { method: 'POST', path: '/api/v1/auth/register', description: 'Register new user', auth: false },
                        { method: 'POST', path: '/api/v1/auth/login', description: 'Login user', auth: false },
                        { method: 'POST', path: '/api/v1/auth/refresh-token', description: 'Refresh access token', auth: false },
                        { method: 'POST', path: '/api/v1/auth/logout', description: 'Logout user', auth: true },
                        { method: 'GET', path: '/api/v1/auth/me', description: 'Get current user', auth: true },
                        { method: 'POST', path: '/api/v1/auth/verify-fayda', description: 'Verify Fayda ID', auth: true },
                        { method: 'POST', path: '/api/v1/auth/send-otp', description: 'Send OTP', auth: false },
                        { method: 'POST', path: '/api/v1/auth/verify-otp', description: 'Verify OTP', auth: false },
                    ]
                },
                companies: {
                    description: 'Company management',
                    endpoints: [
                        { method: 'POST', path: '/api/v1/companies/register', description: 'Register company', auth: true },
                        { method: 'GET', path: '/api/v1/companies/my', description: 'Get my company', auth: true },
                        { method: 'PUT', path: '/api/v1/companies/my', description: 'Update company', auth: true },
                        { method: 'GET', path: '/api/v1/companies', description: 'List companies', auth: false },
                        { method: 'GET', path: '/api/v1/companies/:id', description: 'Get company by ID', auth: false },
                    ]
                },
                jobs: {
                    description: 'Job posting and management',
                    endpoints: [
                        { method: 'GET', path: '/api/v1/jobs', description: 'List jobs with filters', auth: false },
                        { method: 'GET', path: '/api/v1/jobs/my', description: 'Get my jobs', auth: true },
                        { method: 'POST', path: '/api/v1/jobs', description: 'Create job', auth: true },
                        { method: 'GET', path: '/api/v1/jobs/:id', description: 'Get job details', auth: false },
                        { method: 'PUT', path: '/api/v1/jobs/:id', description: 'Update job', auth: true },
                        { method: 'DELETE', path: '/api/v1/jobs/:id', description: 'Delete job', auth: true },
                        { method: 'GET', path: '/api/v1/jobs/categories', description: 'Get job categories', auth: false },
                    ]
                },
                applications: {
                    description: 'Job applications',
                    endpoints: [
                        { method: 'POST', path: '/api/v1/applications/:jobId/apply', description: 'Apply for job', auth: true },
                        { method: 'GET', path: '/api/v1/applications/my', description: 'Get my applications', auth: true },
                        { method: 'GET', path: '/api/v1/applications/job/:jobId', description: 'Get job applications', auth: true },
                        { method: 'PUT', path: '/api/v1/applications/:id/status', description: 'Update application status', auth: true },
                    ]
                },
                chat: {
                    description: 'Real-time messaging',
                    endpoints: [
                        { method: 'GET', path: '/api/v1/chats/threads', description: 'Get chat threads', auth: true },
                        { method: 'POST', path: '/api/v1/chats/threads', description: 'Start chat thread', auth: true },
                        { method: 'GET', path: '/api/v1/chats/threads/:id/messages', description: 'Get messages', auth: true },
                    ]
                },
                talents: {
                    description: 'Talent management',
                    endpoints: [
                        { method: 'GET', path: '/api/v1/talents/search', description: 'Search talents', auth: true },
                        { method: 'GET', path: '/api/v1/talents/recommended', description: 'Recommended talents', auth: true },
                        { method: 'GET', path: '/api/v1/talents/saved', description: 'Saved talents', auth: true },
                        { method: 'GET', path: '/api/v1/talents/viewed', description: 'Viewed talents', auth: true },
                        { method: 'GET', path: '/api/v1/talents/:id', description: 'Get talent profile', auth: true },
                        { method: 'POST', path: '/api/v1/talents/:id/save', description: 'Save talent', auth: true },
                        { method: 'DELETE', path: '/api/v1/talents/:id/save', description: 'Remove saved talent', auth: true },
                    ]
                },
                interviews: {
                    description: 'Interview scheduling',
                    endpoints: [
                        { method: 'POST', path: '/api/v1/interviews', description: 'Schedule interview', auth: true },
                        { method: 'GET', path: '/api/v1/interviews', description: 'Get interviews', auth: true },
                        { method: 'GET', path: '/api/v1/interviews/upcoming', description: 'Get upcoming interviews', auth: true },
                        { method: 'PUT', path: '/api/v1/interviews/:id/status', description: 'Update interview status', auth: true },
                        { method: 'DELETE', path: '/api/v1/interviews/:id', description: 'Cancel interview', auth: true },
                    ]
                },
                analytics: {
                    description: 'Analytics and reports',
                    endpoints: [
                        { method: 'GET', path: '/api/v1/analytics', description: 'Get analytics', auth: true },
                        { method: 'GET', path: '/api/v1/analytics/interviews', description: 'Interview analytics', auth: true },
                        { method: 'GET', path: '/api/v1/analytics/talents', description: 'Talent analytics', auth: true },
                    ]
                },
                payments: {
                    description: 'Payment processing',
                    endpoints: [
                        { method: 'POST', path: '/api/v1/payments/initialize', description: 'Initialize payment', auth: true },
                        { method: 'GET', path: '/api/v1/payments/history', description: 'Payment history', auth: true },
                        { method: 'GET', path: '/api/v1/payments/credits', description: 'Credit balance', auth: true },
                    ]
                },
                admin: {
                    description: 'Admin operations',
                    endpoints: [
                        { method: 'GET', path: '/api/v1/admin/users', description: 'List users', auth: true, admin: true },
                        { method: 'GET', path: '/api/v1/admin/stats', description: 'Platform stats', auth: true, admin: true },
                    ]
                },
            },
            webSocket: {
                description: 'Real-time WebSocket events',
                events: [
                    { event: 'join_thread', description: 'Join a chat thread' },
                    { event: 'send_message', description: 'Send a message' },
                    { event: 'typing', description: 'Typing indicator' },
                    { event: 'mark_read', description: 'Mark messages as read' },
                    { event: 'notification', description: 'Receive notification' },
                ]
            },
            webPages: {
                landing: '/',
                hrDashboard: '/hr-dashboard.html',
                analytics: '/analytics.html',
                bossAI: '/boss-ai.html',
                admin: '/admin.html',
                dashboard: '/dashboard.html',
                chat: '/chat.html',
                profile: '/profile.html',
                apiDocs: '/api-docs',
                status: '/status.html',
            }
        });
    });
}

module.exports = new ApiController();
