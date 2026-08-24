const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
    phone_number: Joi.string()
        .pattern(/^\+251[0-9]{9}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be in +251 format',
        }),
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().min(3).max(255).required(),
    role: Joi.string().valid('candidate', 'boss').default('candidate'),
});

const loginSchema = Joi.object({
    phone_number: Joi.string().required(),
    password: Joi.string().required(),
});

const otpSchema = Joi.object({
    phone_number: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
    phone_number: Joi.string().required(),
    otp: Joi.string().length(6).required(),
});

const faydaSchema = Joi.object({
    fayda_id_number: Joi.string().length(12).pattern(/^\d+$/).required(),
});

// Routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/send-otp', validate(otpSchema), authController.sendOTP);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOTP);
router.post('/verify-fayda', authMiddleware.authenticate, validate(faydaSchema), authController.verifyFayda);
router.get('/me', authMiddleware.authenticate, authController.getMe);

module.exports = router;
