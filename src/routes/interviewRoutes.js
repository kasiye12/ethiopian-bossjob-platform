const express = require('express');
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('boss', 'admin'));

router.post('/', interviewController.scheduleInterview);
router.get('/', interviewController.getInterviews);
router.get('/upcoming', interviewController.getUpcomingInterviews);
router.put('/:interviewId/status', interviewController.updateInterviewStatus);
router.delete('/:interviewId', interviewController.cancelInterview);

module.exports = router;
