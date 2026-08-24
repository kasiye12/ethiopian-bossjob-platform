const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const redis = require('../config/redis');
const config = require('../config');
const AppError = require('../utils/AppError');
const encryption = require('../utils/encryption');

class AuthService {
    /**
     * Register a new user
     */
    async register(userData) {
        const { phone_number, email, password, full_name, role } = userData;
        
        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE phone_number = $1 OR (email IS NOT NULL AND email = $2)',
            [phone_number, email]
        );
        
        if (existingUser.rows.length > 0) {
            throw new AppError('User with this phone number or email already exists', 409);
        }
        
        // Hash password
        const password_hash = await bcrypt.hash(password, config.bcrypt.saltRounds);
        
        // Encrypt sensitive data
        const encryptedPhone = encryption.encrypt(phone_number);
        const encryptedEmail = email ? encryption.encrypt(email) : null;
        
        // Insert user
        const result = await pool.query(
            `INSERT INTO users (phone_number, email, password_hash, full_name, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, phone_number, email, full_name, role, created_at`,
            [encryptedPhone, encryptedEmail, password_hash, full_name, role]
        );
        
        const user = result.rows[0];
        
        // Decrypt for response
        user.phone_number = encryption.decrypt(user.phone_number);
        user.email = user.email ? encryption.decrypt(user.email) : null;
        
        // Generate tokens
        const tokens = this.generateTokens(user.id);
        
        return { user, tokens };
    }

    /**
     * Login user
     */
    async login(phoneNumber, password) {
        // Find user by phone number
        const encryptedPhone = encryption.encrypt(phoneNumber);
        
        const result = await pool.query(
            'SELECT id, phone_number, email, password_hash, full_name, role, is_active FROM users WHERE phone_number = $1',
            [encryptedPhone]
        );
        
        if (result.rows.length === 0) {
            throw new AppError('Invalid credentials', 401);
        }
        
        const user = result.rows[0];
        
        // Check if user is active
        if (!user.is_active) {
            throw new AppError('Account is deactivated. Please contact support.', 403);
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401);
        }
        
        // Update last login
        await pool.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = $1',
            [user.id]
        );
        
        // Decrypt user data
        user.phone_number = encryption.decrypt(user.phone_number);
        user.email = user.email ? encryption.decrypt(user.email) : null;
        delete user.password_hash;
        
        // Generate tokens
        const tokens = this.generateTokens(user.id);
        
        return { user, tokens };
    }

    /**
     * Generate JWT tokens
     */
    generateTokens(userId) {
        const accessToken = jwt.sign(
            { id: userId },
            config.jwt.secret,
            { expiresIn: config.jwt.expiry }
        );
        
        const refreshToken = jwt.sign(
            { id: userId, type: 'refresh' },
            config.jwt.secret,
            { expiresIn: config.jwt.refreshExpiry }
        );
        
        return { accessToken, refreshToken };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.secret);
            
            if (decoded.type !== 'refresh') {
                throw new AppError('Invalid refresh token', 401);
            }
            
            // Check if token is blacklisted
            const isBlacklisted = await redis.get(`blacklist:${refreshToken}`);
            if (isBlacklisted) {
                throw new AppError('Token has been revoked', 401);
            }
            
            // Check if user exists
            const result = await pool.query(
                'SELECT id, is_active FROM users WHERE id = $1',
                [decoded.id]
            );
            
            if (result.rows.length === 0 || !result.rows[0].is_active) {
                throw new AppError('User not found or inactive', 401);
            }
            
            const tokens = this.generateTokens(decoded.id);
            
            // Blacklist old refresh token
            await redis.setex(
                `blacklist:${refreshToken}`,
                7 * 24 * 60 * 60,
                'revoked'
            );
            
            return tokens;
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new AppError('Invalid refresh token', 401);
            }
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.secret);
            
            // Blacklist refresh token
            const expiry = decoded.exp - Math.floor(Date.now() / 1000);
            if (expiry > 0) {
                await redis.setex(
                    `blacklist:${refreshToken}`,
                    expiry,
                    'revoked'
                );
            }
            
            return { message: 'Logged out successfully' };
        } catch (error) {
            // Token already expired, that's fine
            return { message: 'Logged out successfully' };
        }
    }

    /**
     * Send OTP for phone verification
     */
    async sendOTP(phoneNumber) {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in Redis with 5-minute expiry
        await redis.setex(
            `otp:${phoneNumber}`,
            5 * 60,
            otp
        );
        
        // TODO: Integrate with SMS gateway
        console.log(`OTP for ${phoneNumber}: ${otp}`);
        
        return { message: 'OTP sent successfully', expiresIn: 300 };
    }

    /**
     * Verify OTP
     */
    async verifyOTP(phoneNumber, otp) {
        const storedOTP = await redis.get(`otp:${phoneNumber}`);
        
        if (!storedOTP || storedOTP !== otp) {
            throw new AppError('Invalid or expired OTP', 400);
        }
        
        // Delete OTP after verification
        await redis.del(`otp:${phoneNumber}`);
        
        // Mark phone as verified
        const encryptedPhone = encryption.encrypt(phoneNumber);
        await pool.query(
            'UPDATE users SET is_phone_verified = TRUE WHERE phone_number = $1',
            [encryptedPhone]
        );
        
        return { message: 'Phone number verified successfully' };
    }

    /**
     * Verify Fayda ID
     */
    async verifyFaydaID(userId, faydaIdNumber) {
        // TODO: Integrate with Fayda API
        // For now, simulate verification
        const isVerified = faydaIdNumber.length === 12 && /^\d+$/.test(faydaIdNumber);
        
        if (!isVerified) {
            throw new AppError('Invalid Fayda ID format', 400);
        }
        
        const encryptedFayda = encryption.encrypt(faydaIdNumber);
        
        await pool.query(
            `UPDATE users 
             SET fayda_id_number = $1, is_fayda_verified = TRUE, verification_status = 'verified'
             WHERE id = $2`,
            [encryptedFayda, userId]
        );
        
        return { message: 'Fayda ID verified successfully' };
    }
}

module.exports = new AuthService();
