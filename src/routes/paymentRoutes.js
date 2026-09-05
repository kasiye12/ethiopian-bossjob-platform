const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

const router = express.Router();

// Initialize payment
router.post('/initialize', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const { amount, payment_method, order_id, plan } = req.body;
    
    if (!amount || !payment_method || !order_id) {
        throw new AppError('Missing required fields', 400);
    }
    
    // Get user's company
    const companyResult = await pool.query(
        'SELECT id FROM companies WHERE owner_id = $1',
        [req.user.id]
    );
    
    const companyId = companyResult.rows[0]?.id;
    
    // Create payment transaction
    const { rows } = await pool.query(
        `INSERT INTO payment_transactions (company_id, user_id, amount, currency, payment_method, status, transaction_reference, metadata)
         VALUES ($1, $2, $3, 'ETB', $4, 'pending', $5, $6)
         RETURNING id`,
        [companyId, req.user.id, amount, payment_method, order_id, { plan }]
    );
    
    // In production, integrate with Telebirr or Chapa API
    // For now, simulate payment URL
    const paymentUrl = `/payment/success?order=${order_id}`;
    
    return ApiResponse.success(res, {
        transactionId: rows[0].id,
        paymentUrl,
        orderId: order_id,
    }, 'Payment initialized');
}));

// Payment callback (webhook)
router.post('/callback', asyncHandler(async (req, res) => {
    const { order_id, status, transaction_id } = req.body;
    
    // Update payment status
    await pool.query(
        `UPDATE payment_transactions 
         SET status = $1, transaction_reference = $2, updated_at = NOW()
         WHERE transaction_reference = $3`,
        [status === 'SUCCESS' ? 'completed' : 'failed', transaction_id, order_id]
    );
    
    // If payment successful, credit employer account
    if (status === 'SUCCESS') {
        const paymentResult = await pool.query(
            'SELECT company_id, amount FROM payment_transactions WHERE transaction_reference = $1',
            [order_id]
        );
        
        if (paymentResult.rows.length > 0) {
            const { company_id, amount } = paymentResult.rows[0];
            const credits = Math.floor(amount / 100);
            
            await pool.query(
                `INSERT INTO credit_transactions (company_id, amount, transaction_type, reference_type)
                 VALUES ($1, $2, 'credit', 'payment')`,
                [company_id, credits]
            );
        }
    }
    
    return ApiResponse.success(res, null, 'Payment processed');
}));

// Get payment history
router.get('/history', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT * FROM payment_transactions 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [req.user.id]
    );
    
    return ApiResponse.success(res, rows, 'Payment history retrieved');
}));

// Get credit balance
router.get('/credits', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const companyResult = await pool.query(
        'SELECT id FROM companies WHERE owner_id = $1',
        [req.user.id]
    );
    
    if (companyResult.rows.length === 0) {
        return ApiResponse.success(res, { balance: 0 }, 'Credit balance');
    }
    
    const creditResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as balance
         FROM credit_transactions
         WHERE company_id = $1`,
        [companyResult.rows[0].id]
    );
    
    return ApiResponse.success(res, { balance: creditResult.rows[0].balance }, 'Credit balance');
}));

module.exports = router;
