const API_BASE_URL = 'http://localhost:3001';

// Handle job posting
document.getElementById('jobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please login first');
        window.location.href = '/';
        return;
    }
    
    const jobData = {
        title: document.getElementById('jobTitle').value,
        category: document.getElementById('jobCategory').value,
        job_type: document.getElementById('jobType').value,
        description: document.getElementById('jobDescription').value,
        requirements: document.getElementById('jobRequirements').value,
        region: document.getElementById('jobRegion').value,
        sub_city: document.getElementById('jobSubCity').value,
        salary_min_etb: parseFloat(document.getElementById('salaryMin').value) || null,
        salary_max_etb: parseFloat(document.getElementById('salaryMax').value) || null,
        is_salary_negotiable: document.getElementById('salaryNegotiable').checked,
        experience_level: document.getElementById('experienceLevel').value,
        education_level_required: document.getElementById('educationLevel').value,
        number_of_positions: parseInt(document.getElementById('numPositions').value) || 1,
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(jobData),
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Job posted successfully!');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Failed to post job');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to post job. Please try again.');
    }
});
