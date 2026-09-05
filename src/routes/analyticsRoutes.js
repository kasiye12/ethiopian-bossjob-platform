const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware.authenticate);

router.get('/', analyticsController.getAnalytics);
router.get('/interviews', analyticsController.getInterviewAnalytics);
router.get('/talents', analyticsController.getTalentAnalytics);
router.get('/revenue', authMiddleware.authorize('admin'), analyticsController.getRevenueAnalytics);

module.exports = router;
