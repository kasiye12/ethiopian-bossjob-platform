const pool = require('../config/database');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class JobController {
    /**
     * List all jobs with filters
     */
    listJobs = asyncHandler(async (req, res) => {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            category, 
            region, 
            job_type,
            experience_level,
            company_id
        } = req.query;
        
        const offset = (page - 1) * limit;
        let query = `
            SELECT j.*, c.company_name, c.company_logo_url, c.industry
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            WHERE j.status = 'active'
        `;
        const params = [];
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (j.title ILIKE $${params.length} OR j.description ILIKE $${params.length} OR c.company_name ILIKE $${params.length})`;
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
        
        if (experience_level) {
            params.push(experience_level);
            query += ` AND j.experience_level = $${params.length}`;
        }
        
        if (company_id) {
            params.push(company_id);
            query += ` AND j.company_id = $${params.length}`;
        }
        
        // Get total count
        const countQuery = query.replace(
            'SELECT j.*, c.company_name, c.company_logo_url, c.industry',
            'SELECT COUNT(*)'
        );
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);
        
        // Get paginated results
        query += ` ORDER BY 
            CASE WHEN j.is_featured THEN 0 ELSE 1 END,
            CASE WHEN j.is_urgent THEN 0 ELSE 1 END,
            j.created_at DESC 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const { rows } = await pool.query(query, params);
        
        return ApiResponse.paginated(res, rows, {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
        });
    });

    /**
     * Get current user's jobs (employer)
     */
    getMyJobs = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT j.*, c.company_name
             FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE c.owner_id = $1
             ORDER BY j.created_at DESC`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows, 'Jobs retrieved');
    });

    /**
     * Get job details
     */
    getJob = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const { rows } = await pool.query(
            `SELECT j.*, c.company_name, c.company_logo_url, c.industry, c.company_size,
                    c.website, c.description as company_description
             FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE j.id = $1 AND j.status = 'active'`,
            [id]
        );
        
        if (rows.length === 0) {
            throw new AppError('Job not found', 404);
        }
        
        // Increment view count
        await pool.query(
            'UPDATE jobs SET views_count = views_count + 1 WHERE id = $1',
            [id]
        );
        
        return ApiResponse.success(res, rows[0], 'Job retrieved successfully');
    });

    /**
     * Create a new job
     */
    createJob = asyncHandler(async (req, res) => {
        const {
            title,
            description,
            requirements,
            job_type,
            category,
            region,
            sub_city,
            salary_min_etb,
            salary_max_etb,
            experience_level,
            number_of_positions,
            education_level_required,
            is_salary_negotiable,
        } = req.body;
        
        // Get user's company
        const companyResult = await pool.query(
            'SELECT id, is_verified FROM companies WHERE owner_id = $1',
            [req.user.id]
        );
        
        if (companyResult.rows.length === 0) {
            throw new AppError('You need to register a company first', 403);
        }
        
        const companyId = companyResult.rows[0].id;
        
        // Create slug
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        
        const { rows } = await pool.query(
            `INSERT INTO jobs (
                company_id, posted_by, title, slug, description, requirements,
                job_type, category, region, sub_city, salary_min_etb,
                salary_max_etb, experience_level, number_of_positions,
                education_level_required, is_salary_negotiable, status, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active', NOW())
            RETURNING *`,
            [
                companyId,
                req.user.id,
                title,
                slug,
                description,
                requirements,
                job_type,
                category,
                region,
                sub_city,
                salary_min_etb,
                salary_max_etb,
                experience_level,
                number_of_positions || 1,
                education_level_required,
                is_salary_negotiable || false,
            ]
        );
        
        return ApiResponse.success(res, rows[0], 'Job created successfully', 201);
    });

    /**
     * Update a job
     */
    updateJob = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        
        // Verify job ownership
        const { rows: jobRows } = await pool.query(
            `SELECT j.* FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE j.id = $1 AND c.owner_id = $2`,
            [id, req.user.id]
        );
        
        if (jobRows.length === 0) {
            throw new AppError('Job not found or you do not have permission', 404);
        }
        
        // Build update query dynamically
        const allowedFields = [
            'title', 'description', 'requirements', 'job_type', 'category',
            'region', 'sub_city', 'salary_min_etb', 'salary_max_etb',
            'experience_level', 'number_of_positions', 'education_level_required',
            'is_salary_negotiable', 'status', 'is_featured', 'is_urgent'
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
        
        const { rows } = await pool.query(
            `UPDATE jobs SET ${updateFields.join(', ')}, updated_at = NOW()
             WHERE id = $${paramCount}
             RETURNING *`,
            updateValues
        );
        
        return ApiResponse.success(res, rows[0], 'Job updated successfully');
    });

    /**
     * Delete a job
     */
    deleteJob = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const { rows } = await pool.query(
            `DELETE FROM jobs WHERE id = $1 AND posted_by = $2 RETURNING id`,
            [id, req.user.id]
        );
        
        if (rows.length === 0) {
            throw new AppError('Job not found or you do not have permission', 404);
        }
        
        return ApiResponse.success(res, null, 'Job deleted successfully');
    });

    /**
     * Get job categories
     */
    getCategories = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT DISTINCT category, COUNT(*) as job_count
             FROM jobs
             WHERE status = 'active'
             GROUP BY category
             ORDER BY category`
        );
        
        return ApiResponse.success(res, rows, 'Categories retrieved');
    });

    /**
     * Get job statistics
     */
    getStats = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT 
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_jobs,
                COUNT(CASE WHEN is_featured THEN 1 END) as featured_jobs,
                COUNT(CASE WHEN is_urgent THEN 1 END) as urgent_jobs,
                SUM(applications_count) as total_applications,
                SUM(views_count) as total_views
             FROM jobs
             WHERE posted_by = $1`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows[0], 'Stats retrieved');
    });
}

module.exports = new JobController();
