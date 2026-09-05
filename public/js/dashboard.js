const API_BASE_URL = window.location.origin;
let socket = null;
let currentUser = null;
let authToken = localStorage.getItem('authToken');

if (!authToken) {
    window.location.href = '/';
}

// Initialize Socket.IO
socket = io(API_BASE_URL, {
    auth: { token: authToken }
});

socket.on('connect', () => {
    console.log('Connected to real-time server');
    loadNotifications();
});

socket.on('notification', (data) => {
    showToast(data.title || 'New Notification');
    loadNotifications();
});

socket.on('new_message', (data) => {
    showToast('New message received');
    loadMessages();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadDashboardData();
    setupNavigation();
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        overview: 'Overview',
        jobs: 'My Jobs',
        applications: 'Applications',
        messages: 'Messages',
        notifications: 'Notifications',
        profile: 'Profile',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId];
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.data;
            
            // Update avatar
            document.getElementById('userAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
            
            // Load profile content
            renderProfile(currentUser);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    if (currentUser?.role === 'boss' || currentUser?.role === 'admin') {
        loadEmployerData();
    } else {
        loadCandidateData();
    }
}

async function loadEmployerData() {
    // Load jobs
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/jobs/my`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const jobs = data.data || [];
            document.getElementById('totalJobs').textContent = jobs.length;
            document.getElementById('activeJobs').textContent = jobs.filter(j => j.status === 'active').length;
            renderJobs(jobs);
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
    
    // Load applications
    loadApplications();
}

async function loadCandidateData() {
    // Load applications
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/applications/my`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const applications = data.data || [];
            document.getElementById('totalApplications').textContent = applications.length;
            renderApplications(applications);
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Load applications
async function loadApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/applications/my`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const applications = data.data || [];
            document.getElementById('totalApplications').textContent = applications.length;
            document.getElementById('appBadge').textContent = applications.length;
            document.getElementById('appBadge').style.display = applications.length > 0 ? 'inline' : 'none';
            renderApplications(applications);
        }
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Load messages
async function loadMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/chats/threads`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            const threads = data.data;
            const unreadCount = threads.filter(t => t.unread_count > 0).length;
            document.getElementById('unreadMessages').textContent = unreadCount;
            document.getElementById('msgBadge').textContent = unreadCount;
            document.getElementById('msgBadge').style.display = unreadCount > 0 ? 'inline' : 'none';
            renderMessages(threads);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const notifications = data.data || [];
            const unreadCount = notifications.filter(n => !n.read_at).length;
            document.getElementById('notifBadge').textContent = unreadCount;
            document.getElementById('notifBadge').style.display = unreadCount > 0 ? 'inline' : 'none';
            renderNotifications(notifications);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Render functions
function renderJobs(jobs) {
    const jobsList = document.getElementById('jobsList');
    
    if (!jobs || jobs.length === 0) {
        jobsList.innerHTML = '<p class="empty-state">No jobs posted yet</p>';
        return;
    }
    
    jobsList.innerHTML = jobs.map(job => `
        <div class="job-item">
            <div class="job-item-header">
                <h3 class="job-item-title">${job.title}</h3>
                <span class="status-badge status-${job.status}">${job.status}</span>
            </div>
            <p>📍 ${job.region}${job.sub_city ? ', ' + job.sub_city : ''}</p>
            <p>💰 ${job.salary_min_etb ? `ETB ${job.salary_min_etb} - ${job.salary_max_etb}` : 'Negotiable'}</p>
            <p>👁️ ${job.views_count || 0} views | 📝 ${job.applications_count || 0} applications</p>
        </div>
    `).join('');
}

function renderApplications(applications) {
    const applicationsList = document.getElementById('applicationsList');
    
    if (!applications || applications.length === 0) {
        applicationsList.innerHTML = '<p class="empty-state">No applications yet</p>';
        return;
    }
    
    applicationsList.innerHTML = applications.map(app => `
        <div class="job-item">
            <div class="job-item-header">
                <h3 class="job-item-title">${app.title || 'Position'}</h3>
                <span class="status-badge status-${app.status === 'hired' ? 'active' : app.status === 'rejected' ? 'closed' : 'pending'}">${app.status}</span>
            </div>
            <p>🏢 ${app.company_name || 'Company'}</p>
            <p>📅 Applied: ${new Date(app.created_at).toLocaleDateString()}</p>
        </div>
    `).join('');
}

function renderMessages(threads) {
    const messagesList = document.getElementById('messagesList');
    
    if (!threads || threads.length === 0) {
        messagesList.innerHTML = '<p class="empty-state">No messages yet</p>';
        return;
    }
    
    messagesList.innerHTML = threads.map(thread => `
        <div class="job-item" onclick="window.location.href='/chat.html'">
            <div class="job-item-header">
                <h3 class="job-item-title">${thread.other_user_name}</h3>
                ${thread.unread_count > 0 ? `<span class="badge">${thread.unread_count}</span>` : ''}
            </div>
            <p>💼 ${thread.job_title}</p>
        </div>
    `).join('');
}

function renderNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    
    if (!notifications || notifications.length === 0) {
        notificationsList.innerHTML = '<p class="empty-state">No notifications</p>';
        return;
    }
    
    notificationsList.innerHTML = notifications.map(notif => `
        <div class="job-item" style="${!notif.read_at ? 'border-left: 4px solid #4CAF50;' : ''}">
            <h3>${notif.title}</h3>
            <p>${notif.body}</p>
            <p style="font-size: 12px; color: #999;">${new Date(notif.created_at).toLocaleString()}</p>
        </div>
    `).join('');
}

function renderProfile(user) {
    const profileContent = document.getElementById('profileContent');
    profileContent.innerHTML = `
        <div class="job-item">
            <h3>${user.full_name}</h3>
            <p>📱 ${user.phone_number}</p>
            <p>📧 ${user.email || 'No email'}</p>
            <p>👤 Role: ${user.role}</p>
            <p>📅 Member since: ${new Date(user.created_at).toLocaleDateString()}</p>
        </div>
    `;
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Mark all notifications as read
async function markAllRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/notifications/mark-all-read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            loadNotifications();
            showToast('All notifications marked as read');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Toggle sidebar
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
}

// Load messages on init
loadMessages();
