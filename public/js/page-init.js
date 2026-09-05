// Page Initialization - Include this on all pages
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize layout (navigation + footer)
    if (window.AppLayout) {
        window.appLayout = new AppLayout();
    }
    
    // Initialize i18n
    if (window.I18N) {
        I18N.translatePage(I18N.currentLang);
    }
    
    // Load user data if logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const res = await fetch('/api/v1/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                // Update user info displays
                document.querySelectorAll('.user-name').forEach(el => {
                    el.textContent = data.data.full_name || 'User';
                });
                document.querySelectorAll('.user-avatar').forEach(el => {
                    el.textContent = (data.data.full_name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                });
                document.querySelectorAll('.user-status').forEach(el => {
                    el.textContent = data.data.company_position || data.data.role || 'User';
                });
            }
        } catch (e) {
            console.error('Error loading user:', e);
        }
    }
});
