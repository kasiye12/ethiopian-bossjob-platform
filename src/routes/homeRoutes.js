const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/', homeController.welcome);
router.get('/api-docs', homeController.apiDocs);

module.exports = router;
