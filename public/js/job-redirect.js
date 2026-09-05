// Job redirect helper
function viewJob(jobId) {
    window.location.href = '/job-details.html?id=' + jobId;
}

function applyForJob(jobId) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        if (window.MasterLayout) {
            MasterLayout.showLogin();
        }
        return;
    }
    window.location.href = '/job-details.html?id=' + jobId + '&apply=true';
}
