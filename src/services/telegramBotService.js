const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');
const pool = require('../config/database');
const logger = require('../utils/logger');

class TelegramBotService {
    constructor() {
        this.bot = null;
        this.initialize();
    }

    initialize() {
        if (config.telegram.botToken && config.telegram.botToken !== 'dev-telegram-token') {
            this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
            this.setupCommands();
            logger.info('✅ Telegram bot initialized');
        } else {
            logger.warn('⚠️  Telegram bot not configured (using development mode)');
        }
    }

    setupCommands() {
        if (!this.bot) return;

        // Start command
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const firstName = msg.from.first_name || 'there';
            
            const welcomeMessage = `
🇪🇹 *Welcome to Bossjob Ethiopia, ${firstName}!*

Find your dream job or hire the best talent in Ethiopia.

*Quick Links:*
🔍 Browse Jobs - /jobs
📊 Post a Job - /postjob
👤 My Profile - /profile
💬 Messages - /messages
❓ Help - /help

*Or use the buttons below:*
            `;
            
            await this.bot.sendMessage(chatId, welcomeMessage, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🔍 Browse Jobs', callback_data: 'browse_jobs' },
                            { text: '📊 Post a Job', web_app: { url: 'http://localhost:3001/post-job.html' } },
                        ],
                        [
                            { text: '🌐 Open Website', web_app: { url: 'http://localhost:3001' } },
                        ],
                    ],
                },
            });
        });

        // Jobs command
        this.bot.onText(/\/jobs/, async (msg) => {
            const chatId = msg.chat.id;
            const jobs = await this.getLatestJobs(10);
            
            if (jobs.length === 0) {
                await this.bot.sendMessage(chatId, 'No jobs available at the moment. Check back later!');
                return;
            }
            
            const jobList = jobs.map((job, index) => {
                return `${index + 1}. *${job.title}*\n   🏢 ${job.company_name}\n   📍 ${job.region}\n   💰 ${job.salary_min_etb ? `ETB ${job.salary_min_etb} - ${job.salary_max_etb}` : 'Negotiable'}\n`;
            }).join('\n');
            
            await this.bot.sendMessage(chatId, `📋 *Latest Jobs*\n\n${jobList}`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🌐 View All Jobs', web_app: { url: 'http://localhost:3001' } }],
                    ],
                },
            });
        });

        // Help command
        this.bot.onText(/\/help/, (msg) => {
            const chatId = msg.chat.id;
            const helpMessage = `
🤝 *Bossjob Ethiopia Help*

*Available Commands:*
/start - Start the bot
/jobs - Browse latest jobs
/postjob - Post a job
/profile - View your profile
/messages - Check messages
/help - Get help

*Contact Us:*
📞 +251 911 234 567
📧 support@bossjob.et
🌐 https://bossjob.et

*Office Hours:*
Mon-Fri: 8:30 AM - 5:30 PM
Saturday: 8:30 AM - 12:30 PM
            `;
            
            this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        // Profile command
        this.bot.onText(/\/profile/, (msg) => {
            const chatId = msg.chat.id;
            this.bot.sendMessage(chatId, '👤 *Profile*\n\nOpen your profile to update your information:', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '👤 View Profile', web_app: { url: 'http://localhost:3001/profile.html' } }],
                    ],
                },
            });
        });

        // Callback queries
        this.bot.on('callback_query', async (callbackQuery) => {
            const { message, data } = callbackQuery;
            const chatId = message.chat.id;
            
            if (data === 'browse_jobs') {
                await this.bot.answerCallbackQuery(callbackQuery.id);
                const jobs = await this.getLatestJobs(5);
                
                if (jobs.length > 0) {
                    const jobList = jobs.map(job => `• ${job.title} - ${job.company_name}`).join('\n');
                    await this.bot.sendMessage(chatId, `📋 *Available Jobs*\n\n${jobList}`, { parse_mode: 'Markdown' });
                } else {
                    await this.bot.sendMessage(chatId, 'No jobs available at the moment.');
                }
            }
        });
    }

    async getLatestJobs(limit = 5) {
        try {
            const { rows } = await pool.query(
                `SELECT j.id, j.title, j.region, j.salary_min_etb, j.salary_max_etb,
                        c.company_name
                 FROM jobs j
                 JOIN companies c ON j.company_id = c.id
                 WHERE j.status = 'active'
                 ORDER BY j.created_at DESC
                 LIMIT $1`,
                [limit]
            );
            return rows;
        } catch (error) {
            logger.error('Error getting latest jobs:', error);
            return [];
        }
    }

    async broadcastNewJob(job) {
        if (!this.bot) return;
        
        try {
            const message = `
🔔 *New Job Alert!*

*${job.title}*
🏢 ${job.company_name}
📍 ${job.region}${job.sub_city ? ', ' + job.sub_city : ''}
💰 ${job.salary_min_etb ? `ETB ${job.salary_min_etb} - ${job.salary_max_etb}` : 'Negotiable'}
🏷️ ${job.job_type}

📝 ${job.description ? job.description.substring(0, 150) + '...' : ''}

*Apply now on Bossjob!*
            `;
            
            await this.bot.sendMessage(config.telegram.channelId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '👆 Apply Now', web_app: { url: `http://localhost:3001` } }],
                    ],
                },
            });
            
            logger.info(`Job ${job.id} broadcasted to Telegram`);
        } catch (error) {
            logger.error('Failed to broadcast job:', error);
        }
    }
}

module.exports = new TelegramBotService();
