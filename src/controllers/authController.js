const authService = require('../services/authService');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class AuthController {
    /**
     * Register new user
     */
    register = asyncHandler(async (req, res) => {
        const { user, tokens } = await authService.register(req.body);
        
        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: 'strict',
        });
        
        return ApiResponse.success(
            res,
            { user, accessToken: tokens.accessToken },
            'Registration successful',
            201
        );
    });

    /**
     * Login user
     */
    login = asyncHandler(async (req, res) => {
        const { phone_number, password } = req.body;
        const { user, tokens } = await authService.login(phone_number, password);
        
        // Set refresh token in HTTP-only cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
        });
        
        return ApiResponse.success(
            res,
            { user, accessToken: tokens.accessToken },
            'Login successful'
        );
    });

    /**
     * Refresh access token
     */
    refreshToken = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        
        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400);
        }
        
        const tokens = await authService.refreshToken(refreshToken);
        
        // Update refresh token cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'strict',
        });
        
        return ApiResponse.success(
            res,
            { accessToken: tokens.accessToken },
            'Token refreshed successfully'
        );
    });

    /**
     * Logout user
     */
    logout = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken;
        
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        
        // Clear cookie
        res.clearCookie('refreshToken');
        
        return ApiResponse.success(res, null, 'Logout successful');
    });

    /**
     * Send OTP
     */
    sendOTP = asyncHandler(async (req, res) => {
        const { phone_number } = req.body;
        const result = await authService.sendOTP(phone_number);
        
        return ApiResponse.success(res, result, 'OTP sent');
    });

    /**
     * Verify OTP
     */
    verifyOTP = asyncHandler(async (req, res) => {
        const { phone_number, otp } = req.body;
        const result = await authService.verifyOTP(phone_number, otp);
        
        return ApiResponse.success(res, result, 'OTP verified');
    });

    /**
     * Verify Fayda ID
     */
    verifyFayda = asyncHandler(async (req, res) => {
        const { fayda_id_number } = req.body;
        const result = await authService.verifyFaydaID(req.user.id, fayda_id_number);
        
        return ApiResponse.success(res, result, 'Fayda ID verified');
    });

    /**
     * Get current user profile
     */
    getMe = asyncHandler(async (req, res) => {
        // User is already attached to req by auth middleware
        return ApiResponse.success(res, req.user, 'User profile retrieved');
    });
}

module.exports = new AuthController();
