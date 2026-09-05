const pool = require('../config/database');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class ApplicationController {
    /**
     * Apply for a job - Accepts all fields without strict validation
     */
    applyForJob = asyncHandler(async (req, res) => {
        const { jobId } = req.params;
        const {
            cover_letter,
            expected_salary,
            desired_title,
            desired_location,
            desired_job_type,
            expected_salary_min,
            expected_salary_max,
            salary_type,
        } = req.body;
        
        console.log('📝 Application submission:', { jobId, candidateId: req.user.id });
        
        // Check if job exists
        const jobResult = await pool.query(
            'SELECT id, status FROM jobs WHERE id = $1',
            [jobId]
        );
        
        if (jobResult.rows.length === 0) {
            throw new AppError('Job not found', 404);
        }
        
        if (jobResult.rows[0].status !== 'active') {
            throw new AppError('This job is no longer accepting applications', 400);
        }
        
        // Check if already applied
        const existing = await pool.query(
            'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
            [jobId, req.user.id]
        );
        
        if (existing.rows.length > 0) {
            throw new AppError('You have already applied for this job', 409);
        }
        
        // Determine salary
        const finalSalary = expected_salary || expected_salary_min || null;
        
        // Create application
        const { rows } = await pool.query(
            `INSERT INTO applications (job_id, candidate_id, cover_letter, expected_salary, status)
             VALUES ($1, $2, $3, $4, 'applied')
             RETURNING *`,
            [jobId, req.user.id, cover_letter || null, finalSalary]
        );
        
        // Update job application count
        await pool.query(
            'UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1',
            [jobId]
        );
        
        // Also update candidate profile with preferences
        await pool.query(
            `UPDATE candidate_profiles SET 
                profession_title = COALESCE($1, profession_title),
                current_location = COALESCE($2, current_location),
                expected_salary_min = COALESCE($3, expected_salary_min),
                expected_salary_max = COALESCE($4, expected_salary_max),
                updated_at = NOW()
             WHERE user_id = $5`,
            [desired_title, desired_location, expected_salary_min, expected_salary_max, req.user.id]
        );
        
        console.log('✅ Application submitted successfully');
        
        return ApiResponse.success(res, rows[0], 'Application submitted successfully', 201);
    });

    /**
     * Get user's applications
     */
    getMyApplications = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT a.*, j.title, j.company_id, c.company_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN companies c ON j.company_id = c.id
             WHERE a.candidate_id = $1
             ORDER BY a.created_at DESC`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows, 'Applications retrieved');
    });

    /**
     * Get applications for a job (employer)
     */
    getJobApplications = asyncHandler(async (req, res) => {
        const { jobId } = req.params;
        
        const { rows } = await pool.query(
            `SELECT a.*, u.full_name, u.phone_number, u.email
             FROM applications a
             JOIN users u ON a.candidate_id = u.id
             WHERE a.job_id = $1
             ORDER BY a.created_at DESC`,
            [jobId]
        );
        
        return ApiResponse.success(res, rows, 'Applications retrieved');
    });

    /**
     * Update application status
     */
    updateApplicationStatus = asyncHandler(async (req, res) => {
        const { applicationId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['applied', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'];
        
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid status', 400);
        }
        
        const { rows } = await pool.query(
            `UPDATE applications SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, applicationId]
        );
        
        if (rows.length === 0) {
            throw new AppError('Application not found', 404);
        }
        
        return ApiResponse.success(res, rows[0], 'Status updated');
    });
}

module.exports = new ApplicationController();
