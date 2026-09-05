const pool = require('../config/database');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class TalentController {
    /**
     * Search talents with filters
     */
    searchTalents = asyncHandler(async (req, res) => {
        const {
            search,
            city,
            experience,
            qualification,
            salary_min,
            salary_max,
            availability,
            skills,
            page = 1,
            limit = 20
        } = req.query;
        
        const offset = (page - 1) * limit;
        let query = `
            SELECT DISTINCT cp.*, u.full_name, u.email, u.phone_number,
                   u.profile_picture_url
            FROM candidate_profiles cp
            JOIN users u ON cp.user_id = u.id
            WHERE u.role = 'candidate' AND u.is_active = true
        `;
        const params = [];
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.full_name ILIKE $${params.length} OR cp.profession_title ILIKE $${params.length} OR cp.skills::text ILIKE $${params.length})`;
        }
        
        if (city) {
            params.push(`%${city}%`);
            query += ` AND cp.current_location ILIKE $${params.length}`;
        }
        
        if (experience) {
            params.push(experience);
            query += ` AND cp.years_of_experience >= $${params.length}`;
        }
        
        if (qualification) {
            params.push(qualification);
            query += ` AND cp.education_level = $${params.length}`;
        }
        
        if (salary_min) {
            params.push(salary_min);
            query += ` AND (cp.expected_salary_max IS NULL OR cp.expected_salary_max >= $${params.length})`;
        }
        
        if (salary_max) {
            params.push(salary_max);
            query += ` AND (cp.expected_salary_min IS NULL OR cp.expected_salary_min <= $${params.length})`;
        }
        
        if (skills) {
            const skillsArray = skills.split(',');
            params.push(skillsArray);
            query += ` AND cp.skills && $${params.length}::text[]`;
        }
        
        query += ` ORDER BY cp.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const { rows } = await pool.query(query, params);
        
        return ApiResponse.success(res, rows, 'Talents retrieved');
    });

    /**
     * Get recommended talents based on job requirements
     */
    getRecommendedTalents = asyncHandler(async (req, res) => {
        const { jobId } = req.query;
        
        let jobSkills = [];
        if (jobId) {
            const jobResult = await pool.query(
                'SELECT title, requirements FROM jobs WHERE id = $1',
                [jobId]
            );
            
            if (jobResult.rows.length > 0) {
                // Extract skills from requirements
                const requirements = jobResult.rows[0].requirements || '';
                jobSkills = requirements.split('\n').filter(s => s.trim());
            }
        }
        
        const { rows } = await pool.query(
            `SELECT cp.*, u.full_name, u.email, u.phone_number,
                    CASE 
                        WHEN cp.skills && $1::text[] THEN 5
                        ELSE 3
                    END as match_score
             FROM candidate_profiles cp
             JOIN users u ON cp.user_id = u.id
             WHERE u.role = 'candidate' AND u.is_active = true
             ORDER BY match_score DESC, cp.updated_at DESC
             LIMIT 20`,
            [jobSkills]
        );
        
        return ApiResponse.success(res, rows, 'Recommended talents retrieved');
    });

    /**
     * Save talent to shortlist
     */
    saveTalent = asyncHandler(async (req, res) => {
        const { talentId } = req.params;
        const { job_id } = req.body;
        
        // Check if already saved
        const existing = await pool.query(
            `SELECT id FROM saved_talents 
             WHERE employer_id = $1 AND talent_id = $2`,
            [req.user.id, talentId]
        );
        
        if (existing.rows.length > 0) {
            throw new AppError('Talent already saved', 409);
        }
        
        const { rows } = await pool.query(
            `INSERT INTO saved_talents (employer_id, talent_id, job_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.user.id, talentId, job_id]
        );
        
        return ApiResponse.success(res, rows[0], 'Talent saved', 201);
    });

    /**
     * Remove saved talent
     */
    removeSavedTalent = asyncHandler(async (req, res) => {
        const { talentId } = req.params;
        
        await pool.query(
            `DELETE FROM saved_talents 
             WHERE employer_id = $1 AND talent_id = $2`,
            [req.user.id, talentId]
        );
        
        return ApiResponse.success(res, null, 'Talent removed');
    });

    /**
     * Get saved talents
     */
    getSavedTalents = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT st.*, cp.*, u.full_name, u.email, u.phone_number
             FROM saved_talents st
             JOIN candidate_profiles cp ON st.talent_id = cp.user_id
             JOIN users u ON cp.user_id = u.id
             WHERE st.employer_id = $1
             ORDER BY st.created_at DESC`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows, 'Saved talents retrieved');
    });

    /**
     * Get viewed talents
     */
    getViewedTalents = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT vt.*, cp.*, u.full_name
             FROM viewed_talents vt
             JOIN candidate_profiles cp ON vt.talent_id = cp.user_id
             JOIN users u ON cp.user_id = u.id
             WHERE vt.employer_id = $1
             ORDER BY vt.viewed_at DESC
             LIMIT 20`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows, 'Viewed talents retrieved');
    });

    /**
     * Mark talent as viewed
     */
    markViewed = asyncHandler(async (req, res) => {
        const { talentId } = req.params;
        
        await pool.query(
            `INSERT INTO viewed_talents (employer_id, talent_id)
             VALUES ($1, $2)
             ON CONFLICT (employer_id, talent_id) 
             DO UPDATE SET viewed_at = NOW()`,
            [req.user.id, talentId]
        );
        
        return ApiResponse.success(res, null, 'Talent marked as viewed');
    });

    /**
     * Get talent profile
     */
    getTalentProfile = asyncHandler(async (req, res) => {
        const { talentId } = req.params;
        
        const { rows } = await pool.query(
            `SELECT cp.*, u.full_name, u.email, u.phone_number, u.profile_picture_url
             FROM candidate_profiles cp
             JOIN users u ON cp.user_id = u.id
             WHERE cp.user_id = $1`,
            [talentId]
        );
        
        if (rows.length === 0) {
            throw new AppError('Talent not found', 404);
        }
        
        // Mark as viewed
        await pool.query(
            `INSERT INTO viewed_talents (employer_id, talent_id)
             VALUES ($1, $2)
             ON CONFLICT (employer_id, talent_id) 
             DO UPDATE SET viewed_at = NOW()`,
            [req.user.id, talentId]
        );
        
        return ApiResponse.success(res, rows[0], 'Talent profile retrieved');
    });
}

module.exports = new TalentController();
