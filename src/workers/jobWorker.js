const pool = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const telegramBotService = require('../services/telegramBotService');

class JobWorker {
    constructor() {
        this.isRunning = false;
        this.interval = null;
    }

    async start() {
        logger.info('🔄 Job Worker started');
        
        // Run every 5 minutes
        this.interval = setInterval(async () => {
            await this.processJobs();
        }, 5 * 60 * 1000);
        
        // Run immediately on start
        await this.processJobs();
    }

    async processJobs() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        try {
            // Close expired jobs
            await this.closeExpiredJobs();
            
            // Broadcast new jobs to Telegram
            await this.broadcastNewJobs();
            
            // Clean up old notifications
            await this.cleanupNotifications();
            
            logger.info('✅ Job processing completed');
            
        } catch (error) {
            logger.error('Job processing failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    async closeExpiredJobs() {
        const { rowCount } = await pool.query(
            `UPDATE jobs 
             SET status = 'closed', closed_at = NOW(), updated_at = NOW()
             WHERE deadline_date IS NOT NULL 
             AND deadline_date < CURRENT_DATE 
             AND status = 'active'`
        );
        
        if (rowCount > 0) {
            logger.info(`Closed ${rowCount} expired jobs`);
        }
    }

    async broadcastNewJobs() {
        const { rows } = await pool.query(
            `SELECT j.*, c.company_name
             FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE j.status = 'active'
             AND j.created_at > NOW() - INTERVAL '5 minutes'`
        );
        
        for (const job of rows) {
            await telegramBotService.broadcastNewJob(job);
        }
    }

    async cleanupNotifications() {
        const { rowCount } = await pool.query(
            `DELETE FROM notifications
             WHERE created_at < NOW() - INTERVAL '30 days'`
        );
        
        if (rowCount > 0) {
            logger.info(`Cleaned up ${rowCount} old notifications`);
        }
    }

    async stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        logger.info('Job Worker stopped');
    }
}

const worker = new JobWorker();

process.on('SIGTERM', async () => {
    await worker.stop();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await worker.stop();
    process.exit(0);
});

worker.start().catch((error) => {
    logger.error('Worker failed to start:', error);
    process.exit(1);
});
