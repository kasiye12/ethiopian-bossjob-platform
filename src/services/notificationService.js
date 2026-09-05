const pool = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class NotificationService {
    async sendNotification(userId, notification) {
        try {
            // Insert into database
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, body, data)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, notification.type, notification.title, notification.body, notification.data]
            );
            
            // Cache unread count in Redis
            await redis.incr(`user:unread:${userId}`);
            await redis.expire(`user:unread:${userId}`, 86400);
            
            logger.info(`Notification sent to user ${userId}: ${notification.title}`);
            
        } catch (error) {
            logger.error('Failed to send notification:', error);
        }
    }

    async getNotifications(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        
        const { rows } = await pool.query(
            `SELECT * FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        
        return rows;
    }

    async markAsRead(notificationId, userId) {
        await pool.query(
            `UPDATE notifications SET read_at = NOW()
             WHERE id = $1 AND user_id = $2`,
            [notificationId, userId]
        );
        
        // Update unread count
        await redis.decr(`user:unread:${userId}`);
    }

    async markAllAsRead(userId) {
        await pool.query(
            `UPDATE notifications SET read_at = NOW()
             WHERE user_id = $1 AND read_at IS NULL`,
            [userId]
        );
        
        await redis.del(`user:unread:${userId}`);
    }

    async getUnreadCount(userId) {
        const count = await redis.get(`user:unread:${userId}`);
        return parseInt(count) || 0;
    }
}

module.exports = new NotificationService();
