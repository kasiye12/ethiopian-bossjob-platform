// Home Page Jobs with Apply Modal
document.addEventListener('DOMContentLoaded', loadFeaturedJobs);

async function loadFeaturedJobs() {
    try {
        const res = await fetch('/api/v1/jobs?limit=6');
        const data = await res.json();
        const jobs = data.data || [];
        
        const container = document.getElementById('featuredJobs');
        if (!container) return;
        
        if (jobs.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;">No jobs available</p>';
            return;
        }
        
        container.innerHTML = jobs.map(job => `
            <div style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.08);border-left:4px solid #4CAF50;">
                <h3 style="font-size:16px;margin-bottom:5px;">${job.title}</h3>
                <p style="color:#4CAF50;font-weight:600;font-size:13px;">${job.company_name || 'Company'}</p>
                <p style="color:#666;font-size:13px;">📍 ${job.region} | 💰 ${job.salary_min_etb ? 'ETB ' + job.salary_min_etb : 'Negotiable'}</p>
                <button onclick="openApplyModal('${job.id}', '${job.title}')" style="margin-top:10px;padding:8px 20px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Apply Now</button>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading jobs:', e);
    }
}
