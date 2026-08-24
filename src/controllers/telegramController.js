const telegramService = require('../services/telegramService');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class TelegramController {
    /**
     * Webhook for Telegram updates
     */
    webhook = asyncHandler(async (req, res) => {
        // Handle Telegram webhook
        telegramService.bot.processUpdate(req.body);
        return ApiResponse.success(res, null, 'Webhook processed');
    });

    /**
     * Get jobs for Telegram Mini App
     */
    getMiniAppJobs = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const jobs = await telegramService.getLatestJobs(limit);
        
        return ApiResponse.success(res, jobs, 'Jobs retrieved');
    });

    /**
     * Broadcast job to channel
     */
    broadcastJob = asyncHandler(async (req, res) => {
        const { jobId } = req.params;
        const job = await getJobDetails(jobId);
        
        await telegramService.broadcastNewJob(job);
        
        return ApiResponse.success(res, null, 'Job broadcasted');
    });
}

async function getJobDetails(jobId) {
    const pool = require('../config/database');
    const { rows } = await pool.query(
        `SELECT j.*, c.company_name
         FROM jobs j
         JOIN companies c ON j.company_id = c.id
         WHERE j.id = $1`,
        [jobId]
    );
    
    return rows[0];
}

module.exports = new TelegramController();
