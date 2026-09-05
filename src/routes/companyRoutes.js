const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// Register company (boss users)
router.post('/register', 
    authMiddleware.authenticate, 
    authMiddleware.authorize('boss', 'admin'),
    upload.single('license_file'),
    asyncHandler(async (req, res) => {
        const {
            company_name, industry, company_size, tin_number,
            business_license_number, region, sub_city, phone_number,
            email, description, website
        } = req.body;
        
        // Check if company exists
        const existing = await pool.query(
            'SELECT id FROM companies WHERE tin_number = $1',
            [tin_number]
        );
        
        if (existing.rows.length > 0) {
            throw new AppError('Company with this TIN already exists', 409);
        }
        
        const licenseUrl = req.file ? `/uploads/company-licenses/${req.file.filename}` : null;
        
        const { rows } = await pool.query(
            `INSERT INTO companies (
                owner_id, company_name, tin_number, trade_license_url,
                business_license_number, industry, company_size, website,
                description, region, sub_city, phone_number, email,
                is_verified, verification_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                req.user.id, company_name, tin_number, licenseUrl,
                business_license_number, industry, company_size, website,
                description, region, sub_city, phone_number, email,
                false, 'pending'
            ]
        );
        
        return ApiResponse.success(res, rows[0], 'Company registered', 201);
    })
);

// Get my company
router.get('/my', 
    authMiddleware.authenticate,
    asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            'SELECT * FROM companies WHERE owner_id = $1',
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return ApiResponse.success(res, null, 'No company registered');
        }
        
        return ApiResponse.success(res, rows[0], 'Company retrieved');
    })
);

// Update company position
router.put('/update-position',
    authMiddleware.authenticate,
    asyncHandler(async (req, res) => {
        const { company_position } = req.body;
        
        const validPositions = ['Owner', 'Founder', 'CEO', 'HR Director', 'HR Manager', 'HR Officer'];
        
        if (!validPositions.includes(company_position)) {
            throw new AppError('Invalid position. Valid: ' + validPositions.join(', '), 400);
        }
        
        await pool.query(
            'UPDATE companies SET company_position = $1 WHERE owner_id = $2',
            [company_position, req.user.id]
        );
        
        await pool.query(
            'UPDATE users SET company_position = $1 WHERE id = $2',
            [company_position, req.user.id]
        );
        
        return ApiResponse.success(res, { position: company_position }, 'Position updated');
    })
);

// Get company positions
router.get('/positions',
    asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            'SELECT * FROM company_positions ORDER BY position_level DESC'
        );
        return ApiResponse.success(res, rows, 'Positions retrieved');
    })
);

// List all companies (public)
router.get('/',
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const { rows } = await pool.query(
            `SELECT id, company_name, industry, company_size, region, sub_city, 
                    is_verified, company_position, company_logo_url
             FROM companies
             WHERE is_verified = true
             ORDER BY company_name
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        
        return ApiResponse.success(res, rows, 'Companies retrieved');
    })
);

// Get company by ID
router.get('/:id',
    asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'active') as active_jobs_count
             FROM companies c
             WHERE c.id = $1`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            throw new AppError('Company not found', 404);
        }
        
        return ApiResponse.success(res, rows[0], 'Company retrieved');
    })
);

module.exports = router;
