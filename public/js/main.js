const API_BASE_URL = window.location.origin;
let currentUser = null;
let authToken = localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded', () => {
    loadJobs();
    checkAuth();
});

function checkAuth() {
    if (authToken) {
        fetchUserProfile();
        updateNavbar();
    }
}

function updateNavbar() {
    const navLinks = document.querySelector('.nav-links');
    if (currentUser) {
        // Show dashboard link and logout
        const loginBtn = document.querySelector('button[onclick="showLogin()"]');
        const registerBtn = document.querySelector('button[onclick="showRegister()"]');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Add dashboard button if not exists
        if (!document.querySelector('.dashboard-btn')) {
            const dashboardBtn = document.createElement('button');
            dashboardBtn.className = 'btn btn-primary dashboard-btn';
            dashboardBtn.textContent = 'Dashboard';
            dashboardBtn.onclick = () => window.location.href = '/dashboard.html';
            navLinks.appendChild(dashboardBtn);
        }
        
        // Add logout button if not exists
        if (!document.querySelector('.logout-btn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn btn-outline logout-btn';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = logout;
            navLinks.appendChild(logoutBtn);
        }
    }
}

async function loadJobs() {
    const jobsList = document.getElementById('jobsList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/jobs`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            renderJobs(data.data);
        } else {
            jobsList.innerHTML = `
                <div class="loading" style="grid-column: 1/-1;">
                    <p style="font-size: 24px;">📋</p>
                    <p>No jobs available yet.</p>
                    <p style="font-size: 14px; color: #999;">Check back soon for new opportunities!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsList.innerHTML = `
            <div class="loading" style="grid-column: 1/-1;">
                <p style="font-size: 24px;">⚠️</p>
                <p>Unable to load jobs.</p>
                <p style="font-size: 14px; color: #999;">Please make sure the server is running.</p>
            </div>
        `;
    }
}

function renderJobs(jobs) {
    const jobsList = document.getElementById('jobsList');
    jobsList.innerHTML = '';
    
    jobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.innerHTML = `
            <h3 class="job-title">${job.title || 'Untitled Position'}</h3>
            <p class="job-company">🏢 ${job.company_name || 'Company'}</p>
            <p class="job-location">📍 ${job.region || 'Ethiopia'}${job.sub_city ? ', ' + job.sub_city : ''}</p>
            <p class="job-salary">💰 ${job.salary_min_etb ? `ETB ${job.salary_min_etb.toLocaleString()} - ${job.salary_max_etb.toLocaleString()}` : 'Salary Negotiable'}</p>
            <span class="job-type">${job.job_type || 'Full-time'}</span>
            ${job.experience_level ? `<span class="job-type" style="margin-left: 5px; background: #fff3cd; color: #856404;">${job.experience_level}</span>` : ''}
            ${currentUser ? `<button class="btn btn-primary" style="margin-top: 10px; width: 100%;" onclick="applyForJob('${job.id}')">Apply Now</button>` : ''}
        `;
        jobsList.appendChild(jobCard);
    });
}

function searchJobs() {
    const searchTerm = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    
    let url = `${API_BASE_URL}/api/v1/jobs?`;
    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
    if (category) url += `category=${encodeURIComponent(category)}`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderJobs(data.data);
            }
        })
        .catch(err => console.error('Search error:', err));
}

async function applyForJob(jobId) {
    if (!authToken) {
        alert('Please login to apply for jobs');
        showLogin();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/applications/${jobId}/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Application submitted successfully!');
        } else {
            alert(data.message || 'Failed to apply');
        }
    } catch (error) {
        console.error('Apply error:', error);
        alert('Failed to apply. Please try again.');
    }
}

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

function scrollToJobs() {
    document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    window.location.reload();
}

// Login form handler
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
            alert('Login successful!');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
});

// Register form handler
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
            alert('Registration successful!');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        alert('Registration failed. Please try again.');
    }
});

window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}
