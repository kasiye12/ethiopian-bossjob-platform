const express = require('express');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const notifications = await notificationService.getNotifications(req.user.id, page, limit);
    return ApiResponse.success(res, notifications, 'Notifications retrieved');
}));

router.get('/unread-count', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    return ApiResponse.success(res, { count }, 'Unread count retrieved');
}));

router.put('/:id/read', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    await notificationService.markAsRead(req.params.id, req.user.id);
    return ApiResponse.success(res, null, 'Notification marked as read');
}));

router.put('/mark-all-read', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user.id);
    return ApiResponse.success(res, null, 'All notifications marked as read');
}));

module.exports = router;
