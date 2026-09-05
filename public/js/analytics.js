// Analytics Dashboard JavaScript
const API_BASE_URL = window.location.origin;
const authToken = localStorage.getItem('authToken');

if (!authToken) {
    window.location.href = '/';
}

// Chart instances
let applicationsChart, viewsChart, jobsChart, pipelineChart, funnelChart;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    loadTopJobs();
});

// Load analytics data
async function loadAnalytics() {
    try {
        // In production, fetch from API
        // const response = await fetch(`${API_BASE_URL}/api/v1/analytics`, {
        //     headers: { 'Authorization': `Bearer ${authToken}` }
        // });
        // const data = await response.json();
        
        // For demo, use sample data
        updateStats({
            totalViews: 15420,
            totalApplications: 1250,
            hireRate: 68,
            avgTimeToHire: 15,
            responseRate: 85,
            avgRating: 4.6
        });
        
        createCharts();
        loadTopJobs();
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update stats
function updateStats(data) {
    document.getElementById('totalViews').textContent = data.totalViews.toLocaleString();
    document.getElementById('totalApplications').textContent = data.totalApplications.toLocaleString();
    document.getElementById('hireRate').textContent = data.hireRate + '%';
    document.getElementById('avgTimeToHire').textContent = data.avgTimeToHire + ' days';
    document.getElementById('responseRate').textContent = data.responseRate + '%';
    document.getElementById('avgRating').textContent = data.avgRating.toFixed(1);
}

// Create charts
function createCharts() {
    // Applications Chart
    const appCtx = document.getElementById('applicationsChart').getContext('2d');
    applicationsChart = new Chart(appCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Applications',
                data: [250, 320, 280, 400],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Views Chart
    const viewsCtx = document.getElementById('viewsChart').getContext('2d');
    viewsChart = new Chart(viewsCtx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Views',
                data: [3500, 4200, 3900, 3800],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Jobs Chart
    const jobsCtx = document.getElementById('jobsChart').getContext('2d');
    jobsChart = new Chart(jobsCtx, {
        type: 'bar',
        data: {
            labels: ['Developer', 'Marketing', 'Accountant', 'Sales', 'Designer'],
            datasets: [{
                label: 'Applications',
                data: [180, 120, 90, 150, 80],
                backgroundColor: [
                    '#4CAF50',
                    '#2196F3',
                    '#FF9800',
                    '#9C27B0',
                    '#F44336'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Pipeline Chart
    const pipelineCtx = document.getElementById('pipelineChart').getContext('2d');
    pipelineChart = new Chart(pipelineCtx, {
        type: 'doughnut',
        data: {
            labels: ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Hired'],
            datasets: [{
                data: [1250, 450, 200, 80, 50],
                backgroundColor: [
                    '#FF9800',
                    '#2196F3',
                    '#9C27B0',
                    '#4CAF50',
                    '#00BCD4'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Funnel Chart
    const funnelCtx = document.getElementById('funnelChart').getContext('2d');
    funnelChart = new Chart(funnelCtx, {
        type: 'bar',
        data: {
            labels: ['Applied', 'Shortlisted', 'Interviewed', 'Offered', 'Hired'],
            datasets: [{
                label: 'Candidates',
                data: [1250, 450, 200, 80, 50],
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: '#4CAF50',
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Load top jobs
function loadTopJobs() {
    const topJobs = [
        { title: 'Senior Software Developer', views: 3500, applications: 450, hireRate: 75 },
        { title: 'Marketing Manager', views: 2800, applications: 320, hireRate: 70 },
        { title: 'Sales Representative', views: 2400, applications: 280, hireRate: 65 },
        { title: 'Accountant', views: 1900, applications: 120, hireRate: 80 },
        { title: 'UX Designer', views: 1500, applications: 80, hireRate: 60 }
    ];
    
    const tbody = document.getElementById('topJobsTable');
    tbody.innerHTML = topJobs.map(job => `
        <tr>
            <td><strong>${job.title}</strong></td>
            <td>${job.views.toLocaleString()}</td>
            <td>${job.applications}</td>
            <td>${job.hireRate}%</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${job.hireRate}%"></div>
                </div>
            </td>
        </tr>
    `).join('');
}

// Refresh analytics
function refreshAnalytics() {
    loadAnalytics();
    alert('Analytics refreshed!');
}
