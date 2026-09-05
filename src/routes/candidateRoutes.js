const express = require('express');
const candidateController = require('../controllers/candidateController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/my-profile', authMiddleware.authenticate, candidateController.getProfile);
router.put('/update-profile', authMiddleware.authenticate, candidateController.updateProfile);
router.post('/upload-cv', authMiddleware.authenticate, upload.single('cv'), candidateController.uploadCV);
router.get('/', authMiddleware.authenticate, authMiddleware.authorize('boss', 'admin'), candidateController.listCandidates);

module.exports = router;
