const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectRedis = require('connect-redis');
const config = require('./config');
const redis = require('./config/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const SocketServer = require('./websocket/socketServer');

// Import routes
const authRoutes = require('./routes/authRoutes');
// Add more routes as needed

class Application {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.setupWebSocket();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        
        // CORS configuration
        this.app.use(cors({
            origin: config.env === 'production' 
                ? ['https://bossjob.et', 'https://app.bossjob.et']
                : '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));
        
        // Compression
        this.app.use(compression());
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(cookieParser());
        
        // Session configuration
        const RedisStore = connectRedis(session);
        this.app.use(session({
            store: new RedisStore({ client: redis }),
            secret: config.jwt.secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: config.env === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'strict',
            },
        }));
        
        // Rate limiting
        this.app.use('/api', apiLimiter);
        
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                if (req.path !== '/health') {
                    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
                        method: req.method,
                        path: req.path,
                        status: res.statusCode,
                        duration,
                        ip: req.ip,
                    });
                }
            });
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
            });
        });
        
        // API routes
        this.app.use('/api/v1/auth', authRoutes);
        // Add more routes here
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found',
            });
        });
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
    }

    setupWebSocket() {
        this.socketServer = new SocketServer(this.server);
        this.app.set('socketServer', this.socketServer);
    }

    async start() {
        try {
            // Test database connection
            const pool = require('./config/database');
            await pool.query('SELECT 1');
            logger.info('✅ Database connected successfully');
            
            // Test Redis connection
            await redis.ping();
            logger.info('✅ Redis connected successfully');
            
            // Start server
            this.server.listen(config.port, config.host, () => {
                logger.info(`🚀 Server running on http://${config.host}:${config.port}`);
                logger.info(`Environment: ${config.env}`);
                logger.info(`Health check: http://${config.host}:${config.port}/health`);
            });
            
        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }

    async shutdown() {
        logger.info('Shutting down server...');
        
        this.server.close(async () => {
            logger.info('HTTP server closed');
            
            // Close database connection
            const pool = require('./config/database');
            await pool.end();
            logger.info('Database connection closed');
            
            // Close Redis connection
            await redis.quit();
            logger.info('Redis connection closed');
            
            process.exit(0);
        });
        
        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
}

// Create application instance
const app = new Application();

// Handle process signals
process.on('SIGTERM', () => app.shutdown());
process.on('SIGINT', () => app.shutdown());
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    app.shutdown();
});

// Start the application
if (require.main === module) {
    app.start().catch((error) => {
        logger.error('Application failed to start:', error);
        process.exit(1);
    });
}

module.exports = app;
