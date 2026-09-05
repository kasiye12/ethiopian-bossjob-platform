const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

// List jobs (public)
router.get('/',
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 20, search, category, region, job_type } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT j.*, c.company_name, c.company_logo_url
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            WHERE j.status = 'active'
        `;
        const params = [];
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (j.title ILIKE $${params.length} OR c.company_name ILIKE $${params.length})`;
        }
        
        if (category) {
            params.push(category);
            query += ` AND j.category = $${params.length}`;
        }
        
        if (region) {
            params.push(region);
            query += ` AND j.region = $${params.length}`;
        }
        
        if (job_type) {
            params.push(job_type);
            query += ` AND j.job_type = $${params.length}`;
        }
        
        query += ` ORDER BY j.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const { rows } = await pool.query(query, params);
        
        return ApiResponse.success(res, rows, 'Jobs retrieved');
    })
);

// Get my jobs (boss users)
router.get('/my',
    authMiddleware.authenticate,
    authMiddleware.authorize('boss', 'admin'),
    asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT j.*, c.company_name
             FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE c.owner_id = $1
             ORDER BY j.created_at DESC`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows, 'My jobs retrieved');
    })
);

// Get job categories (public)
router.get('/categories',
    asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT DISTINCT category, COUNT(*) as job_count
             FROM jobs WHERE status = 'active'
             GROUP BY category ORDER BY category`
        );
        return ApiResponse.success(res, rows, 'Categories retrieved');
    })
);

// Create job (boss users)
router.post('/',
    authMiddleware.authenticate,
    authMiddleware.authorize('boss', 'admin'),
    asyncHandler(async (req, res) => {
        const {
            title, description, requirements, job_type, category,
            region, sub_city, salary_min_etb, salary_max_etb,
            experience_level, education_level_required, number_of_positions
        } = req.body;
        
        // Get user's company
        const companyResult = await pool.query(
            'SELECT id FROM companies WHERE owner_id = $1',
            [req.user.id]
        );
        
        if (companyResult.rows.length === 0) {
            throw new AppError('You need to register a company first', 403);
        }
        
        const companyId = companyResult.rows[0].id;
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        
        const { rows } = await pool.query(
            `INSERT INTO jobs (
                company_id, posted_by, title, slug, description, requirements,
                job_type, category, region, sub_city, salary_min_etb, salary_max_etb,
                experience_level, education_level_required, number_of_positions,
                status, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', NOW())
            RETURNING *`,
            [companyId, req.user.id, title, slug, description, requirements, job_type, category, region, sub_city, salary_min_etb, salary_max_etb, experience_level, education_level_required, number_of_positions || 1]
        );
        
        return ApiResponse.success(res, rows[0], 'Job created', 201);
    })
);

// Get job by ID (public)
router.get('/:id',
    asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT j.*, c.company_name, c.company_logo_url, c.industry
             FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE j.id = $1`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            throw new AppError('Job not found', 404);
        }
        
        return ApiResponse.success(res, rows[0], 'Job retrieved');
    })
);

// Update job (boss users)
router.put('/:id',
    authMiddleware.authenticate,
    authMiddleware.authorize('boss', 'admin'),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        
        const allowedFields = [
            'title', 'description', 'requirements', 'job_type', 'category',
            'region', 'sub_city', 'salary_min_etb', 'salary_max_etb',
            'experience_level', 'status'
        ];
        
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updateFields.push(`${key} = $${paramCount}`);
                updateValues.push(value);
                paramCount++;
            }
        }
        
        if (updateFields.length === 0) {
            throw new AppError('No valid fields to update', 400);
        }
        
        updateValues.push(id);
        updateValues.push(req.user.id);
        
        const { rows } = await pool.query(
            `UPDATE jobs SET ${updateFields.join(', ')}, updated_at = NOW()
             WHERE id = $${paramCount} AND posted_by = $${paramCount + 1}
             RETURNING *`,
            updateValues
        );
        
        if (rows.length === 0) {
            throw new AppError('Job not found or access denied', 404);
        }
        
        return ApiResponse.success(res, rows[0], 'Job updated');
    })
);

// Delete job (boss users)
router.delete('/:id',
    authMiddleware.authenticate,
    authMiddleware.authorize('boss', 'admin'),
    asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            'DELETE FROM jobs WHERE id = $1 AND posted_by = $2 RETURNING id',
            [req.params.id, req.user.id]
        );
        
        if (rows.length === 0) {
            throw new AppError('Job not found or access denied', 404);
        }
        
        return ApiResponse.success(res, null, 'Job deleted');
    })
);

module.exports = router;
