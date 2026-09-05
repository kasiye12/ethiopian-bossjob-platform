const API_BASE_URL = window.location.origin;
const authToken = localStorage.getItem('authToken');

if (!authToken) {
    window.location.href = '/';
}

// Sample data for demonstration
const sampleJobs = [
    { id: 1, title: 'Senior Software Developer', status: 'active', views: 245, applications: 18, date: '2026-08-20' },
    { id: 2, title: 'Marketing Manager', status: 'active', views: 180, applications: 12, date: '2026-08-18' },
    { id: 3, title: 'Accountant', status: 'draft', views: 0, applications: 0, date: '2026-08-15' },
];

const sampleTalents = [
    { id: 1, name: 'Abebe Kebede', title: 'Software Developer', skills: ['JavaScript', 'Node.js', 'React'], experience: '5 years', location: 'Addis Ababa' },
    { id: 2, name: 'Sara Mohammed', title: 'Marketing Specialist', skills: ['Digital Marketing', 'SEO', 'Content'], experience: '3 years', location: 'Addis Ababa' },
    { id: 3, name: 'Tigist Haile', title: 'Accountant', skills: ['Accounting', 'Excel', 'Tax'], experience: '4 years', location: 'Addis Ababa' },
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadJobs();
    loadTalents();
    loadUserProfile();
});

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    const titles = {
        'manage-jobs': 'Manage Jobs',
        'chat': 'Chat',
        'talent': 'Reco Talent',
        'search-talent': 'Search Talent',
        'talents': 'Talents',
        'interviews': 'Interviews',
        'company': 'My Company',
        'analytics': 'Analytics',
        'boss-ai': 'Boss AI'
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
        
        if (data.success && data.data) {
            const user = data.data;
            document.querySelector('.user-name').textContent = user.full_name || 'Taye Kasiye';
            document.querySelector('.user-avatar').textContent = (user.full_name || 'T K').split(' ').map(w => w[0]).join('').substring(0, 2);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load jobs
function loadJobs() {
    const jobsList = document.getElementById('jobsList');
    
    jobsList.innerHTML = sampleJobs.map(job => `
        <div class="job-card">
            <div class="job-card-header">
                <h3 class="job-title">${job.title}</h3>
                <span class="status-badge status-${job.status}">${job.status}</span>
            </div>
            <div class="job-stats">
                <span class="job-stat">👁️ ${job.views} views</span>
                <span class="job-stat">📝 ${job.applications} applications</span>
                <span class="job-stat">📅 ${job.date}</span>
            </div>
            <div class="job-actions">
                <button class="btn-outline" onclick="viewApplications(${job.id})">View Applications</button>
                <button class="btn-outline" onclick="editJob(${job.id})">Edit</button>
                <button class="btn-outline" onclick="toggleJob(${job.id})">${job.status === 'active' ? 'Close' : 'Activate'}</button>
            </div>
        </div>
    `).join('');
}

// Load talents
function loadTalents() {
    const talentGrid = document.getElementById('talentGrid');
    
    talentGrid.innerHTML = sampleTalents.map(talent => `
        <div class="talent-card">
            <div class="talent-card-header">
                <div class="talent-avatar">${talent.name.split(' ').map(w => w[0]).join('')}</div>
                <div>
                    <h3 class="talent-name">${talent.name}</h3>
                    <p class="talent-title">${talent.title}</p>
                </div>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
                📍 ${talent.location} | 💼 ${talent.experience}
            </p>
            <div class="talent-skills">
                ${talent.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="talent-actions">
                <button class="btn-outline" onclick="viewProfile(${talent.id})">View Profile</button>
                <button class="btn-outline" onclick="saveTalent(${talent.id})">Save</button>
                <button class="btn-primary" onclick="contactTalent(${talent.id})">Contact</button>
            </div>
        </div>
    `).join('');
}

// Talent tabs
function switchTalentTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // In production, load different talent lists
    loadTalents();
}

// Actions
function viewApplications(jobId) {
    alert(`Viewing applications for job #${jobId}`);
    showSection('talents');
}

function editJob(jobId) {
    window.location.href = `/post-job.html?id=${jobId}`;
}

function toggleJob(jobId) {
    alert(`Toggling job #${jobId} status`);
}

function viewProfile(talentId) {
    alert(`Viewing profile #${talentId}`);
}

function saveTalent(talentId) {
    alert(`Talent #${talentId} saved!`);
}

function contactTalent(talentId) {
    showSection('chat');
}

function scheduleInterview() {
    alert('Interview scheduling feature coming soon!');
}

function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const aiMessages = document.getElementById('aiMessages');
    
    // Add user message
    aiMessages.innerHTML += `
        <div class="ai-message" style="justify-content: flex-end;">
            <div class="ai-text" style="background: var(--primary); color: white;">
                <p>${message}</p>
            </div>
        </div>
    `;
    
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        aiMessages.innerHTML += `
            <div class="ai-message ai-bot">
                <div class="ai-avatar">🤖</div>
                <div class="ai-text">
                    <p>I'm processing your request. Here are some suggestions based on your query: "${message}"</p>
                    <ul>
                        <li>Review top candidates matching your criteria</li>
                        <li>Schedule interviews with shortlisted candidates</li>
                        <li>Generate job description templates</li>
                    </ul>
                </div>
            </div>
        `;
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 1000);
}

function toggleSidebar() {
    document.querySelector('.hr-sidebar').classList.toggle('open');
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
}

// Position management
let currentPosition = 'HR Manager';

// Initialize position on load
document.addEventListener('DOMContentLoaded', () => {
    loadUserPosition();
    addPositionSelector();
});

// Load user position
async function loadUserPosition() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/companies/my`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            currentPosition = data.data.company_position || 'HR Manager';
            updatePositionUI();
        }
    } catch (error) {
        console.error('Error loading position:', error);
    }
}

// Update position UI
function updatePositionUI() {
    const statusElement = document.querySelector('.user-status');
    if (statusElement) {
        statusElement.textContent = currentPosition;
    }
    
    // Add position badge
    const userProfile = document.querySelector('.user-profile');
    if (userProfile && !document.querySelector('.position-badge')) {
        const badge = document.createElement('span');
        badge.className = 'position-badge';
        badge.textContent = currentPosition;
        badge.onclick = showPositionSelector;
        userProfile.appendChild(badge);
    }
}

// Add position selector to header
function addPositionSelector() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.querySelector('.position-select-btn')) {
        const positionBtn = document.createElement('button');
        positionBtn.className = 'icon-btn position-select-btn';
        positionBtn.title = 'Change Position';
        positionBtn.textContent = '👑';
        positionBtn.onclick = showPositionSelector;
        headerActions.insertBefore(positionBtn, headerActions.querySelector('.language-selector'));
    }
}

// Navigate to company section for position management
function goToCompanySection() {
    showSection('company');
    loadCompanyDetails();
}
