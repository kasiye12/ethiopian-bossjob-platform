const pool = require('../config/database');
const encryption = require('../utils/encryption');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class ChatController {
    /**
     * Get user's chat threads
     */
    getThreads = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT ct.*, 
                    j.title as job_title,
                    c.company_name,
                    u.full_name as other_user_name,
                    (
                        SELECT COUNT(*) FROM messages m 
                        WHERE m.thread_id = ct.id 
                        AND m.sender_id != $1 
                        AND m.read_at IS NULL
                    ) as unread_count
             FROM chat_threads ct
             JOIN jobs j ON ct.job_id = j.id
             JOIN companies c ON j.company_id = c.id
             JOIN users u ON (CASE WHEN ct.candidate_id = $1 THEN ct.boss_id ELSE ct.candidate_id END) = u.id
             WHERE ct.candidate_id = $1 OR ct.boss_id = $1
             ORDER BY ct.last_message_at DESC NULLS LAST`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows, 'Chat threads retrieved');
    });

    /**
     * Get messages for a thread
     */
    getMessages = asyncHandler(async (req, res) => {
        const { threadId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        // Verify user has access to this thread
        const threadResult = await pool.query(
            'SELECT id FROM chat_threads WHERE id = $1 AND (candidate_id = $2 OR boss_id = $2)',
            [threadId, req.user.id]
        );
        
        if (threadResult.rows.length === 0) {
            throw new AppError('Chat thread not found or access denied', 404);
        }
        
        const offset = (page - 1) * limit;
        
        const { rows } = await pool.query(
            `SELECT m.id, m.thread_id, m.sender_id, m.message_type, 
                    m.body, m.attachment_url, m.metadata, m.read_at, m.created_at,
                    u.full_name as sender_name
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.thread_id = $1
             ORDER BY m.created_at DESC
             LIMIT $2 OFFSET $3`,
            [threadId, limit, offset]
        );
        
        // Decrypt messages
        const decryptedMessages = rows.reverse().map(msg => {
            if (msg.message_type === 'text' && msg.body) {
                msg.body = encryption.decrypt(msg.body);
            }
            return msg;
        });
        
        return ApiResponse.success(res, decryptedMessages, 'Messages retrieved');
    });

    /**
     * Start a new chat thread
     */
    startThread = asyncHandler(async (req, res) => {
        const { jobId } = req.body;
        
        // Check if job exists and is active
        const jobResult = await pool.query(
            'SELECT id, company_id, status FROM jobs WHERE id = $1',
            [jobId]
        );
        
        if (jobResult.rows.length === 0) {
            throw new AppError('Job not found', 404);
        }
        
        if (jobResult.rows[0].status !== 'active') {
            throw new AppError('This job is no longer active', 400);
        }
        
        // Get the boss (company owner or job poster)
        const bossResult = await pool.query(
            'SELECT posted_by FROM jobs WHERE id = $1',
            [jobId]
        );
        
        const bossId = bossResult.rows[0].posted_by;
        
        // Check if thread already exists
        const existingThread = await pool.query(
            'SELECT id FROM chat_threads WHERE job_id = $1 AND candidate_id = $2',
            [jobId, req.user.id]
        );
        
        if (existingThread.rows.length > 0) {
            return ApiResponse.success(
                res, 
                { threadId: existingThread.rows[0].id, isNew: false }, 
                'Chat thread already exists'
            );
        }
        
        // Create new thread
        const { rows } = await pool.query(
            `INSERT INTO chat_threads (job_id, candidate_id, boss_id)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [jobId, req.user.id, bossId]
        );
        
        return ApiResponse.success(
            res, 
            { threadId: rows[0].id, isNew: true }, 
            'Chat thread created',
            201
        );
    });
}

module.exports = new ChatController();
