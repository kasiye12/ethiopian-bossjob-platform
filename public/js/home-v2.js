const API_BASE_URL = window.location.origin;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedJobs();
    animateStats();
    checkAuth();
});

// Load featured jobs
async function loadFeaturedJobs() {
    const container = document.getElementById('featuredJobs');
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/jobs?limit=6`);
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
            renderJobs(data.data);
        } else {
            container.innerHTML = '<div class="loading"><p>No jobs available yet.</p></div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="loading"><p>Unable to load jobs.</p></div>';
    }
}

function renderJobs(jobs) {
    const container = document.getElementById('featuredJobs');
    container.innerHTML = jobs.map(job => `
        <div class="job-card" onclick="viewJob('${job.id}')">
            <h3>${job.title}</h3>
            <p class="job-company">${job.company_name || 'Company'}</p>
            <div class="job-info">
                <span>📍 ${job.region || 'Ethiopia'}</span>
                <span class="job-salary">💰 ${job.salary_min_etb ? `ETB ${Number(job.salary_min_etb).toLocaleString()}` : 'Negotiable'}</span>
                <span>💼 ${job.job_type || 'Full-time'}</span>
            </div>
        </div>
    `).join('');
}

// Animate stats
function animateStats() {
    const targets = { statJobs: 2500, statCompanies: 500, statSeekers: 50000, statRate: 95 };
    
    Object.entries(targets).forEach(([id, target]) => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const isPercent = id === 'statRate';
        const duration = 2000;
        const start = performance.now();
        
        function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            const value = Math.floor(target * progress);
            el.textContent = isPercent ? `${value}%` : value.toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// Check auth
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    const loginBtn = document.querySelector('.btn-login');
    const startBtn = document.querySelector('.btn-get-started');
    
    if (loginBtn && startBtn) {
        loginBtn.textContent = 'Dashboard';
        loginBtn.onclick = () => location.href = '/dashboard.html';
        startBtn.textContent = 'Logout';
        startBtn.onclick = logout;
    }
}

// Modals
function showLogin() {
    closeModal('registerModal');
    document.getElementById('loginModal').style.display = 'flex';
}

function showRegister() {
    closeModal('loginModal');
    document.getElementById('registerModal').style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: phone, password })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.data.accessToken);
            closeModal('loginModal');
            alert('Login successful!');
            location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (e) {
        alert('Login failed');
    }
}

// Register
async function handleRegister(e) {
    e.preventDefault();
    
    const data = {
        phone_number: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('regName').value,
        role: document.getElementById('regRole').value,
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.success) {
            localStorage.setItem('authToken', result.data.accessToken);
            closeModal('registerModal');
            alert('Registration successful!');
            location.href = '/dashboard.html';
        } else {
            alert(result.message || 'Registration failed');
        }
    } catch (e) {
        alert('Registration failed');
    }
}

// Search
function searchJobs() {
    const search = document.getElementById('searchInput').value;
    const location = document.getElementById('locationSelect').value;
    let url = '/jobs.html?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (location) url += `region=${encodeURIComponent(location)}`;
    location.href = url;
}

function handleSearch(e) {
    if (e.key === 'Enter') searchJobs();
}

function quickSearch(term) {
    document.getElementById('searchInput').value = term;
    searchJobs();
}

function filterCategory(cat) {
    location.href = `/jobs.html?category=${encodeURIComponent(cat)}`;
}

function viewJob(id) {
    location.href = `/jobs.html?id=${id}`;
}

function logout() {
    localStorage.removeItem('authToken');
    location.reload();
}

function changeLanguage(lang) {
    localStorage.setItem('bossjob_language', lang);
    alert('Language: ' + lang);
}

function toggleMobileMenu() {
    alert('Mobile menu');
}

// Close modal on outside click
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
}
