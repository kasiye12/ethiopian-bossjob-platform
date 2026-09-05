const API_BASE_URL = 'http://localhost:3001';
const token = localStorage.getItem('authToken');
let userSkills = [];

if (!token) {
    window.location.href = '/';
}

// Load profile data
document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
});

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const user = data.data;
            
            // Update header
            document.getElementById('profileName').textContent = user.full_name;
            document.getElementById('profilePhone').textContent = user.phone_number;
            document.getElementById('profileRole').textContent = user.role === 'boss' ? 'Employer' : 'Job Seeker';
            document.getElementById('avatarInitial').textContent = user.full_name.charAt(0).toUpperCase();
            
            // Update form
            document.getElementById('fullName').value = user.full_name;
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone_number;
            
            // Load candidate profile if exists
            if (user.role === 'candidate') {
                await loadCandidateProfile();
            } else {
                document.getElementById('candidateSection').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadCandidateProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/candidates/my-profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            const profile = data.data;
            
            document.getElementById('professionTitle').value = profile.profession_title || '';
            document.getElementById('yearsExperience').value = profile.years_of_experience || 0;
            document.getElementById('educationLevel').value = profile.education_level || '';
            document.getElementById('currentLocation').value = profile.current_location || '';
            document.getElementById('expectedSalaryMin').value = profile.expected_salary_min || '';
            document.getElementById('expectedSalaryMax').value = profile.expected_salary_max || '';
            document.getElementById('summary').value = profile.summary || '';
            
            if (profile.skills) {
                userSkills = profile.skills;
                renderSkills();
            }
        }
    } catch (error) {
        console.error('Error loading candidate profile:', error);
    }
}

function handleSkillInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const skillInput = document.getElementById('skillInput');
        const skill = skillInput.value.trim();
        
        if (skill && !userSkills.includes(skill)) {
            userSkills.push(skill);
            renderSkills();
        }
        
        skillInput.value = '';
    }
}

function renderSkills() {
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';
    
    userSkills.forEach(skill => {
        const skillTag = document.createElement('span');
        skillTag.className = 'skill-tag';
        skillTag.innerHTML = `
            ${skill}
            <span class="remove-skill" onclick="removeSkill('${skill}')">×</span>
        `;
        skillsContainer.appendChild(skillTag);
    });
    
    // Add input back
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'add-skill-input';
    input.id = 'skillInput';
    input.placeholder = 'Type a skill and press Enter';
    input.onkeypress = handleSkillInput;
    skillsContainer.appendChild(input);
}

function removeSkill(skill) {
    userSkills = userSkills.filter(s => s !== skill);
    renderSkills();
}

// Save profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const profileData = {
        full_name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
    };
    
    if (document.getElementById('candidateSection').style.display !== 'none') {
        profileData.profession_title = document.getElementById('professionTitle').value;
        profileData.years_of_experience = parseInt(document.getElementById('yearsExperience').value) || 0;
        profileData.education_level = document.getElementById('educationLevel').value;
        profileData.current_location = document.getElementById('currentLocation').value;
        profileData.expected_salary_min = parseFloat(document.getElementById('expectedSalaryMin').value) || null;
        profileData.expected_salary_max = parseFloat(document.getElementById('expectedSalaryMax').value) || null;
        profileData.skills = userSkills;
        profileData.summary = document.getElementById('summary').value;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/candidates/update-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Profile saved successfully!');
        } else {
            alert(data.message || 'Failed to save profile');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile');
    }
});

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
}
