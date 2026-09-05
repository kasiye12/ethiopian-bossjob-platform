const API_BASE_URL = 'http://localhost:3001';
let socket = null;
let currentThreadId = null;
let currentUser = null;

// Check authentication
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = '/';
}

// Initialize Socket.IO connection
socket = io(API_BASE_URL, {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('Connected to chat server');
    loadChatThreads();
});

socket.on('new_message', (data) => {
    if (data.threadId === currentThreadId) {
        appendMessage(data.message);
    }
    loadChatThreads(); // Refresh thread list
});

socket.on('user_typing', (data) => {
    if (data.threadId === currentThreadId && data.isTyping) {
        // Show typing indicator
        console.log('User is typing...');
    }
});

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            currentUser = data.data;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load chat threads
async function loadChatThreads() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/chats/threads`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderChatList(data.data);
        }
    } catch (error) {
        console.error('Error loading threads:', error);
    }
}

// Render chat list
function renderChatList(threads) {
    const chatList = document.getElementById('chatList');
    
    if (!threads || threads.length === 0) {
        chatList.innerHTML = '<div class="empty-chat"><p>No conversations yet</p></div>';
        return;
    }
    
    chatList.innerHTML = threads.map(thread => `
        <div class="chat-list-item ${thread.id === currentThreadId ? 'active' : ''}" onclick="openThread('${thread.id}', '${thread.other_user_name}', '${thread.job_title}')">
            <h4>${thread.other_user_name}</h4>
            <p>${thread.job_title}</p>
            ${thread.unread_count > 0 ? `<span class="unread-badge">${thread.unread_count}</span>` : ''}
        </div>
    `).join('');
}

// Open a chat thread
async function openThread(threadId, userName, jobTitle) {
    currentThreadId = threadId;
    
    // Update UI
    document.getElementById('chatHeader').textContent = `${userName} - ${jobTitle}`;
    document.getElementById('emptyChat').style.display = 'none';
    document.getElementById('chatInputContainer').style.display = 'flex';
    
    // Join socket room
    socket.emit('join_thread', threadId);
    
    // Load messages
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/chats/threads/${threadId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            renderMessages(data.data);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
    
    // Update active thread in list
    loadChatThreads();
}

// Render messages
function renderMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        appendMessage(message);
    });
    
    scrollToBottom();
}

// Append a single message
function appendMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const isSent = message.sender_id === currentUser?.id;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
    let content = message.body || '';
    if (message.message_type === 'voice') {
        content = '🎤 Voice message';
    } else if (message.message_type === 'offer_card') {
        content = '📋 Job Offer';
    } else if (message.message_type === 'interview_invite') {
        content = '📅 Interview Invitation';
    }
    
    messageDiv.innerHTML = `
        ${content}
        <span class="message-time">${new Date(message.created_at).toLocaleTimeString()}</span>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Send message
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || !currentThreadId) return;
    
    socket.emit('send_message', {
        threadId: currentThreadId,
        messageType: 'text',
        body: message
    });
    
    input.value = '';
}

// Handle enter key
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Scroll to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
}

// Initialize
loadUserProfile();
