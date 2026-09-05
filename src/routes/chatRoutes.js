const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const router = express.Router();

router.use(authMiddleware.authenticate);

// Get all chat threads
router.get('/threads', asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT ct.*, 
                j.title as job_title,
                c.company_name,
                u.full_name as other_user_name,
                u.role as other_user_role,
                (SELECT COUNT(*) FROM messages m WHERE m.thread_id = ct.id AND m.sender_id != $1 AND m.read_at IS NULL) as unread_count,
                (SELECT body FROM messages m WHERE m.thread_id = ct.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages m WHERE m.thread_id = ct.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time
         FROM chat_threads ct
         JOIN jobs j ON ct.job_id = j.id
         JOIN companies c ON j.company_id = c.id
         JOIN users u ON (CASE WHEN ct.candidate_id = $1 THEN ct.boss_id ELSE ct.candidate_id END) = u.id
         WHERE ct.candidate_id = $1 OR ct.boss_id = $1
         ORDER BY last_message_time DESC NULLS LAST`,
        [req.user.id]
    );
    
    return ApiResponse.success(res, rows, 'Chat threads retrieved');
}));

// Get messages for a thread
router.get('/threads/:threadId/messages', asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    
    // Verify access
    const threadCheck = await pool.query(
        'SELECT id FROM chat_threads WHERE id = $1 AND (candidate_id = $2 OR boss_id = $2)',
        [threadId, req.user.id]
    );
    
    if (threadCheck.rows.length === 0) {
        throw new AppError('Access denied', 403);
    }
    
    const { rows } = await pool.query(
        `SELECT m.*, u.full_name as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.thread_id = $1
         ORDER BY m.created_at ASC`,
        [threadId]
    );
    
    // Mark messages as read
    await pool.query(
        'UPDATE messages SET read_at = NOW() WHERE thread_id = $1 AND sender_id != $2 AND read_at IS NULL',
        [threadId, req.user.id]
    );
    
    return ApiResponse.success(res, rows, 'Messages retrieved');
}));

// Send message
router.post('/threads/:threadId/messages', asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    const { body, message_type } = req.body;
    
    if (!body) {
        throw new AppError('Message body is required', 400);
    }
    
    // Verify access
    const threadCheck = await pool.query(
        'SELECT id FROM chat_threads WHERE id = $1 AND (candidate_id = $2 OR boss_id = $2)',
        [threadId, req.user.id]
    );
    
    if (threadCheck.rows.length === 0) {
        throw new AppError('Access denied', 403);
    }
    
    const { rows } = await pool.query(
        `INSERT INTO messages (thread_id, sender_id, message_type, body)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [threadId, req.user.id, message_type || 'text', body]
    );
    
    // Update thread last message
    await pool.query(
        'UPDATE chat_threads SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
        [threadId]
    );
    
    return ApiResponse.success(res, rows[0], 'Message sent', 201);
}));

// Start new chat thread
router.post('/threads', asyncHandler(async (req, res) => {
    const { jobId } = req.body;
    
    if (!jobId) {
        throw new AppError('Job ID is required', 400);
    }
    
    // Get job details
    const jobResult = await pool.query(
        'SELECT id, company_id, posted_by, status FROM jobs WHERE id = $1',
        [jobId]
    );
    
    if (jobResult.rows.length === 0) {
        throw new AppError('Job not found', 404);
    }
    
    const job = jobResult.rows[0];
    
    // Check if thread already exists
    const existing = await pool.query(
        'SELECT id FROM chat_threads WHERE job_id = $1 AND candidate_id = $2',
        [jobId, req.user.id]
    );
    
    if (existing.rows.length > 0) {
        return ApiResponse.success(res, { threadId: existing.rows[0].id, isNew: false }, 'Thread exists');
    }
    
    // Create thread
    const { rows } = await pool.query(
        `INSERT INTO chat_threads (job_id, candidate_id, boss_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [jobId, req.user.id, job.posted_by]
    );
    
    // Send initial system message
    await pool.query(
        `INSERT INTO messages (thread_id, sender_id, message_type, body)
         VALUES ($1, $2, 'system', 'Chat started')`,
        [rows[0].id, req.user.id]
    );
    
    return ApiResponse.success(res, { threadId: rows[0].id, isNew: true }, 'Thread created', 201);
}));

// Send resume in chat
router.post('/threads/:threadId/send-resume', asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    
    const { rows } = await pool.query(
        `INSERT INTO messages (thread_id, sender_id, message_type, body)
         VALUES ($1, $2, 'resume', '📄 Resume sent')
         RETURNING *`,
        [threadId, req.user.id]
    );
    
    return ApiResponse.success(res, rows[0], 'Resume sent');
}));

// Exchange contact
router.post('/threads/:threadId/exchange-contact', asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    
    // Get user info
    const userResult = await pool.query(
        'SELECT phone_number, email FROM users WHERE id = $1',
        [req.user.id]
    );
    
    const { rows } = await pool.query(
        `INSERT INTO messages (thread_id, sender_id, message_type, body)
         VALUES ($1, $2, 'contact', $3)
         RETURNING *`,
        [threadId, req.user.id, `📱 Contact: ${userResult.rows[0].phone_number}`]
    );
    
    return ApiResponse.success(res, rows[0], 'Contact exchanged');
}));

// Mark not interested
router.post('/threads/:threadId/not-interested', asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    
    await pool.query(
        "UPDATE chat_threads SET thread_status = 'rejected' WHERE id = $1",
        [threadId]
    );
    
    return ApiResponse.success(res, null, 'Marked as not interested');
}));

// Pin thread
router.post('/threads/:threadId/pin', asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    
    const { rows } = await pool.query(
        'SELECT is_pinned FROM chat_threads WHERE id = $1',
        [threadId]
    );
    
    const newPinStatus = !rows[0].is_pinned;
    
    await pool.query(
        'UPDATE chat_threads SET is_pinned = $1 WHERE id = $2',
        [newPinStatus, threadId]
    );
    
    return ApiResponse.success(res, { is_pinned: newPinStatus }, 'Thread pinned');
}));

module.exports = router;
