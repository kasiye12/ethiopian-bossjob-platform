const express = require('express');
const talentController = require('../controllers/talentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('boss', 'admin'));

router.get('/search', talentController.searchTalents);
router.get('/recommended', talentController.getRecommendedTalents);
router.get('/saved', talentController.getSavedTalents);
router.get('/viewed', talentController.getViewedTalents);
router.get('/:talentId', talentController.getTalentProfile);
router.post('/:talentId/save', talentController.saveTalent);
router.delete('/:talentId/save', talentController.removeSavedTalent);
router.post('/:talentId/view', talentController.markViewed);

module.exports = router;
