// Real-time WebSocket integration
class RealtimeManager {
    constructor() {
        this.socket = null;
        this.token = localStorage.getItem('authToken');
        this.connected = false;
        this.listeners = {};
        
        if (this.token) {
            this.connect();
        }
    }
    
    connect() {
        const baseUrl = window.location.origin;
        
        this.socket = io(baseUrl, {
            auth: { token: this.token },
            transports: ['websocket', 'polling'],
        });
        
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.connected = true;
            this.emit('connection', { status: 'connected' });
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.connected = false;
            this.emit('connection', { status: 'disconnected' });
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('WebSocket error:', error.message);
            this.emit('error', error);
        });
        
        // Handle notifications
        this.socket.on('notification', (data) => {
            this.emit('notification', data);
            this.showNotificationToast(data);
        });
        
        // Handle new messages
        this.socket.on('new_message', (data) => {
            this.emit('message', data);
            this.updateChatBadge(data);
        });
        
        // Handle typing indicator
        this.socket.on('user_typing', (data) => {
            this.emit('typing', data);
        });
        
        // Handle messages read
        this.socket.on('messages_read', (data) => {
            this.emit('read', data);
        });
    }
    
    // Event system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    // Send message
    sendMessage(threadId, body, type = 'text') {
        if (!this.socket || !this.connected) {
            console.error('WebSocket not connected');
            return;
        }
        
        this.socket.emit('send_message', {
            threadId,
            body,
            messageType: type,
        });
    }
    
    // Join thread
    joinThread(threadId) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('join_thread', threadId);
    }
    
    // Leave thread
    leaveThread(threadId) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('leave_thread', threadId);
    }
    
    // Typing indicator
    sendTyping(threadId, isTyping) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('typing', { threadId, isTyping });
    }
    
    // Mark as read
    markRead(threadId, messageIds) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('mark_read', { threadId, messageIds });
    }
    
    // Show notification toast
    showNotificationToast(notification) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            color: #333;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideDown 0.3s;
            max-width: 350px;
            cursor: pointer;
        `;
        
        toast.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center;">
                <span style="font-size: 24px;">🔔</span>
                <div>
                    <strong>${notification.title || 'Notification'}</strong>
                    <p style="font-size: 13px; color: #666;">${notification.body || ''}</p>
                </div>
            </div>
        `;
        
        toast.onclick = () => {
            toast.remove();
            window.location.href = '/chat.html';
        };
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    // Update chat badge
    updateChatBadge(data) {
        const badge = document.getElementById('chatBadge');
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = currentCount + 1;
            badge.style.display = 'inline';
        }
    }
    
    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-50px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize realtime manager
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('authToken')) {
        window.realtime = new RealtimeManager();
    }
});
