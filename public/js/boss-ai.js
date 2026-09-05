// Boss AI Chat JavaScript
const API_BASE_URL = window.location.origin;

// AI responses database
const aiResponses = {
    'find candidates': {
        response: 'Here are the top recommended candidates for your role:\n\n1. Abebe Kebede - Software Developer (5 years experience)\n   Skills: JavaScript, Node.js, React\n\n2. Sara Mohammed - Senior Developer (7 years experience)\n   Skills: Python, Django, AWS\n\n3. Daniel Tadesse - Full Stack Developer (4 years experience)\n   Skills: React, Node.js, PostgreSQL\n\nWould you like me to contact any of them?',
        suggestions: ['Contact all', 'View full profiles', 'Find more']
    },
    'job description': {
        response: 'Here\'s a professional job description template:\n\n**Job Title:** [Position]\n**Location:** Addis Ababa, Ethiopia\n\n**About Us:**\n[Company description]\n\n**Responsibilities:**\n• [Key responsibility 1]\n• [Key responsibility 2]\n• [Key responsibility 3]\n\n**Requirements:**\n• [Required skill/experience]\n• [Education requirement]\n• [Years of experience]\n\n**Benefits:**\n• Competitive salary\n• Health insurance\n• Professional development\n\nWould you like me to customize this for a specific role?',
        suggestions: ['Customize for IT role', 'Customize for Finance role', 'Add more benefits']
    },
    'interview questions': {
        response: 'Here are recommended interview questions:\n\n**Technical Questions:**\n1. Describe your experience with [technology]\n2. How do you handle tight deadlines?\n3. Walk me through a project you\'re proud of\n\n**Behavioral Questions:**\n1. Tell me about a time you faced a challenge\n2. How do you work in a team?\n3. Where do you see yourself in 5 years?\n\n**Culture Fit:**\n1. What attracted you to our company?\n2. What\'s your ideal work environment?\n\nWould you like more specific questions for a particular role?',
        suggestions: ['Technical questions', 'Behavioral questions', 'Culture fit questions']
    },
    'analyze applications': {
        response: '📊 **Application Analysis**\n\nTotal Applications: 125\n\n**Breakdown:**\n• Strong Match: 35 (28%)\n• Moderate Match: 50 (40%)\n• Weak Match: 40 (32%)\n\n**Top Skills Found:**\n• JavaScript (45 applicants)\n• Communication (38 applicants)\n• Leadership (22 applicants)\n\n**Recommendation:** Focus on the 35 strong match candidates for immediate interviews.',
        suggestions: ['View strong matches', 'Schedule interviews', 'Reject weak matches']
    }
};

// Send message function
function sendMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Disable input while processing
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    
    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Generate AI response
    setTimeout(() => {
        removeTypingIndicator();
        const response = generateAIResponse(message);
        addMessage(response.response, 'ai', response.suggestions);
        sendBtn.disabled = false;
    }, 1000);
}

// Generate AI response
function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('candidate') || lowerMessage.includes('find')) {
        return aiResponses['find candidates'];
    } else if (lowerMessage.includes('job description') || lowerMessage.includes('write')) {
        return aiResponses['job description'];
    } else if (lowerMessage.includes('interview')) {
        return aiResponses['interview questions'];
    } else if (lowerMessage.includes('analyz') || lowerMessage.includes('application')) {
        return aiResponses['analyze applications'];
    } else {
        return {
            response: 'I understand you\'re asking about: "' + message + '"\n\nI can help with:\n• Finding the best candidates\n• Writing job descriptions\n• Analyzing applications\n• Scheduling interviews\n• HR best practices\n\nPlease ask me something specific!',
            suggestions: ['Find candidates', 'Write job description', 'Interview questions', 'Analyze applications']
        };
    }
}

// Add message to chat
function addMessage(text, type, suggestions = []) {
    const messagesContainer = document.getElementById('aiMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'user' ? '👤' : '🤖';
    
    let content = text.replace(/\n/g, '<br>');
    
    // Convert markdown-style bold
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${content}</p>
            ${suggestions.length > 0 ? `
                <div class="suggestion-chips">
                    ${suggestions.map(s => `<button class="suggestion-chip" onclick="quickAsk('${s}')">${s}</button>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('aiMessages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Quick ask function
function quickAsk(question) {
    document.getElementById('aiInput').value = question;
    sendMessage();
}

// Handle key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
