const API_BASE_URL = window.location.origin;
let currentPage = 1;
let allJobs = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadJobs();
    loadUserProfile();
});

// Load jobs from API
async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/jobs?limit=100`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            allJobs = data.data;
            renderJobs(allJobs);
        } else {
            // Fallback to sample data
            renderJobs(getSampleJobs());
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        renderJobs(getSampleJobs());
    }
}

// Load user profile
async function loadUserProfile() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            const user = data.data;
            const avatar = document.querySelector('.user-avatar');
            if (avatar) {
                avatar.textContent = user.full_name.split(' ').map(w => w[0]).join('').substring(0, 2);
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Sample jobs fallback
function getSampleJobs() {
    return [
        { id: 1, title: 'Data Encoder', company_name: 'Ethio Tech Solutions PLC', salary_min_etb: 15000, salary_max_etb: 20000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa' },
        { id: 2, title: 'Senior Go Backend Engineer', company_name: 'Ethio Tech Solutions PLC', salary_min_etb: 20000, salary_max_etb: 35000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa' },
        { id: 3, title: 'Java Developer', company_name: 'Habesha Innovations', salary_min_etb: 25000, salary_max_etb: 30000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa' },
        { id: 4, title: 'Backend Developer', company_name: 'Addis Digital Group', salary_min_etb: null, salary_max_etb: null, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa' },
        { id: 5, title: 'C++ Developer', company_name: 'Ethio Tech Solutions PLC', salary_min_etb: 3000, salary_max_etb: 5000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa' },
        { id: 6, title: 'AI Application Engineer', company_name: 'Addis Digital Group', salary_min_etb: 3000, salary_max_etb: 6000, job_type: 'Remote', experience_level: '5-10 Yrs Exp', education_level_required: 'Edu not required', region: 'Addis Ababa' },
    ];
}

// Render jobs
function renderJobs(jobs) {
    const jobCards = document.getElementById('jobCards');
    
    if (!jobs || jobs.length === 0) {
        jobCards.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No jobs found</p>';
        return;
    }
    
    jobCards.innerHTML = jobs.map(job => `
        <div class="job-card" onclick="viewJob('${job.id}')">
            <div class="job-card-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <p class="job-company">${job.company_name}</p>
                </div>
                <div class="job-salary">
                    ${job.salary_min_etb ? `ETB ${job.salary_min_etb.toLocaleString()}${job.salary_max_etb ? `-${job.salary_max_etb.toLocaleString()}` : ''}` : 'Negotiable'}
                    <span style="font-size: 11px; color: #999; display: block;">[Monthly]</span>
                </div>
            </div>
            <div class="job-tags">
                <span class="job-tag remote">🌐 ${job.job_type}</span>
                <span class="job-tag">${job.experience_level || 'Any Experience'}</span>
                <span class="job-tag">${job.education_level_required || 'Any Education'}</span>
                <span class="job-tag">Full-time</span>
                <span class="job-tag">📍 ${job.region}</span>
            </div>
        </div>
    `).join('');
    
    renderPagination(jobs.length);
}

// Render pagination
function renderPagination(totalJobs) {
    const pages = Math.ceil(totalJobs / 10);
    const pagination = document.getElementById('pagination');
    
    let html = '';
    for (let i = 1; i <= Math.min(pages, 10); i++) {
        html += `<button class="page-btn ${i === 1 ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    pagination.innerHTML = html;
}

// Toggle filters
function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
}

// View job
function viewJob(jobId) {
    window.location.href = `/job-details.html?id=${jobId}`;
}

// Pagination
function goToPage(page) {
    currentPage = page;
    document.querySelectorAll('.page-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Search jobs
function searchJobs() {
    const searchInput = document.querySelector('.search-bar input');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        renderJobs(allJobs);
        return;
    }
    
    const filtered = allJobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm) ||
        job.company_name.toLowerCase().includes(searchTerm)
    );
    
    renderJobs(filtered);
}
