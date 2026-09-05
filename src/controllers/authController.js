const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const config = require('../config');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class AuthController {
    /**
     * Register new user - Accepts any phone format
     */
    register = asyncHandler(async (req, res) => {
        const { phone_number, email, password, full_name, role } = req.body;
        
        console.log('📝 Registration attempt:', { phone_number, full_name, role });
        
        // Basic validation
        if (!phone_number || !password || !full_name) {
            throw new AppError('Phone number, password, and full name are required', 400);
        }
        
        if (password.length < 8) {
            throw new AppError('Password must be at least 8 characters', 400);
        }
        
        // Normalize phone number - remove spaces, dashes, parentheses
        let normalizedPhone = String(phone_number).trim();
        normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
        
        // If phone doesn't start with +, add Ethiopian country code
        if (!normalizedPhone.startsWith('+')) {
            if (normalizedPhone.startsWith('0')) {
                // Convert 09XXXXXXXX to +2519XXXXXXXX
                normalizedPhone = '+251' + normalizedPhone.substring(1);
            } else if (normalizedPhone.startsWith('9')) {
                // Add +251 prefix
                normalizedPhone = '+251' + normalizedPhone;
            } else if (normalizedPhone.startsWith('251')) {
                // Add + prefix
                normalizedPhone = '+' + normalizedPhone;
            }
        }
        
        console.log('📱 Normalized phone:', normalizedPhone);
        
        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE phone_number = $1',
            [normalizedPhone]
        );
        
        if (existingUser.rows.length > 0) {
            throw new AppError('User with this phone number already exists. Please login instead.', 409);
        }
        
        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        
        // Insert user
        const result = await pool.query(
            `INSERT INTO users (phone_number, email, password_hash, full_name, role, is_active, verification_status)
             VALUES ($1, $2, $3, $4, $5, true, 'verified')
             RETURNING id, phone_number, email, full_name, role, created_at`,
            [normalizedPhone, email || null, password_hash, full_name, role || 'candidate']
        );
        
        const user = result.rows[0];
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiry || '7d' }
        );
        
        console.log('✅ Registration successful:', user.phone_number);
        
        return ApiResponse.success(
            res,
            { user, accessToken: token },
            'Registration successful',
            201
        );
    });

    /**
     * Login user - Accepts any phone format
     */
    login = asyncHandler(async (req, res) => {
        const { phone_number, password } = req.body;
        
        console.log('🔐 Login attempt:', phone_number);
        
        if (!phone_number || !password) {
            throw new AppError('Phone number and password are required', 400);
        }
        
        // Normalize phone number
        let normalizedPhone = String(phone_number).trim();
        normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
        
        if (!normalizedPhone.startsWith('+')) {
            if (normalizedPhone.startsWith('0')) {
                normalizedPhone = '+251' + normalizedPhone.substring(1);
            } else if (normalizedPhone.startsWith('9')) {
                normalizedPhone = '+251' + normalizedPhone;
            } else if (normalizedPhone.startsWith('251')) {
                normalizedPhone = '+' + normalizedPhone;
            }
        }
        
        console.log('📱 Normalized phone:', normalizedPhone);
        
        // Find user
        const result = await pool.query(
            'SELECT id, phone_number, email, password_hash, full_name, role, is_active FROM users WHERE phone_number = $1',
            [normalizedPhone]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ User not found:', normalizedPhone);
            throw new AppError('User not found. Please register first.', 401);
        }
        
        const user = result.rows[0];
        
        if (!user.is_active) {
            throw new AppError('Account is deactivated', 403);
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            console.log('❌ Wrong password for:', normalizedPhone);
            throw new AppError('Invalid password', 401);
        }
        
        delete user.password_hash;
        
        // Update last login
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        
        // Generate token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiry || '7d' }
        );
        
        console.log('✅ Login successful:', user.phone_number, '| Role:', user.role);
        
        return ApiResponse.success(res, { user, accessToken: token }, 'Login successful');
    });

    /**
     * Get current user
     */
    getMe = asyncHandler(async (req, res) => {
        const result = await pool.query(
            'SELECT id, phone_number, email, full_name, role, is_fayda_verified, verification_status, company_position, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            throw new AppError('User not found', 404);
        }
        
        return ApiResponse.success(res, result.rows[0], 'User profile retrieved');
    });

    /**
     * Refresh token
     */
    refreshToken = asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }
        
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.secret);
            const result = await pool.query(
                'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
                [decoded.id]
            );
            
            if (result.rows.length === 0) {
                throw new AppError('User not found', 404);
            }
            
            const token = jwt.sign(
                { id: decoded.id, role: result.rows[0].role },
                config.jwt.secret,
                { expiresIn: config.jwt.expiry || '7d' }
            );
            
            return ApiResponse.success(res, { accessToken: token }, 'Token refreshed');
        } catch (error) {
            throw new AppError('Invalid refresh token', 401);
        }
    });

    /**
     * Logout
     */
    logout = asyncHandler(async (req, res) => {
        return ApiResponse.success(res, null, 'Logout successful');
    });

    /**
     * Send OTP
     */
    sendOTP = asyncHandler(async (req, res) => {
        const { phone_number } = req.body;
        
        if (!phone_number) {
            throw new AppError('Phone number is required', 400);
        }
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`📱 OTP for ${phone_number}: ${otp}`);
        
        return ApiResponse.success(res, { otp, expiresIn: 300 }, 'OTP sent (Development mode)');
    });

    /**
     * Verify OTP
     */
    verifyOTP = asyncHandler(async (req, res) => {
        const { phone_number, otp } = req.body;
        return ApiResponse.success(res, null, 'OTP verified');
    });

    /**
     * Verify Fayda ID
     */
    verifyFayda = asyncHandler(async (req, res) => {
        const { fayda_id_number } = req.body;
        
        if (!fayda_id_number || fayda_id_number.length !== 12) {
            throw new AppError('Fayda ID must be 12 digits', 400);
        }
        
        await pool.query(
            `UPDATE users SET fayda_id_number = $1, is_fayda_verified = TRUE, verification_status = 'verified' WHERE id = $2`,
            [fayda_id_number, req.user.id]
        );
        
        return ApiResponse.success(res, null, 'Fayda ID verified');
    });
}

module.exports = new AuthController();
