const jwt = require('jsonwebtoken');
const config = require('../config');
const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authMiddleware = {
    // Verify JWT token
    authenticate: asyncHandler(async (req, res, next) => {
        let token;
        
        // Check Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        // Check token in cookies
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        if (!token) {
            throw new AppError('Authentication required. Please login.', 401);
        }
        
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Check if user still exists
            const { rows } = await pool.query(
                'SELECT id, phone_number, email, role, is_active, verification_status FROM users WHERE id = $1 AND is_active = true',
                [decoded.id]
            );
            
            if (rows.length === 0) {
                throw new AppError('User no longer exists.', 401);
            }
            
            req.user = rows[0];
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new AppError('Invalid token. Please login again.', 401);
            } else if (error.name === 'TokenExpiredError') {
                throw new AppError('Token expired. Please login again.', 401);
            }
            throw error;
        }
    }),

    // Role-based authorization
    authorize: (...roles) => {
        return (req, res, next) => {
            if (!roles.includes(req.user.role)) {
                return next(new AppError(
                    `User role ${req.user.role} is not authorized to access this route`,
                    403
                ));
            }
            next();
        };
    },

    // Optional authentication (for public routes with optional user data)
    optionalAuth: asyncHandler(async (req, res, next) => {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return next();
        }
        
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            const { rows } = await pool.query(
                'SELECT id, phone_number, email, role, is_active FROM users WHERE id = $1 AND is_active = true',
                [decoded.id]
            );
            
            if (rows.length > 0) {
                req.user = rows[0];
            }
        } catch (error) {
            // Token is invalid, but we continue as unauthenticated
        }
        
        next();
    }),
};

module.exports = authMiddleware;
