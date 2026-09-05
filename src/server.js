const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const redis = require('./config/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

class Application {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.setupMiddleware();
        this.setupStaticFiles();
        this.setupRoutes();
        this.setupErrorHandling();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(helmet({ 
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        }));
        
        this.app.use(cors({
            origin: '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));
        
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(cookieParser());
        this.app.use('/api', apiLimiter);
        
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
            });
            next();
        });
    }

    setupStaticFiles() {
        const publicDir = path.join(__dirname, '../public');
        
        // Check if public directory exists
        if (!fs.existsSync(publicDir)) {
            console.error('❌ public directory not found at:', publicDir);
            fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Serve static files
        this.app.use(express.static(publicDir));
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
        
        // Explicitly serve all HTML pages
        const pages = [
    'applicant-cv.html',
            'index.html',
            'jobs.html',
            'jobs-full.html',
            'companies.html',
            'hr-dashboard.html',
            'dashboard.html',
            'chat.html',
            'resume.html',
            'profile.html',
            'analytics.html',
            'boss-ai.html',
            'admin.html',
            'payment.html',
            'status.html',
            'api-docs.html',
            'company-positions.html',
            'index-lang.html',
            'verify-company.html',
            'company-register.html',
            'post-job.html',
        ];
        
        pages.forEach(page => {
            const filePath = path.join(publicDir, page);
            this.app.get(`/${page}`, (req, res) => {
                if (fs.existsSync(filePath)) {
                    res.sendFile(filePath);
                } else {
                    console.warn(`⚠️  Page not found: ${page}`);
                    res.status(404).send(`Page not found: ${page}`);
                }
            });
        });
        
        // Serve API docs
        this.app.get('/api-docs', (req, res) => {
            const docsPath = path.join(publicDir, 'api-docs.html');
            if (fs.existsSync(docsPath)) {
                res.sendFile(docsPath);
            } else {
                res.json({
                    name: 'Bossjob Ethiopia API',
                    version: '1.0.0',
                    endpoints: '/api/v1'
                });
            }
        });
        
        // Serve home page
        this.app.get('/', (req, res) => {
            const indexPath = path.join(publicDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.send('<h1>Bossjob Ethiopia</h1><p>Server is running. Please check configuration.</p>');
            }
        });
    }

    setupRoutes() {
        // Health checks
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
            });
        });
        
        this.app.get('/health/db', async (req, res) => {
            try {
                const pool = require('./config/database');
                await pool.query('SELECT 1');
                res.status(200).json({ status: 'OK', database: 'connected' });
            } catch (error) {
                res.status(500).json({ status: 'ERROR', database: 'disconnected', error: error.message });
            }
        });
        
        this.app.get('/health/redis', async (req, res) => {
            try {
                const result = await redis.ping();
                res.status(200).json({ status: 'OK', redis: result });
            } catch (error) {
                res.status(500).json({ status: 'ERROR', redis: 'disconnected', error: error.message });
            }
        });
        
        // API Index
        this.app.get('/api/v1', (req, res) => {
            res.json({
                success: true,
                message: 'Bossjob Ethiopia API',
                version: '1.0.0',
                baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
                endpoints: {
                    auth: '/api/v1/auth',
                    companies: '/api/v1/companies',
                    jobs: '/api/v1/jobs',
                    applications: '/api/v1/applications',
                    chats: '/api/v1/chats',
                    candidates: '/api/v1/candidates',
                    talents: '/api/v1/talents',
                    interviews: '/api/v1/interviews',
                    analytics: '/api/v1/analytics',
                    payments: '/api/v1/payments',
                    admin: '/api/v1/admin',
                    notifications: '/api/v1/notifications',
                }
            });
        });
        
        // API routes
        const routeConfigs = [
            { path: '/api/v1/auth', file: './routes/authRoutes', name: 'Auth' },
            { path: '/api/v1/companies', file: './routes/companyRoutes', name: 'Company' },
            { path: '/api/v1/jobs', file: './routes/jobRoutes', name: 'Job' },
            { path: '/api/v1/applications', file: './routes/applicationRoutes', name: 'Application' },
            { path: '/api/v1/chats', file: './routes/chatRoutes', name: 'Chat' },
            { path: '/api/v1/candidates', file: './routes/candidateRoutes', name: 'Candidate' },
            { path: '/api/v1/talents', file: './routes/talentRoutes', name: 'Talent' },
            { path: '/api/v1/interviews', file: './routes/interviewRoutes', name: 'Interview' },
            { path: '/api/v1/analytics', file: './routes/analyticsRoutes', name: 'Analytics' },
            { path: '/api/v1/cv', file: './routes/cvRoutes', name: 'CV' },
            { path: '/api/v1/notifications', file: './routes/notificationRoutes', name: 'Notification' },
            { path: '/api/v1/payments', file: './routes/paymentRoutes', name: 'Payment' },
            { path: '/api/v1/admin', file: './routes/adminRoutes', name: 'Admin' },
            { path: '/api/v1/applicants', file: './routes/applicantRoutes', name: 'Applicant' },
            { path: '/api/v1/resume', file: './routes/resumeRoutes', name: 'Resume' },
            { path: '/api/v1/ai', file: './routes/aiRoutes', name: 'AI Service' },
        ];
        
        routeConfigs.forEach(({ path, file, name }) => {
            try {
                const routes = require(file);
                this.app.use(path, routes);
                console.log(`  ✅ ${name} routes loaded (${path})`);
            } catch (error) {
                console.error(`  ❌ Failed to load ${name} routes: ${error.message}`);
            }
        });
        
        // 404 handler for API
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'API Route not found',
                path: req.originalUrl,
            });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    setupWebSocket() {
        try {
            const SocketServer = require('./websocket/socketServer');
            this.socketServer = new SocketServer(this.server);
            this.app.set('socketServer', this.socketServer);
            console.log('  ✅ WebSocket server initialized');
        } catch (error) {
            console.error('  ❌ WebSocket init failed:', error.message);
        }
    }

    async start() {
        try {
            const pool = require('./config/database');
            await pool.query('SELECT 1');
            logger.info('✅ Database connected');
            
            await redis.ping();
            logger.info('✅ Redis connected');
            
            const PORT = 3000;
            
            this.server.listen(PORT, () => {
                console.log('');
                console.log('========================================');
                console.log('🎉 Ethiopian Bossjob Platform Running!');
                console.log('========================================');
                console.log('');
                console.log(`📍 Home: http://localhost:${PORT}/`);
                console.log(`📍 Jobs: http://localhost:${PORT}/jobs.html`);
                console.log(`📍 Jobs Full: http://localhost:${PORT}/jobs-full.html`);
                console.log(`📍 HR Dashboard: http://localhost:${PORT}/hr-dashboard.html`);
                console.log(`📍 API: http://localhost:${PORT}/api/v1`);
                console.log(`📍 Health: http://localhost:${PORT}/health`);
                console.log('');
                console.log('========================================');
            });
            
        } catch (error) {
            logger.error('Failed to start:', error);
            console.error('❌ Failed to start:', error.message);
            process.exit(1);
        }
    }
}

const app = new Application();

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

app.start().catch((error) => {
    logger.error('Application failed:', error);
    process.exit(1);
});

module.exports = app;
