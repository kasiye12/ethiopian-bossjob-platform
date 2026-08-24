const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const logger = require('../utils/logger');
const pool = require('../config/database');
const redis = require('../config/redis');

class TelegramService {
    constructor() {
        if (config.telegram.botToken && config.telegram.botToken !== 'dev-telegram-token') {
            this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
            this.setupCommands();
            this.setupCallbacks();
        } else {
            logger.warn('Telegram bot token not configured. Telegram integration disabled.');
        }
    }

    setupCommands() {
        if (!this.bot) return;
        
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const user = msg.from;
            
            const welcomeMessage = `
🇪🇹 *Welcome to Bossjob Ethiopia!*

Find your dream job or hire the best talent in Ethiopia.

*Commands:*
/jobs - Browse latest jobs
/search - Search for jobs
/profile - View your profile
/help - Get help

*Quick Links:*
👉 [Browse Jobs](t.me/bossjob_ethiopia)
👉 [Post a Job](https://bossjob.et/post-job)
👉 [Visit Website](https://bossjob.et)

_Powered by Bossjob Ethiopia_
            `;
            
            await this.bot.sendMessage(chatId, welcomeMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🔍 Browse Jobs', callback_data: 'browse_jobs' },
                            { text: '💼 Post a Job', url: 'https://bossjob.et/post-job' },
                        ],
                        [
                            { text: '📱 Open Mini App', web_app: { url: 'https://t.me/bossjob_ethiopia_bot/app' } },
                        ],
                    ],
                },
            });
        });
        
        this.bot.onText(/\/jobs/, async (msg) => {
            const chatId = msg.chat.id;
            const jobs = await this.getLatestJobs(5);
            
            if (jobs.length === 0) {
                await this.bot.sendMessage(chatId, 'No jobs available at the moment. Check back later!');
                return;
            }
            
            const jobList = jobs.map((job, index) => {
                return `${index + 1}. *${job.title}*\n   💼 ${job.company_name}\n   📍 ${job.region}, ${job.sub_city || ''}\n   💰 ${job.salary_min_etb ? `ETB ${job.salary_min_etb} - ${job.salary_max_etb}` : 'Negotiable'}\n   🔗 /job_${job.id}\n`;
            }).join('\n');
            
            await this.bot.sendMessage(chatId, `📋 *Latest Jobs*\n\n${jobList}`, {
                parse_mode: 'Markdown',
            });
        });
        
        this.bot.onText(/\/help/, async (msg) => {
            const chatId = msg.chat.id;
            
            const helpMessage = `
🤝 *Bossjob Ethiopia Help Center*

*For Job Seekers:*
- Browse and apply for jobs
- Chat directly with employers
- Create professional CV
- Get job alerts on Telegram

*For Employers:*
- Post job vacancies
- Search for candidates
- Manage applications
- Interview scheduling

*Contact Us:*
📞 +251 911 234 567
📧 support@bossjob.et
🌐 https://bossjob.et

*Office Hours:*
Monday - Friday: 8:30 AM - 5:30 PM
Saturday: 8:30 AM - 12:30 PM
            `;
            
            await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });
    }

    setupCallbacks() {
        if (!this.bot) return;
        
        this.bot.on('callback_query', async (callbackQuery) => {
            const { message, data } = callbackQuery;
            const chatId = message.chat.id;
            
            if (data === 'browse_jobs') {
                await this.bot.answerCallbackQuery(callbackQuery.id);
                await this.bot.sendMessage(chatId, 'Opening job listings...');
                // Implement job browsing logic
            }
        });
    }

    async getLatestJobs(limit = 5) {
        const { rows } = await pool.query(
            `SELECT j.id, j.title, j.region, j.sub_city, j.salary_min_etb, j.salary_max_etb,
                    c.company_name
             FROM jobs j
             JOIN companies c ON j.company_id = c.id
             WHERE j.status = 'active'
             ORDER BY j.created_at DESC
             LIMIT $1`,
            [limit]
        );
        
        return rows;
    }

    /**
     * Broadcast new job to Telegram channel
     */
    async broadcastNewJob(job) {
        if (!this.bot) {
            logger.warn('Telegram bot not configured. Skipping broadcast.');
            return;
        }
        
        try {
            const message = `
🔔 *New Job Alert!*

*${job.title}*
Company: ${job.company_name}
📍 Location: ${job.region}${job.sub_city ? `, ${job.sub_city}` : ''}
💰 Salary: ${job.salary_min_etb ? `ETB ${job.salary_min_etb} - ${job.salary_max_etb}` : 'Negotiable'}
🏢 Job Type: ${job.job_type}
📋 Experience: ${job.experience_level || 'Not specified'}

📝 *Description:*
${job.description ? job.description.substring(0, 200) + '...' : 'See website for details'}

🔗 *Apply Now:* https://bossjob.et/jobs/${job.id}

#Bossjob #Ethiopia #JobVacancy #Hiring
            `;
            
            await this.bot.sendMessage(config.telegram.channelId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '👆 Apply Now', url: `https://bossjob.et/jobs/${job.id}` },
                            { text: '📱 Chat with HR', web_app: { url: `https://t.me/bossjob_ethiopia_bot/app?job=${job.id}` } },
                        ],
                    ],
                },
            });
            
            logger.info(`Job broadcasted to Telegram: ${job.id}`);
        } catch (error) {
            logger.error('Failed to broadcast job to Telegram:', error);
        }
    }

    /**
     * Send direct message to user
     */
    async sendDirectMessage(telegramId, message, options = {}) {
        if (!this.bot) return;
        
        try {
            await this.bot.sendMessage(telegramId, message, options);
        } catch (error) {
            logger.error(`Failed to send Telegram message to ${telegramId}:`, error);
        }
    }
}

module.exports = new TelegramService();
