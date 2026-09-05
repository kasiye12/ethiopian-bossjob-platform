const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

// API Index
router.get('/', apiController.index);

module.exports = router;
