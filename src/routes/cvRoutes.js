const express = require('express');
const authMiddleware = require('../middleware/auth');
const cvGenerator = require('../services/cvGenerator');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/generate', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const result = await cvGenerator.generateCV(req.user.id);
    return ApiResponse.success(res, result, 'CV generated successfully');
}));

module.exports = router;
