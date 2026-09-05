#!/bin/bash

echo "🔧 Setting up Ethiopian Bossjob Platform"
echo "========================================"

# Fix rate limiter
echo "📝 Fixing rate limiter..."
cat > src/middleware/rateLimiter.js << 'EOF'
const rateLimit = require('express-rate-limit');
const config = require('../config');

const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again in 15 minutes.',
    },
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Upload limit reached. Please try again later.',
    },
});

module.exports = { apiLimiter, authLimiter, uploadLimiter };
