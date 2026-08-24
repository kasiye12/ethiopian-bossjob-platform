const paymentService = require('../services/paymentService');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class PaymentController {
    /**
     * Initialize payment
     */
    initializePayment = asyncHandler(async (req, res) => {
        const { amount, payment_method, order_id } = req.body;
        const companyId = req.user.company_id; // Assuming employer has company_id
        
        let result;
        
        if (payment_method === 'telebirr') {
            result = await paymentService.initializeTelebirrPayment({
                amount,
                orderId: order_id,
                customerName: req.user.full_name,
                customerPhone: req.user.phone_number,
                companyId,
                userId: req.user.id,
            });
        } else if (payment_method === 'chapa') {
            result = await paymentService.initializeChapaPayment({
                amount,
                orderId: order_id,
                email: req.user.email,
                firstName: req.user.full_name.split(' ')[0],
                lastName: req.user.full_name.split(' ').slice(1).join(' '),
                companyId,
                userId: req.user.id,
            });
        } else {
            throw new AppError('Invalid payment method', 400);
        }
        
        return ApiResponse.success(res, result, 'Payment initialized');
    });

    /**
     * Telebirr callback
     */
    telebirrCallback = asyncHandler(async (req, res) => {
        const result = await paymentService.handleTelebirrCallback(req.body);
        return ApiResponse.success(res, result, 'Callback processed');
    });

    /**
     * Chapa callback
     */
    chapaCallback = asyncHandler(async (req, res) => {
        const result = await paymentService.handleChapaCallback(req.body);
        return ApiResponse.success(res, result, 'Callback processed');
    });

    /**
     * Get payment status
     */
    getPaymentStatus = asyncHandler(async (req, res) => {
        const { transactionReference } = req.params;
        const status = await paymentService.getPaymentStatus(transactionReference);
        
        if (!status) {
            throw new AppError('Transaction not found', 404);
        }
        
        return ApiResponse.success(res, status, 'Payment status retrieved');
    });
}

module.exports = new PaymentController();
