const express = require('express');
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// No strict validation - accept all fields
router.post('/:jobId/apply', authMiddleware.authenticate, applicationController.applyForJob);
router.get('/my', authMiddleware.authenticate, applicationController.getMyApplications);
router.get('/job/:jobId', authMiddleware.authenticate, applicationController.getJobApplications);
router.put('/:applicationId/status', authMiddleware.authenticate, applicationController.updateApplicationStatus);

module.exports = router;
