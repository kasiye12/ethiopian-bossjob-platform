const pool = require('../config/database');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class InterviewController {
    /**
     * Schedule interview
     */
    scheduleInterview = asyncHandler(async (req, res) => {
        const {
            candidate_id,
            job_id,
            interview_date,
            interview_time,
            interview_type,
            location,
            notes,
            calendar_type
        } = req.body;
        
        // Validate job ownership
        const jobResult = await pool.query(
            `SELECT j.id FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE j.id = $1 AND c.owner_id = $2`,
            [job_id, req.user.id]
        );
        
        if (jobResult.rows.length === 0) {
            throw new AppError('Job not found or access denied', 404);
        }
        
        const { rows } = await pool.query(
            `INSERT INTO interviews (
                employer_id, candidate_id, job_id, interview_date,
                interview_time, interview_type, location, notes,
                calendar_type, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
            RETURNING *`,
            [
                req.user.id,
                candidate_id,
                job_id,
                interview_date,
                interview_time,
                interview_type || 'in-person',
                location,
                notes,
                calendar_type || 'gregorian'
            ]
        );
        
        return ApiResponse.success(res, rows[0], 'Interview scheduled', 201);
    });

    /**
     * Get interviews (employer view)
     */
    getInterviews = asyncHandler(async (req, res) => {
        const { status } = req.query;
        
        let query = `
            SELECT i.*, u.full_name as candidate_name, u.phone_number,
                   j.title as job_title
            FROM interviews i
            JOIN users u ON i.candidate_id = u.id
            JOIN jobs j ON i.job_id = j.id
            WHERE i.employer_id = $1
        `;
        const params = [req.user.id];
        
        if (status) {
            params.push(status);
            query += ` AND i.status = $${params.length}`;
        }
        
        query += ` ORDER BY i.interview_date DESC, i.interview_time DESC`;
        
        const { rows } = await pool.query(query, params);
        
        return ApiResponse.success(res, rows, 'Interviews retrieved');
    });

    /**
     * Get upcoming interviews
     */
    getUpcomingInterviews = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT i.*, u.full_name as candidate_name, j.title as job_title
             FROM interviews i
             JOIN users u ON i.candidate_id = u.id
             JOIN jobs j ON i.job_id = j.id
             WHERE i.employer_id = $1
             AND i.status = 'scheduled'
             AND i.interview_date >= CURRENT_DATE
             ORDER BY i.interview_date ASC, i.interview_time ASC
             LIMIT 10`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows, 'Upcoming interviews retrieved');
    });

    /**
     * Update interview status
     */
    updateInterviewStatus = asyncHandler(async (req, res) => {
        const { interviewId } = req.params;
        const { status, feedback } = req.body;
        
        const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'];
        
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid status', 400);
        }
        
        const { rows } = await pool.query(
            `UPDATE interviews 
             SET status = $1, feedback = $2, updated_at = NOW()
             WHERE id = $3 AND employer_id = $4
             RETURNING *`,
            [status, feedback, interviewId, req.user.id]
        );
        
        if (rows.length === 0) {
            throw new AppError('Interview not found', 404);
        }
        
        return ApiResponse.success(res, rows[0], 'Interview updated');
    });

    /**
     * Cancel interview
     */
    cancelInterview = asyncHandler(async (req, res) => {
        const { interviewId } = req.params;
        
        await pool.query(
            `UPDATE interviews 
             SET status = 'cancelled', updated_at = NOW()
             WHERE id = $1 AND employer_id = $2`,
            [interviewId, req.user.id]
        );
        
        return ApiResponse.success(res, null, 'Interview cancelled');
    });
}

module.exports = new InterviewController();
