// Complete Role-Based Access Control System
const RolePermissions = {
    roles: {
        admin: {
            label: 'Administrator',
            icon: '👑',
            permissions: [
                'view_dashboard', 'manage_users', 'manage_companies', 
                'manage_jobs', 'manage_applications', 'manage_interviews',
                'view_analytics', 'manage_payments', 'manage_settings',
                'view_all_chats', 'delete_anything', 'verify_companies',
                'toggle_users', 'reset_passwords', 'view_reports'
            ],
            pages: [
                { name: 'Admin Panel', url: '/admin.html', icon: '👑' },
                { name: 'User Management', url: '/users.html', icon: '👥' },
                { name: 'HR Dashboard', url: '/hr-dashboard.html', icon: '📊' },
                { name: 'Analytics', url: '/analytics.html', icon: '📈' },
                { name: 'Boss AI', url: '/boss-ai.html', icon: '🤖' },
            ]
        },
        boss: {
            label: 'Employer',
            icon: '🏢',
            permissions: [
                'view_dashboard', 'manage_jobs', 'manage_applications',
                'manage_interviews', 'view_analytics', 'manage_company',
                'search_talents', 'view_applicants', 'chat_candidates',
                'post_jobs', 'schedule_interviews'
            ],
            pages: [
                { name: 'HR Dashboard', url: '/hr-dashboard.html', icon: '📊' },
                { name: 'Employer Dashboard', url: '/employer-dashboard.html', icon: '🏢' },
                { name: 'Post Job', url: '/post-job.html', icon: '📝' },
                { name: 'Analytics', url: '/analytics.html', icon: '📈' },
                { name: 'Boss AI', url: '/boss-ai.html', icon: '🤖' },
            ]
        },
        candidate: {
            label: 'Job Seeker',
            icon: '👤',
            permissions: [
                'view_jobs', 'apply_jobs', 'manage_resume', 'manage_profile',
                'chat_employers', 'view_applications', 'save_jobs',
                'view_recommendations', 'track_applications'
            ],
            pages: [
                { name: 'Dashboard', url: '/dashboard.html', icon: '📊' },
                { name: 'Find Jobs', url: '/jobs.html', icon: '💼' },
                { name: 'My Resume', url: '/resume.html', icon: '📄' },
                { name: 'My Profile', url: '/profile.html', icon: '👤' },
                { name: 'Chat', url: '/chat.html', icon: '💬' },
            ]
        },
        guest: {
            label: 'Guest',
            icon: '🌐',
            permissions: [
                'view_jobs', 'view_companies', 'view_about'
            ],
            pages: [
                { name: 'Home', url: '/', icon: '🏠' },
                { name: 'Find Jobs', url: '/jobs.html', icon: '💼' },
                { name: 'Companies', url: '/companies.html', icon: '🏢' },
                { name: 'Remote Jobs', url: '/remote-jobs.html', icon: '🌐' },
                { name: 'About', url: '/about.html', icon: 'ℹ️' },
            ]
        }
    },
    
    getCurrentRole() {
        return localStorage.getItem('userRole') || 'guest';
    },
    
    hasPermission(permission) {
        const role = this.getCurrentRole();
        const rolePermissions = this.roles[role]?.permissions || [];
        return rolePermissions.includes(permission);
    },
    
    getRoleInfo() {
        const role = this.getCurrentRole();
        return this.roles[role] || this.roles.guest;
    },
    
    getPages() {
        const role = this.getCurrentRole();
        return this.roles[role]?.pages || this.roles.guest.pages;
    },
    
    // Show/hide elements based on permissions
    applyPermissions() {
        // Hide elements without permission
        document.querySelectorAll('[data-permission]').forEach(el => {
            const permission = el.getAttribute('data-permission');
            if (!this.hasPermission(permission)) {
                el.style.display = 'none';
            }
        });
        
        // Show role-specific elements
        document.querySelectorAll('[data-role]').forEach(el => {
            const requiredRole = el.getAttribute('data-role');
            if (requiredRole !== this.getCurrentRole()) {
                el.style.display = 'none';
            }
        });
        
        // Update role badges
        document.querySelectorAll('.role-display').forEach(el => {
            const roleInfo = this.getRoleInfo();
            el.textContent = `${roleInfo.icon} ${roleInfo.label}`;
        });
    },
    
    // Check if user can access page
    canAccessPage(page) {
        const pages = this.getPages();
        return pages.some(p => p.url === page);
    },
    
    // Redirect if no access
    checkAccess() {
        const currentPath = window.location.pathname;
        const role = this.getCurrentRole();
        
        // Admin-only pages
        const adminPages = ['/admin.html', '/users.html'];
        if (adminPages.includes(currentPath) && role !== 'admin') {
            alert('Admin access required');
            window.location.href = '/';
            return false;
        }
        
        // Employer-only pages
        const employerPages = ['/hr-dashboard.html', '/employer-dashboard.html', '/post-job.html'];
        if (employerPages.includes(currentPath) && role !== 'boss' && role !== 'admin') {
            alert('Employer access required');
            window.location.href = '/';
            return false;
        }
        
        return true;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    RolePermissions.applyPermissions();
    RolePermissions.checkAccess();
});

window.RolePermissions = RolePermissions;
