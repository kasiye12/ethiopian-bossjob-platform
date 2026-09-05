// Apply Modal - Only for Job Seekers (Candidates)
const ApplyModal = {
    jobId: null,
    jobTitle: '',
    
    open(jobId, jobTitle) {
        // Check if user is logged in
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');
        
        if (!token) {
            alert('⚠️ Please login to apply for jobs');
            if (window.MasterLayout) {
                MasterLayout.showLogin();
            }
            return;
        }
        
        // Check if user is a candidate (job seeker)
        if (role !== 'candidate') {
            alert('❌ Only job seekers can apply for jobs.\n\nEmployers and admins cannot apply.');
            return;
        }
        
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        
        // Create modal if not exists
        this.createModal();
        
        // Pre-fill job title
        document.getElementById('applyJobTitle').value = jobTitle || '';
        
        // Show modal
        document.getElementById('applyModal').classList.add('show');
    },
    
    createModal() {
        if (document.getElementById('applyModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'applyModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box" style="max-width:500px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2 style="font-size:18px;">📝 Apply for this Job</h2>
                    <button onclick="ApplyModal.close()" style="background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>
                </div>
                
                <div style="background:#FFF3CD;color:#856404;padding:10px 15px;border-radius:8px;font-size:13px;margin-bottom:15px;">
                    ⚠️ Only job seekers can apply. Please complete your work preferences.
                </div>
                
                <div class="form-group">
                    <label style="font-weight:600;font-size:13px;">Job Title *</label>
                    <input type="text" id="applyJobTitle" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;" required>
                </div>
                
                <div class="form-group">
                    <label style="font-weight:600;font-size:13px;">Desired Work Location *</label>
                    <select id="applyLocation" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
                        <option value="">Select Location</option>
                        <option value="Addis Ababa">Addis Ababa</option>
                        <option value="Oromia">Oromia</option>
                        <option value="Amhara">Amhara</option>
                        <option value="Tigray">Tigray</option>
                        <option value="Dire Dawa">Dire Dawa</option>
                        <option value="Remote">Remote</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label style="font-weight:600;font-size:13px;">Desired Job Type *</label>
                    <select id="applyJobType" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
                        <option value="">Select Type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label style="font-weight:600;font-size:13px;">Expected Salary Range (Optional)</label>
                    <div style="display:flex;gap:10px;">
                        <input type="number" id="applySalaryMin" placeholder="Min ETB" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:6px;">
                        <input type="number" id="applySalaryMax" placeholder="Max ETB" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:6px;">
                    </div>
                </div>
                
                <div class="form-group">
                    <label style="font-weight:600;font-size:13px;">Salary Type *</label>
                    <select id="applySalaryType" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
                        <option value="">Select</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Hourly">Hourly</option>
                        <option value="Contract">Contract Based</option>
                        <option value="Negotiable">Negotiable</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label style="font-weight:600;font-size:13px;">Cover Letter (Optional)</label>
                    <textarea id="applyCoverLetter" rows="3" placeholder="Brief message..." style="width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;"></textarea>
                </div>
                
                <div style="display:flex;gap:10px;margin-top:15px;">
                    <button onclick="ApplyModal.close()" style="flex:1;padding:12px;background:#f5f5f5;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Cancel</button>
                    <button onclick="ApplyModal.submit()" style="flex:2;padding:12px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:700;">Submit Application</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles if not present
        if (!document.getElementById('applyModalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'applyModalStyles';
            styles.textContent = `
                .modal-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    z-index: 9999;
                    align-items: center;
                    justify-content: center;
                }
                .modal-overlay.show { display: flex; }
                .modal-box {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
            `;
            document.head.appendChild(styles);
        }
    },
    
    close() {
        const modal = document.getElementById('applyModal');
        if (modal) modal.classList.remove('show');
    },
    
    async submit() {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');
        
        // Double-check role
        if (role !== 'candidate') {
            alert('❌ Only job seekers can apply');
            this.close();
            return;
        }
        
        const title = document.getElementById('applyJobTitle').value;
        const location = document.getElementById('applyLocation').value;
        const jobType = document.getElementById('applyJobType').value;
        const salaryType = document.getElementById('applySalaryType').value;
        
        if (!title || !location || !jobType || !salaryType) {
            alert('Please fill all required fields');
            return;
        }
        
        const data = {
            desired_title: title,
            desired_location: location,
            desired_job_type: jobType,
            expected_salary_min: parseFloat(document.getElementById('applySalaryMin').value) || null,
            expected_salary_max: parseFloat(document.getElementById('applySalaryMax').value) || null,
            salary_type: salaryType,
            cover_letter: document.getElementById('applyCoverLetter').value,
        };
        
        try {
            const res = await fetch(API_URL + '/api/v1/applications/' + this.jobId + '/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(data)
            });
            
            const result = await res.json();
            
            if (result.success) {
                alert('✅ Application submitted successfully!');
                this.close();
            } else {
                alert('❌ ' + (result.message || 'Failed to apply'));
            }
        } catch (e) {
            alert('Error submitting application');
        }
    }
};

const API_URL = window.location.origin;

// Global function for opening apply modal
function openApplyModal(jobId, jobTitle) {
    ApplyModal.open(jobId, jobTitle);
}

window.ApplyModal = ApplyModal;
