const API_BASE_URL = window.location.origin;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedJobs();
    animateStats();
    checkAuth();
});

// Load featured jobs
async function loadFeaturedJobs() {
    const jobsGrid = document.getElementById('featuredJobs');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/jobs?limit=6`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            renderJobs(data.data);
        } else {
            jobsGrid.innerHTML = `
                <div class="loading-spinner">
                    <p>No jobs available yet.</p>
                    <p style="font-size: 14px;">Check back soon for new opportunities!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsGrid.innerHTML = `
            <div class="loading-spinner">
                <p>Unable to load jobs.</p>
                <p style="font-size: 14px;">Please make sure the server is running.</p>
            </div>
        `;
    }
}

// Render jobs
function renderJobs(jobs) {
    const jobsGrid = document.getElementById('featuredJobs');
    jobsGrid.innerHTML = '';
    
    jobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.onclick = () => viewJob(job.id);
        
        jobCard.innerHTML = `
            <h3>${job.title || 'Untitled Position'}</h3>
            <p class="job-company">${job.company_name || 'Company'}</p>
            <div class="job-details">
                <span>📍 ${job.region || 'Ethiopia'}</span>
                <span class="job-salary">💰 ${job.salary_min_etb ? `ETB ${Number(job.salary_min_etb).toLocaleString()} - ${Number(job.salary_max_etb).toLocaleString()}` : 'Salary Negotiable'}</span>
                <span>💼 ${job.job_type || 'Full-time'}</span>
            </div>
        `;
        
        jobsGrid.appendChild(jobCard);
    });
}

// Animate stats
function animateStats() {
    const stats = {
        statJobs: 2500,
        statCompanies: 500,
        statSeekers: 50000,
        statRate: 95,
    };
    
    Object.entries(stats).forEach(([id, target]) => {
        const element = document.getElementById(id);
        if (!element) return;
        
        const duration = 2000;
        const start = performance.now();
        const isPercent = id === 'statRate';
        
        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(target * progress);
            
            element.textContent = isPercent ? `${current}%` : current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    });
}

// Check auth
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Update nav buttons
        const navRight = document.querySelector('.nav-right');
        const loginBtn = navRight.querySelector('.btn-ghost');
        const registerBtn = navRight.querySelector('.btn-primary');
        
        if (loginBtn && registerBtn) {
            loginBtn.textContent = 'Dashboard';
            loginBtn.onclick = () => window.location.href = '/dashboard.html';
            registerBtn.textContent = 'Logout';
            registerBtn.onclick = logout;
        }
    }
}

// Show login modal
function showLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

// Show register modal
function showRegister() {
    closeModal('loginModal');
    document.getElementById('registerModal').style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.data.accessToken);
            closeModal('loginModal');
            alert('Login successful!');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const userData = {
        phone_number: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value || undefined,
        role: document.getElementById('regRole').value,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('authToken', data.data.accessToken);
            closeModal('registerModal');
            alert('Registration successful!');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        alert('Registration failed. Please try again.');
    }
}

// Search
function searchJobs() {
    const search = document.getElementById('searchInput').value;
    const location = document.getElementById('locationSelect').value;
    
    let url = '/jobs.html?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (location) url += `region=${encodeURIComponent(location)}`;
    
    window.location.href = url;
}

function handleSearchKeypress(e) {
    if (e.key === 'Enter') searchJobs();
}

function quickSearch(term) {
    document.getElementById('searchInput').value = term;
    searchJobs();
}

function filterByCategory(category) {
    window.location.href = `/jobs.html?category=${encodeURIComponent(category)}`;
}

function viewJob(jobId) {
    window.location.href = `/jobs.html?id=${jobId}`;
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.reload();
}

function changeLanguage(lang) {
    localStorage.setItem('bossjob_language', lang);
    alert('Language changed! (Demo)');
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}
