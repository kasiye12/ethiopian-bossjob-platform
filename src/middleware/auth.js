const jwt = require('jsonwebtoken');
const config = require('../config');
const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authMiddleware = {
    /**
     * Authenticate - Verify JWT token and attach user to request
     */
    authenticate: asyncHandler(async (req, res, next) => {
        let token;
        
        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        // Get token from cookie
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        if (!token) {
            throw new AppError('Authentication required. Please login.', 401);
        }
        
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            
            // Get user from database
            const { rows } = await pool.query(
                `SELECT id, phone_number, email, full_name, role, is_active, verification_status, company_position
                 FROM users 
                 WHERE id = $1 AND is_active = true`,
                [decoded.id]
            );
            
            if (rows.length === 0) {
                throw new AppError('User not found or inactive', 401);
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

    /**
     * Authorize - Check user role
     */
    authorize: (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return next(new AppError('Authentication required', 401));
            }
            
            if (!roles.includes(req.user.role)) {
                return next(new AppError(
                    `Role '${req.user.role}' is not authorized. Required: ${roles.join(', ')}`,
                    403
                ));
            }
            
            next();
        };
    },

    /**
     * Optional authentication
     */
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
                'SELECT id, phone_number, email, full_name, role, is_active FROM users WHERE id = $1 AND is_active = true',
                [decoded.id]
            );
            
            if (rows.length > 0) {
                req.user = rows[0];
            }
        } catch (error) {
            // Invalid token, continue as unauthenticated
        }
        
        next();
    }),
};

module.exports = authMiddleware;
