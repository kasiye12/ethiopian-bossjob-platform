// Job Apply - Role Check
function handleApply(jobId, jobTitle) {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('⚠️ Please login to apply for jobs');
        if (window.MasterLayout) {
            MasterLayout.showLogin();
        }
        return;
    }
    
    if (role !== 'candidate') {
        alert('❌ Only job seekers can apply for jobs.\n\nYou are logged in as: ' + role.toUpperCase());
        return;
    }
    
    // Open apply modal
    openApplyModal(jobId, jobTitle);
}
