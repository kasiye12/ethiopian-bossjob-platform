const pool = require('../config/database');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class CompanyController {
    /**
     * Register company - Links company to user
     */
    registerCompany = asyncHandler(async (req, res) => {
        const {
            company_name, industry, company_size, tin_number,
            business_license_number, region, sub_city, phone_number,
            email, description, website, company_position
        } = req.body;
        
        console.log('🏢 Company registration:', { company_name, userId: req.user.id });
        
        // Validate required fields
        if (!company_name || !tin_number || !region) {
            throw new AppError('Company name, TIN, and region are required', 400);
        }
        
        // Check if user already has a company
        const existingCompany = await pool.query(
            'SELECT id FROM companies WHERE owner_id = $1',
            [req.user.id]
        );
        
        if (existingCompany.rows.length > 0) {
            throw new AppError('You already have a registered company', 409);
        }
        
        // Check if TIN already exists
        const existingTIN = await pool.query(
            'SELECT id FROM companies WHERE tin_number = $1',
            [tin_number]
        );
        
        if (existingTIN.rows.length > 0) {
            throw new AppError('Company with this TIN already exists', 409);
        }
        
        // Handle file upload
        const licenseUrl = req.file ? `/uploads/company-licenses/${req.file.filename}` : null;
        
        // Create company
        const { rows } = await pool.query(
            `INSERT INTO companies (
                owner_id, company_name, tin_number, trade_license_url,
                business_license_number, industry, company_size, website,
                description, region, sub_city, phone_number, email,
                is_verified, verification_status, company_position
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                req.user.id, company_name, tin_number, licenseUrl,
                business_license_number, industry, company_size, website,
                description, region, sub_city, phone_number, email,
                false, 'pending', company_position || 'HR Manager'
            ]
        );
        
        const company = rows[0];
        
        // Update user role to boss if currently candidate
        await pool.query(
            "UPDATE users SET role = 'boss', company_position = $1 WHERE id = $2",
            [company_position || 'HR Manager', req.user.id]
        );
        
        console.log('✅ Company created:', company.company_name);
        
        return ApiResponse.success(res, company, 'Company registered successfully', 201);
    });

    /**
     * Get current user's company with user info
     */
    getMyCompany = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT c.*, u.full_name as owner_name, u.phone_number as owner_phone, u.email as owner_email
             FROM companies c
             JOIN users u ON c.owner_id = u.id
             WHERE c.owner_id = $1`,
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return ApiResponse.success(res, null, 'No company registered');
        }
        
        return ApiResponse.success(res, rows[0], 'Company retrieved');
    });

    /**
     * Update company and user position
     */
    updateCompany = asyncHandler(async (req, res) => {
        const updates = req.body;
        
        const allowedFields = [
            'company_name', 'industry', 'company_size', 'website',
            'description', 'region', 'sub_city', 'phone_number', 'email'
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
        
        if (updateFields.length > 0) {
            updateValues.push(req.user.id);
            await pool.query(
                `UPDATE companies SET ${updateFields.join(', ')}, updated_at = NOW()
                 WHERE owner_id = $${paramCount}
                 RETURNING *`,
                updateValues
            );
        }
        
        // Update user position if provided
        if (updates.company_position) {
            await pool.query(
                'UPDATE users SET company_position = $1 WHERE id = $2',
                [updates.company_position, req.user.id]
            );
        }
        
        // Get updated company
        const { rows } = await pool.query(
            `SELECT c.*, u.full_name as owner_name, u.company_position
             FROM companies c
             JOIN users u ON c.owner_id = u.id
             WHERE c.owner_id = $1`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows[0], 'Company updated');
    });

    /**
     * Update company position (role within company)
     */
    updatePosition = asyncHandler(async (req, res) => {
        const { company_position } = req.body;
        
        const validPositions = ['Owner', 'Founder', 'CEO', 'HR Director', 'HR Manager', 'HR Officer'];
        
        if (!validPositions.includes(company_position)) {
            throw new AppError('Invalid position. Valid: ' + validPositions.join(', '), 400);
        }
        
        // Update company
        await pool.query(
            'UPDATE companies SET company_position = $1 WHERE owner_id = $2',
            [company_position, req.user.id]
        );
        
        // Update user
        await pool.query(
            'UPDATE users SET company_position = $1 WHERE id = $2',
            [company_position, req.user.id]
        );
        
        return ApiResponse.success(res, { position: company_position }, 'Position updated');
    });

    /**
     * Get company details with jobs count
     */
    getCompanyDetails = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const { rows } = await pool.query(
            `SELECT c.*, u.full_name as owner_name,
                    (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) as total_jobs,
                    (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'active') as active_jobs
             FROM companies c
             JOIN users u ON c.owner_id = u.id
             WHERE c.id = $1`,
            [id]
        );
        
        if (rows.length === 0) {
            throw new AppError('Company not found', 404);
        }
        
        return ApiResponse.success(res, rows[0], 'Company details retrieved');
    });

    /**
     * List all companies (public)
     */
    listCompanies = asyncHandler(async (req, res) => {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const { rows } = await pool.query(
            `SELECT c.id, c.company_name, c.industry, c.company_size, c.region, c.sub_city,
                    c.is_verified, c.company_logo_url,
                    (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'active') as active_jobs_count
             FROM companies c
             WHERE c.is_verified = true
             ORDER BY c.company_name
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        
        return ApiResponse.success(res, rows, 'Companies retrieved');
    });
}

module.exports = new CompanyController();
