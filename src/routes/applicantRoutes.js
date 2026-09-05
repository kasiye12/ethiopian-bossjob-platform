const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Get applicant full CV
router.get('/:candidateId/cv', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const { candidateId } = req.params;
    
    // Get user info
    const userResult = await pool.query(
        'SELECT id, full_name, phone_number, email FROM users WHERE id = $1',
        [candidateId]
    );
    
    // Get candidate profile
    const profileResult = await pool.query(
        'SELECT * FROM candidate_profiles WHERE user_id = $1',
        [candidateId]
    );
    
    if (userResult.rows.length === 0) {
        return ApiResponse.success(res, null, 'Candidate not found');
    }
    
    const cvData = {
        user: userResult.rows[0],
        profile: profileResult.rows[0] || null,
    };
    
    return ApiResponse.success(res, cvData, 'CV retrieved');
}));

// Get all applicants for employer
router.get('/applicants', authMiddleware.authenticate, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT a.*, u.full_name, u.phone_number, u.email, cp.profession_title, cp.years_of_experience
         FROM applications a
         JOIN users u ON a.candidate_id = u.id
         LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
         JOIN jobs j ON a.job_id = j.id
         JOIN companies c ON j.company_id = c.id
         WHERE c.owner_id = $1
         ORDER BY a.created_at DESC`,
        [req.user.id]
    );
    
    return ApiResponse.success(res, rows, 'Applicants retrieved');
}));

module.exports = router;
