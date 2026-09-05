const API_BASE_URL = window.location.origin;
const authToken = localStorage.getItem('authToken');

// Check admin access
if (!authToken) {
    window.location.href = '/';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();
    setupNavigation();
    loadDashboard();
});

// Verify admin role
async function verifyAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        if (data.success && (data.data.role === 'admin' || data.data.role === 'super_admin')) {
            // Access granted
        } else {
            alert('Access denied. Admin only.');
            window.location.href = '/';
        }
    } catch (error) {
        window.location.href = '/';
    }
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
            
            document.getElementById(section).classList.add('active');
            item.classList.add('active');
            
            document.getElementById('adminTitle').textContent = item.textContent.trim();
            
            // Load section data
            switch(section) {
                case 'users': loadUsers(); break;
                case 'companies': loadCompanies(); break;
                case 'jobs': loadJobs(); break;
                case 'applications': loadApplications(); break;
                case 'payments': loadPayments(); break;
            }
        });
    });
}

// Load dashboard stats
async function loadDashboard() {
    try {
        // Load users
        const usersRes = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const usersData = await usersRes.json();
        document.getElementById('totalUsers').textContent = usersData.data?.length || 0;
        
        // Load companies
        const companiesRes = await fetch(`${API_BASE_URL}/api/v1/companies`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const companiesData = await companiesRes.json();
        document.getElementById('totalCompanies').textContent = companiesData.data?.length || 0;
        
        // Load jobs
        const jobsRes = await fetch(`${API_BASE_URL}/api/v1/jobs`);
        const jobsData = await jobsRes.json();
        const jobs = jobsData.data || [];
        document.getElementById('activeJobs').textContent = jobs.filter(j => j.status === 'active').length;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = (data.data || []).map(user => `
            <tr>
                <td>${user.full_name}</td>
                <td>${user.phone_number}</td>
                <td>${user.email || '-'}</td>
                <td>${user.role}</td>
                <td><span style="color: ${user.is_active ? 'green' : 'red'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button onclick="toggleUser('${user.id}')">Toggle</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load companies
async function loadCompanies() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/companies`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('companiesTableBody');
        tbody.innerHTML = (data.data || []).map(company => `
            <tr>
                <td>${company.company_name}</td>
                <td>${company.tin_number}</td>
                <td>${company.industry || '-'}</td>
                <td><span style="color: ${company.is_verified ? 'green' : 'orange'}">${company.is_verified ? '✅' : '⏳'}</span></td>
                <td><button onclick="verifyCompany('${company.id}')">Verify</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

// Load jobs
async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/jobs`);
        const data = await response.json();
        
        const tbody = document.getElementById('jobsTableBody');
        tbody.innerHTML = (data.data || []).map(job => `
            <tr>
                <td>${job.title}</td>
                <td>${job.company_name || '-'}</td>
                <td>${job.status}</td>
                <td>${job.applications_count || 0}</td>
                <td><button onclick="toggleJob('${job.id}')">Toggle</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

// Load applications
async function loadApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/admin/applications`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('applicationsTableBody');
        tbody.innerHTML = (data.data || []).map(app => `
            <tr>
                <td>${app.candidate_name || 'Candidate'}</td>
                <td>${app.job_title || 'Job'}</td>
                <td>${app.status}</td>
                <td>${new Date(app.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Load payments
async function loadPayments() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/admin/payments`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = (data.data || []).map(payment => `
            <tr>
                <td>${payment.transaction_reference || payment.id}</td>
                <td>ETB ${payment.amount}</td>
                <td>${payment.payment_method || '-'}</td>
                <td><span style="color: ${payment.status === 'completed' ? 'green' : 'orange'}">${payment.status}</span></td>
                <td>${new Date(payment.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

// Admin actions
async function toggleUser(userId) {
    try {
        await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/toggle`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        loadUsers();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function verifyCompany(companyId) {
    try {
        await fetch(`${API_BASE_URL}/api/v1/admin/companies/${companyId}/verify`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        loadCompanies();
        alert('Company verified!');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function toggleJob(jobId) {
    try {
        await fetch(`${API_BASE_URL}/api/v1/admin/jobs/${jobId}/toggle`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        loadJobs();
    } catch (error) {
        console.error('Error:', error);
    }
}

function refreshData() {
    loadDashboard();
    alert('Data refreshed!');
}

function saveSettings() {
    alert('Settings saved!');
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
}
