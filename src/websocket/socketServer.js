const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const redis = require('../config/redis');
const pool = require('../config/database');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');

class SocketServer {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });
        
        this.userSockets = new Map(); // userId -> Set of socket IDs
        this.threadRooms = new Map(); // threadId -> Set of userIds
        
        this.setupMiddleware();
        this.setupEventHandlers();
    }

    setupMiddleware() {
        // Authentication middleware for Socket.IO
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                
                if (!token) {
                    return next(new Error('Authentication required'));
                }
                
                const decoded = jwt.verify(token, config.jwt.secret);
                
                // Check if user exists
                const { rows } = await pool.query(
                    'SELECT id, role, full_name FROM users WHERE id = $1 AND is_active = true',
                    [decoded.id]
                );
                
                if (rows.length === 0) {
                    return next(new Error('User not found'));
                }
                
                socket.user = rows[0];
                next();
            } catch (error) {
                next(new Error('Invalid token'));
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            const userId = socket.user.id;
            
            logger.info(`User connected: ${userId} (Socket ID: ${socket.id})`);
            
            // Add to user sockets map
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(socket.id);
            
            // Update user online status in Redis
            redis.setex(`user:online:${userId}`, 300, 'true');
            
            // Handle joining chat thread
            socket.on('join_thread', async (threadId) => {
                try {
                    await this.handleJoinThread(socket, threadId);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
            
            // Handle leaving chat thread
            socket.on('leave_thread', (threadId) => {
                socket.leave(`thread:${threadId}`);
                socket.emit('left_thread', { threadId });
            });
            
            // Handle sending message
            socket.on('send_message', async (data) => {
                try {
                    await this.handleSendMessage(socket, data);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
            
            // Handle typing indicator
            socket.on('typing', (data) => {
                this.handleTyping(socket, data);
            });
            
            // Handle message read
            socket.on('mark_read', async (data) => {
                try {
                    await this.handleMarkRead(socket, data);
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });
            
            // Handle disconnect
            socket.on('disconnect', () => {
                logger.info(`User disconnected: ${userId} (Socket ID: ${socket.id})`);
                
                if (this.userSockets.has(userId)) {
                    this.userSockets.get(userId).delete(socket.id);
                    
                    if (this.userSockets.get(userId).size === 0) {
                        this.userSockets.delete(userId);
                        redis.del(`user:online:${userId}`);
                    }
                }
            });
        });
    }

    async handleJoinThread(socket, threadId) {
        // Verify user has access to this thread
        const { rows } = await pool.query(
            `SELECT id, candidate_id, boss_id 
             FROM chat_threads 
             WHERE id = $1 AND (candidate_id = $2 OR boss_id = $2)`,
            [threadId, socket.user.id]
        );
        
        if (rows.length === 0) {
            throw new Error('Access denied to this chat thread');
        }
        
        socket.join(`thread:${threadId}`);
        socket.emit('joined_thread', { threadId });
        
        // Get recent messages
        const messages = await pool.query(
            `SELECT m.id, m.thread_id, m.sender_id, m.message_type, 
                    m.body, m.attachment_url, m.metadata, m.created_at
             FROM messages m
             WHERE m.thread_id = $1
             ORDER BY m.created_at DESC
             LIMIT 50`,
            [threadId]
        );
        
        socket.emit('message_history', {
            threadId,
            messages: messages.rows.reverse(),
        });
    }

    async handleSendMessage(socket, data) {
        const { threadId, messageType = 'text', body, attachmentUrl, metadata } = data;
        
        // Verify user has access to this thread
        const { rows: threadRows } = await pool.query(
            `SELECT id, candidate_id, boss_id, thread_status 
             FROM chat_threads 
             WHERE id = $1`,
            [threadId]
        );
        
        if (threadRows.length === 0) {
            throw new Error('Chat thread not found');
        }
        
        const thread = threadRows[0];
        
        if (thread.candidate_id !== socket.user.id && thread.boss_id !== socket.user.id) {
            throw new Error('Access denied to this chat thread');
        }
        
        // Check if thread is closed
        if (thread.thread_status === 'rejected' || thread.thread_status === 'expired') {
            throw new Error('This chat thread is closed');
        }
        
        // Encrypt message body if it's text
        const encryptedBody = messageType === 'text' && body ? encryption.encrypt(body) : body;
        
        // Insert message
        const { rows: messageRows } = await pool.query(
            `INSERT INTO messages (thread_id, sender_id, message_type, body, attachment_url, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, thread_id, sender_id, message_type, body, attachment_url, metadata, created_at`,
            [threadId, socket.user.id, messageType, encryptedBody, attachmentUrl, metadata]
        );
        
        const message = messageRows[0];
        
        // Decrypt message for response
        if (message.message_type === 'text' && message.body) {
            message.body = encryption.decrypt(message.body);
        }
        
        // Update thread's last message timestamp
        await pool.query(
            'UPDATE chat_threads SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
            [threadId]
        );
        
        // Emit message to thread room
        this.io.to(`thread:${threadId}`).emit('new_message', {
            threadId,
            message,
        });
        
        // Send notification to recipient
        const recipientId = thread.candidate_id === socket.user.id 
            ? thread.boss_id 
            : thread.candidate_id;
        
        await this.sendNotification(recipientId, {
            type: 'new_message',
            title: 'New Message',
            body: messageType === 'text' ? 'You have a new message' : 'You received a new file',
            data: { threadId, messageId: message.id },
        });
        
        // Store in Redis for quick access
        await redis.lpush(`thread:messages:${threadId}`, JSON.stringify(message));
        await redis.ltrim(`thread:messages:${threadId}`, 0, 99);
    }

    handleTyping(socket, data) {
        const { threadId, isTyping } = data;
        
        socket.to(`thread:${threadId}`).emit('user_typing', {
            threadId,
            userId: socket.user.id,
            isTyping,
        });
    }

    async handleMarkRead(socket, data) {
        const { threadId, messageIds } = data;
        
        if (!messageIds || messageIds.length === 0) {
            return;
        }
        
        // Update read status
        await pool.query(
            `UPDATE messages 
             SET read_at = NOW() 
             WHERE thread_id = $1 AND sender_id != $2 AND id = ANY($3::uuid[])`,
            [threadId, socket.user.id, messageIds]
        );
        
        socket.to(`thread:${threadId}`).emit('messages_read', {
            threadId,
            messageIds,
            readBy: socket.user.id,
        });
    }

    async sendNotification(userId, notification) {
        try {
            // Insert into database
            await pool.query(
                `INSERT INTO notifications (user_id, type, title, body, data)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, notification.type, notification.title, notification.body, notification.data]
            );
            
            // Send real-time notification if user is online
            const userSocketIds = this.userSockets.get(userId);
            
            if (userSocketIds) {
                userSocketIds.forEach(socketId => {
                    this.io.to(socketId).emit('notification', notification);
                });
            }
            
            // Cache unread count
            await redis.incr(`user:unread:${userId}`);
            await redis.expire(`user:unread:${userId}`, 86400);
            
        } catch (error) {
            logger.error('Failed to send notification:', error);
        }
    }

    // Method to emit event to specific user
    emitToUser(userId, event, data) {
        const userSocketIds = this.userSockets.get(userId);
        
        if (userSocketIds) {
            userSocketIds.forEach(socketId => {
                this.io.to(socketId).emit(event, data);
            });
        }
    }

    // Method to emit event to specific thread
    emitToThread(threadId, event, data) {
        this.io.to(`thread:${threadId}`).emit(event, data);
    }
}

module.exports = SocketServer;
