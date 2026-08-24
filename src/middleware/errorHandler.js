const logger = require('../utils/logger');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;
    
    // Log error
    if (statusCode >= 500) {
        logger.error('Internal Server Error', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            body: req.body,
            user: req.user ? req.user.id : null,
        });
    } else {
        logger.warn('Client Error', {
            message: err.message,
            url: req.originalUrl,
            method: req.method,
        });
    }
    
    // Handle specific error types
    if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON payload';
    }
    
    if (err.code === '23505') {
        statusCode = 409;
        message = 'Duplicate entry. Resource already exists.';
    }
    
    if (err.code === '23503') {
        statusCode = 400;
        message = 'Foreign key constraint violation.';
    }
    
    if (err.code === '22P02') {
        statusCode = 400;
        message = 'Invalid input syntax.';
    }
    
    // Don't expose internal errors in production
    if (config.env === 'production' && statusCode === 500) {
        message = 'Something went wrong. Please try again later.';
        errors = null;
    }
    
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
        ...(config.env === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
