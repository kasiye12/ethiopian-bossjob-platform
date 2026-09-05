const API_BASE_URL = window.location.origin;
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedJobs();
    checkAuth();
    animateStats();
});

// Check authentication
function checkAuth() {
    if (authToken) {
        fetchUserProfile();
    }
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (data.success) {
            currentUser = data.data;
            updateNavbar();
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Update navbar based on auth state
function updateNavbar() {
    const navActions = document.querySelector('.nav-actions');
    if (currentUser) {
        navActions.innerHTML = `
            <button class="btn btn-ghost" onclick="window.location.href='/dashboard.html'">Dashboard</button>
            <button class="btn btn-primary" onclick="logout()">Logout</button>
        `;
    }
}

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
                <p style="font-size: 14px;">Please try again later.</p>
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
            <div class="job-card-header">
                <div>
                    <h3 class="job-card-title">${job.title || 'Untitled Position'}</h3>
                    <p class="job-card-company">${job.company_name || 'Company'}</p>
                </div>
                <span class="job-type-badge">${job.job_type || 'Full-time'}</span>
            </div>
            <div class="job-card-details">
                <span class="job-card-location">📍 ${job.region || 'Ethiopia'}${job.sub_city ? ', ' + job.sub_city : ''}</span>
                <span class="job-card-salary">💰 ${job.salary_min_etb ? `ETB ${job.salary_min_etb.toLocaleString()} - ${job.salary_max_etb.toLocaleString()}` : 'Salary Negotiable'}</span>
            </div>
            <div class="job-card-footer">
                <span class="job-card-date">${formatDate(job.created_at)}</span>
                <button class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;">Apply Now</button>
            </div>
        `;
        
        jobsGrid.appendChild(jobCard);
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Animate stats counter
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        const duration = 2000;
        const start = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(target * progress);
            
            stat.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    });
}

// Search functions
function heroSearchJobs() {
    const search = document.getElementById('heroSearch').value;
    const location = document.getElementById('heroLocation').value;
    
    let url = '/api/v1/jobs?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (location) url += `region=${encodeURIComponent(location)}`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderJobs(data.data);
                document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(err => console.error('Search error:', err));
}

function handleHeroSearch(event) {
    if (event.key === 'Enter') {
        heroSearchJobs();
    }
}

function quickSearch(term) {
    document.getElementById('heroSearch').value = term;
    heroSearchJobs();
}

function filterByCategory(category) {
    fetch(`${API_BASE_URL}/api/v1/jobs?category=${category}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderJobs(data.data);
                document.querySelector('.featured-jobs').scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(err => console.error('Error:', err));
}

function scrollToJobs() {
    document.querySelector('.featured-jobs').scrollIntoView({ behavior: 'smooth' });
}

function viewJob(jobId) {
    if (!authToken) {
        showLogin();
        return;
    }
    window.location.href = `/dashboard.html?job=${jobId}`;
}

// Modal functions
function showLogin() {
    closeModal('registerModal');
    document.getElementById('loginModal').style.display = 'block';
}

function showRegister() {
    closeModal('loginModal');
    document.getElementById('registerModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Toggle mobile menu
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
    } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '70px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'white';
        navLinks.style.padding = '20px';
        navLinks.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    }
}

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: phone, password: password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.accessToken;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            closeModal('loginModal');
            updateNavbar();
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
});

// Register form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        phone_number: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value,
        full_name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value || undefined,
        role: document.getElementById('regRole').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.accessToken;
            currentUser = data.data.user;
            localStorage.setItem('authToken', authToken);
            closeModal('registerModal');
            updateNavbar();
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        alert('Registration failed. Please try again.');
    }
});

// Logout
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    window.location.reload();
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}
