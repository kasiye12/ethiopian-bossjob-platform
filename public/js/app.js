// Complete App Initialization for Bossjob Ethiopia
const APP = {
    API_URL: window.location.origin,
    token: localStorage.getItem('authToken'),
    user: null,
    role: 'guest',
    language: localStorage.getItem('bossjob_language') || 'en',
    
    async init() {
        console.log('🚀 Initializing Bossjob App...');
        
        // Load user if logged in
        if (this.token) {
            await this.loadUser();
        }
        
        // Render navigation
        this.renderNavbar();
        
        // Render footer
        this.renderFooter();
        
        // Set active nav
        this.setActiveNav();
        
        // Apply language
        this.applyLanguage();
        
        console.log('✅ App initialized. Role:', this.role);
    },
    
    async loadUser() {
        try {
            const res = await fetch(`${this.API_URL}/api/v1/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                this.user = data.data;
                this.role = data.data.role;
                localStorage.setItem('userRole', this.role);
            } else {
                this.logout();
            }
        } catch (e) {
            console.error('Error loading user:', e);
        }
    },
    
    getNavItems() {
        const common = [
            { href: '/', label: 'Home', page: 'home', icon: '🏠' },
            { href: '/jobs.html', label: 'Find Jobs', page: 'jobs', icon: '💼' },
            { href: '/companies.html', label: 'Companies', page: 'companies', icon: '🏢' },
        ];
        
        switch (this.role) {
            case 'admin':
            case 'super_admin':
                return [
                    ...common,
                    { href: '/admin.html', label: 'Admin', page: 'admin', icon: '👑' },
                    { href: '/hr-dashboard.html', label: 'HR Dashboard', page: 'hr', icon: '📊' },
                    { href: '/analytics.html', label: 'Analytics', page: 'analytics', icon: '📈' },
                ];
            case 'boss':
                return [
                    ...common,
                    { href: '/hr-dashboard.html', label: 'HR Dashboard', page: 'hr', icon: '📊' },
                    { href: '/analytics.html', label: 'Analytics', page: 'analytics', icon: '📈' },
                    { href: '/boss-ai.html', label: 'Boss AI', page: 'ai', icon: '🤖' },
                ];
            case 'candidate':
                return [
                    ...common,
                    { href: '/remote-jobs.html', label: 'Remote Jobs', page: 'remote', icon: '🌐' },
                ];
            default:
                return [
                    ...common,
                    { href: '/remote-jobs.html', label: 'Remote Jobs', page: 'remote', icon: '🌐' },
                    { href: '/about.html', label: 'About', page: 'about', icon: 'ℹ️' },
                ];
        }
    },
    
    renderNavbar() {
        const navbar = document.getElementById('appNavbar');
        if (!navbar) return;
        
        const currentPage = this.getCurrentPage();
        const navItems = this.getNavItems();
        
        navbar.innerHTML = `
            <div class="container">
                <div class="navbar-inner">
                    <a href="/" class="logo">
                        <span class="logo-icon">B</span>
                        <span class="logo-text">Bossjob <span class="logo-country">Ethiopia</span></span>
                    </a>
                    
                    <nav class="nav-menu">
                        ${navItems.map(item => `
                            <a href="${item.href}" class="nav-link ${currentPage === item.page ? 'active' : ''}">
                                <span class="nav-icon">${item.icon}</span>
                                <span>${item.label}</span>
                            </a>
                        `).join('')}
                    </nav>
                    
                    <div class="nav-actions">
                        ${this.token ? `
                            <a href="/chat.html" class="nav-icon-link">💬 Chat</a>
                            <a href="/resume.html" class="nav-icon-link">📄 Resume</a>
                            <div class="user-profile-mini" onclick="location.href='/profile.html'">
                                <div class="user-avatar">${this.getInitials()}</div>
                            </div>
                            <div class="language-selector">
                                <select class="lang-select" onchange="APP.setLanguage(this.value)">
                                    <option value="en" ${this.language === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
                                    <option value="am" ${this.language === 'am' ? 'selected' : ''}>🇪🇹 አማ</option>
                                    <option value="om" ${this.language === 'om' ? 'selected' : ''}>🇪🇹 Oro</option>
                                </select>
                            </div>
                            <button class="btn btn-login" onclick="APP.logout()">Logout</button>
                        ` : `
                            <div class="language-selector">
                                <select class="lang-select" onchange="APP.setLanguage(this.value)">
                                    <option value="en" ${this.language === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
                                    <option value="am" ${this.language === 'am' ? 'selected' : ''}>🇪🇹 አማ</option>
                                    <option value="om" ${this.language === 'om' ? 'selected' : ''}>🇪🇹 Oro</option>
                                </select>
                            </div>
                            <button class="btn btn-login" onclick="APP.showLogin()">Login</button>
                            <button class="btn btn-get-started" onclick="APP.showRegister()">Get Started</button>
                        `}
                    </div>
                    
                    <button class="mobile-toggle" onclick="APP.toggleMobileMenu()">
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>
        `;
    },
    
    renderFooter() {
        const footer = document.getElementById('appFooter');
        if (!footer) return;
        
        footer.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-brand">
                        <div class="logo-icon">B</div>
                        <h3>Bossjob Ethiopia</h3>
                        <p>Ethiopia's leading job platform.</p>
                        <div class="social-links">
                            <a>📘</a><a>💼</a><a>📸</a><a>🐦</a>
                        </div>
                    </div>
                    <div class="footer-col">
                        <h4>For Employers</h4>
                        <a href="/company-register.html">Join Bossjob</a>
                        <a href="/post-job.html">Post a Job</a>
                        <a href="/payment.html">Pricing</a>
                    </div>
                    <div class="footer-col">
                        <h4>For Job Seekers</h4>
                        <a href="/jobs.html">Browse Jobs</a>
                        <a href="/resume.html">Create Resume</a>
                        <a href="/profile.html">Profile</a>
                    </div>
                    <div class="footer-col">
                        <h4>Contact</h4>
                        <p>📍 Bole Road, Addis Ababa</p>
                        <p>📞 +251 911 234 567</p>
                        <p>✉️ support@bossjob.et</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2026 Bossjob Ethiopia. All rights reserved.</p>
                </div>
            </div>
        `;
    },
    
    getCurrentPage() {
        const path = window.location.pathname;
        const map = {
            '/': 'home',
            '/index.html': 'home',
            '/jobs.html': 'jobs',
            '/companies.html': 'companies',
            '/hr-dashboard.html': 'hr',
            '/dashboard.html': 'dashboard',
            '/chat.html': 'chat',
            '/resume.html': 'resume',
            '/profile.html': 'profile',
            '/analytics.html': 'analytics',
            '/boss-ai.html': 'ai',
            '/admin.html': 'admin',
            '/remote-jobs.html': 'remote',
            '/about.html': 'about',
        };
        return map[path] || 'home';
    },
    
    getInitials() {
        if (this.user && this.user.full_name) {
            return this.user.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        }
        return 'U';
    },
    
    setActiveNav() {
        const currentPage = this.getCurrentPage();
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.remove('active');
            if (href === '/' && currentPage === 'home') link.classList.add('active');
            if (href === '/jobs.html' && currentPage === 'jobs') link.classList.add('active');
            if (href === '/companies.html' && currentPage === 'companies') link.classList.add('active');
            if (href === '/hr-dashboard.html' && currentPage === 'hr') link.classList.add('active');
            if (href === '/analytics.html' && currentPage === 'analytics') link.classList.add('active');
            if (href === '/boss-ai.html' && currentPage === 'ai') link.classList.add('active');
            if (href === '/admin.html' && currentPage === 'admin') link.classList.add('active');
            if (href === '/remote-jobs.html' && currentPage === 'remote') link.classList.add('active');
        });
    },
    
    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('bossjob_language', lang);
        location.reload();
    },
    
    applyLanguage() {
        // Apply language from i18n if available
        if (window.I18N) {
            I18N.translatePage(this.language);
        }
    },
    
    showLogin() {
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'flex';
        else window.location.href = '/login.html';
    },
    
    showRegister() {
        const modal = document.getElementById('registerModal');
        if (modal) modal.style.display = 'flex';
        else window.location.href = '/register.html';
    },
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        window.location.href = '/';
    },
    
    toggleMobileMenu() {
        const menu = document.querySelector('.nav-menu');
        if (menu) menu.classList.toggle('open');
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    APP.init();
});

// Expose to global
window.APP = APP;
