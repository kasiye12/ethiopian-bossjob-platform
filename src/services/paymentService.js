const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const pool = require('../config/database');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

class PaymentService {
    /**
     * Initialize Telebirr payment
     */
    async initializeTelebirrPayment(paymentData) {
        const {
            amount,
            orderId,
            customerName,
            customerPhone,
            companyId,
            userId,
        } = paymentData;
        
        try {
            // Create payment transaction record
            const { rows } = await pool.query(
                `INSERT INTO payment_transactions 
                 (company_id, user_id, amount, currency, payment_method, status, transaction_reference)
                 VALUES ($1, $2, $3, 'ETB', 'telebirr', 'pending', $4)
                 RETURNING id`,
                [companyId, userId, amount, orderId]
            );
            
            const transactionId = rows[0].id;
            
            // Prepare Telebirr API request
            const timestamp = new Date().toISOString();
            const nonce = crypto.randomBytes(16).toString('hex');
            
            // Create signature
            const signatureString = `${config.telebirr.appId}${timestamp}${nonce}${orderId}`;
            const signature = crypto
                .createHmac('sha256', config.telebirr.appKey)
                .update(signatureString)
                .digest('hex');
            
            const telebirrRequest = {
                appId: config.telebirr.appId,
                timestamp,
                nonce,
                signature,
                order: {
                    orderId,
                    amount,
                    currency: 'ETB',
                    customerName,
                    customerPhone,
                    notifyUrl: `${process.env.BASE_URL}/api/v1/payments/telebirr/callback`,
                    returnUrl: `${process.env.BASE_URL}/payment/success`,
                },
            };
            
            const response = await axios.post(
                `${config.telebirr.apiUrl}/payment`,
                telebirrRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );
            
            if (response.data.code === 0 || response.data.code === '0') {
                return {
                    success: true,
                    transactionId,
                    paymentUrl: response.data.data.paymentUrl,
                };
            } else {
                throw new AppError('Failed to initialize Telebirr payment', 400);
            }
            
        } catch (error) {
            logger.error('Telebirr payment initialization failed:', error);
            throw new AppError('Payment initialization failed. Please try again.', 500);
        }
    }

    /**
     * Initialize Chapa payment
     */
    async initializeChapaPayment(paymentData) {
        const {
            amount,
            orderId,
            email,
            firstName,
            lastName,
            companyId,
            userId,
        } = paymentData;
        
        try {
            // Create payment transaction record
            const { rows } = await pool.query(
                `INSERT INTO payment_transactions 
                 (company_id, user_id, amount, currency, payment_method, status, transaction_reference)
                 VALUES ($1, $2, $3, 'ETB', 'chapa', 'pending', $4)
                 RETURNING id`,
                [companyId, userId, amount, orderId]
            );
            
            const transactionId = rows[0].id;
            
            const chapaRequest = {
                amount,
                currency: 'ETB',
                email,
                first_name: firstName,
                last_name: lastName,
                tx_ref: orderId,
                callback_url: `${process.env.BASE_URL}/api/v1/payments/chapa/callback`,
                return_url: `${process.env.BASE_URL}/payment/success`,
            };
            
            const response = await axios.post(
                `${config.chapa.apiUrl}/transaction/initialize`,
                chapaRequest,
                {
                    headers: {
                        'Authorization': `Bearer ${config.chapa.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );
            
            if (response.data.status === 'success') {
                return {
                    success: true,
                    transactionId,
                    paymentUrl: response.data.data.checkout_url,
                };
            } else {
                throw new AppError('Failed to initialize Chapa payment', 400);
            }
            
        } catch (error) {
            logger.error('Chapa payment initialization failed:', error);
            throw new AppError('Payment initialization failed. Please try again.', 500);
        }
    }

    /**
     * Handle Telebirr webhook callback
     */
    async handleTelebirrCallback(callbackData) {
        try {
            const { orderId, status, transactionId } = callbackData;
            
            // Verify signature
            const isValidSignature = this.verifyTelebirrSignature(callbackData);
            
            if (!isValidSignature) {
                logger.error('Invalid Telebirr callback signature');
                throw new AppError('Invalid signature', 400);
            }
            
            // Update payment transaction
            const { rows } = await pool.query(
                `UPDATE payment_transactions 
                 SET status = $1, transaction_reference = $2, updated_at = NOW()
                 WHERE transaction_reference = $3
                 RETURNING id, company_id, amount`,
                [status === 'SUCCESS' ? 'completed' : 'failed', transactionId, orderId]
            );
            
            if (rows.length > 0 && status === 'SUCCESS') {
                // Credit employer account
                await this.creditEmployerAccount(rows[0].company_id, rows[0].amount);
            }
            
            return { success: true };
            
        } catch (error) {
            logger.error('Telebirr callback processing failed:', error);
            throw error;
        }
    }

    /**
     * Handle Chapa webhook callback
     */
    async handleChapaCallback(callbackData) {
        try {
            const { tx_ref, status, transaction_id } = callbackData;
            
            // Verify webhook signature
            const chapaSignature = callbackData.signature;
            const expectedSignature = crypto
                .createHmac('sha256', config.chapa.apiKey)
                .update(JSON.stringify(callbackData))
                .digest('hex');
            
            if (chapaSignature !== expectedSignature) {
                logger.error('Invalid Chapa callback signature');
                throw new AppError('Invalid signature', 400);
            }
            
            // Update payment transaction
            const { rows } = await pool.query(
                `UPDATE payment_transactions 
                 SET status = $1, transaction_reference = $2, updated_at = NOW()
                 WHERE transaction_reference = $3
                 RETURNING id, company_id, amount`,
                [status === 'success' ? 'completed' : 'failed', transaction_id, tx_ref]
            );
            
            if (rows.length > 0 && status === 'success') {
                // Credit employer account
                await this.creditEmployerAccount(rows[0].company_id, rows[0].amount);
            }
            
            return { success: true };
            
        } catch (error) {
            logger.error('Chapa callback processing failed:', error);
            throw error;
        }
    }

    /**
     * Credit employer account with payment
     */
    async creditEmployerAccount(companyId, amount) {
        try {
            // Calculate credits (e.g., 1 credit per 100 ETB)
            const credits = Math.floor(amount / 100);
            
            // Insert credit transaction
            await pool.query(
                `INSERT INTO credit_transactions 
                 (company_id, amount, transaction_type, reference_type)
                 VALUES ($1, $2, 'credit', 'payment')`,
                [companyId, credits]
            );
            
            logger.info(`Credited ${credits} credits to company ${companyId}`);
            
        } catch (error) {
            logger.error('Failed to credit employer account:', error);
            throw error;
        }
    }

    /**
     * Verify Telebirr signature
     */
    verifyTelebirrSignature(data) {
        // Implement signature verification based on Telebirr documentation
        return true; // Placeholder
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(transactionReference) {
        const { rows } = await pool.query(
            `SELECT id, amount, currency, status, payment_method, transaction_reference, created_at
             FROM payment_transactions
             WHERE transaction_reference = $1`,
            [transactionReference]
        );
        
        return rows[0];
    }
}

module.exports = new PaymentService();
