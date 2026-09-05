const pool = require('../config/database');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class CandidateController {
    /**
     * Get candidate profile
     */
    getProfile = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT cp.*, u.full_name, u.email, u.phone_number
             FROM candidate_profiles cp
             JOIN users u ON cp.user_id = u.id
             WHERE cp.user_id = $1`,
            [req.user.id]
        );
        
        if (rows.length === 0) {
            // Create empty profile if not exists
            const { rows: newProfile } = await pool.query(
                `INSERT INTO candidate_profiles (user_id)
                 VALUES ($1)
                 RETURNING *`,
                [req.user.id]
            );
            
            return ApiResponse.success(res, newProfile[0], 'Profile created');
        }
        
        return ApiResponse.success(res, rows[0], 'Profile retrieved');
    });

    /**
     * Update candidate profile
     */
    updateProfile = asyncHandler(async (req, res) => {
        const {
            profession_title,
            years_of_experience,
            education_level,
            current_location,
            expected_salary_min,
            expected_salary_max,
            skills,
            summary,
            full_name,
            email,
        } = req.body;
        
        // Update user info
        if (full_name) {
            await pool.query(
                'UPDATE users SET full_name = $1 WHERE id = $2',
                [full_name, req.user.id]
            );
        }
        
        if (email) {
            await pool.query(
                'UPDATE users SET email = $1 WHERE id = $2',
                [email, req.user.id]
            );
        }
        
        // Check if profile exists
        const existingProfile = await pool.query(
            'SELECT id FROM candidate_profiles WHERE user_id = $1',
            [req.user.id]
        );
        
        let result;
        
        if (existingProfile.rows.length === 0) {
            // Create new profile
            result = await pool.query(
                `INSERT INTO candidate_profiles (
                    user_id, profession_title, years_of_experience, education_level,
                    current_location, expected_salary_min, expected_salary_max, skills, summary
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    req.user.id,
                    profession_title,
                    years_of_experience,
                    education_level,
                    current_location,
                    expected_salary_min,
                    expected_salary_max,
                    skills,
                    summary,
                ]
            );
        } else {
            // Update existing profile
            result = await pool.query(
                `UPDATE candidate_profiles SET
                    profession_title = $1,
                    years_of_experience = $2,
                    education_level = $3,
                    current_location = $4,
                    expected_salary_min = $5,
                    expected_salary_max = $6,
                    skills = $7,
                    summary = $8,
                    updated_at = NOW()
                WHERE user_id = $9
                RETURNING *`,
                [
                    profession_title,
                    years_of_experience,
                    education_level,
                    current_location,
                    expected_salary_min,
                    expected_salary_max,
                    skills,
                    summary,
                    req.user.id,
                ]
            );
        }
        
        return ApiResponse.success(res, result.rows[0], 'Profile updated');
    });

    /**
     * Upload CV
     */
    uploadCV = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }
        
        const cvUrl = `/uploads/resumes/${req.file.filename}`;
        
        await pool.query(
            `UPDATE candidate_profiles SET cv_url = $1, updated_at = NOW()
             WHERE user_id = $2`,
            [cvUrl, req.user.id]
        );
        
        return ApiResponse.success(res, { cv_url: cvUrl }, 'CV uploaded');
    });

    /**
     * Get all candidates (for employers)
     */
    listCandidates = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT cp.*, u.full_name, u.email, u.phone_number
            FROM candidate_profiles cp
            JOIN users u ON cp.user_id = u.id
            WHERE u.role = 'candidate'
        `;
        const params = [];
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.full_name ILIKE $${params.length} OR cp.profession_title ILIKE $${params.length})`;
        }
        
        query += ` ORDER BY cp.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        
        const { rows } = await pool.query(query, params);
        
        return ApiResponse.success(res, rows, 'Candidates retrieved');
    });
}

module.exports = new CandidateController();
