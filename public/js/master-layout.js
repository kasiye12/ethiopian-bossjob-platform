// Complete Master Layout with Language Switching
const MasterLayout = {
    token: localStorage.getItem('authToken'),
    role: localStorage.getItem('userRole') || 'guest',
    user: null,
    page: '',
    currentLang: localStorage.getItem('bossjob_language') || 'en',

    translations: {
        en: {
            nav_home: 'Home',
            nav_find_jobs: 'Find Jobs',
            nav_companies: 'Companies',
            nav_hr: 'HR Dashboard',
            nav_remote: 'Remote Jobs',
            nav_about: 'About',
            nav_chat: 'Chat',
            nav_resume: 'Resume',
            nav_login: 'Login',
            nav_get_started: 'Get Started',
            nav_logout: 'Logout',
            nav_dashboard: 'Dashboard',
            nav_admin: 'Admin',
            nav_users: 'Users',
            nav_employer: 'Employer',
            footer_employers: 'For Employers',
            footer_join: 'Join Bossjob',
            footer_post: 'Post a Job',
            footer_seekers: 'For Job Seekers',
            footer_browse: 'Browse Jobs',
            footer_resume: 'Resume',
            footer_contact: 'Contact',
            footer_rights: 'All rights reserved',
        },
        am: {
            nav_home: 'መነሻ',
            nav_find_jobs: 'ስራ ፈልግ',
            nav_companies: 'ኩባንያዎች',
            nav_hr: 'HR ዳሽቦርድ',
            nav_remote: 'የርቀት ስራዎች',
            nav_about: 'ስለ እኛ',
            nav_chat: 'ውይይት',
            nav_resume: 'ማህደር',
            nav_login: 'ግባ',
            nav_get_started: 'ጀምር',
            nav_logout: 'ውጣ',
            nav_dashboard: 'ዳሽቦርድ',
            nav_admin: 'አስተዳደር',
            nav_users: 'ተጠቃሚዎች',
            nav_employer: 'አሰሪ',
            footer_employers: 'ለአሰሪዎች',
            footer_join: 'Bossjobን ይቀላቀሉ',
            footer_post: 'ስራ ይለጥፉ',
            footer_seekers: 'ለስራ ፈላጊዎች',
            footer_browse: 'ስራዎችን ይመልከቱ',
            footer_resume: 'ማህደር',
            footer_contact: 'ያግኙን',
            footer_rights: 'መብቱ በህግ የተጠበቀ ነው',
        },
        om: {
            nav_home: 'Mana',
            nav_find_jobs: 'Hojii Barbaadi',
            nav_companies: 'Kompanyoota',
            nav_hr: 'HR Daashboordii',
            nav_remote: 'Hojii Fagoo',
            nav_about: 'Waa\'ee Keenya',
            nav_chat: 'Haasaa',
            nav_resume: 'Galmee',
            nav_login: 'Seeni',
            nav_get_started: 'Jalqabi',
            nav_logout: 'Ba\'i',
            nav_dashboard: 'Daashboordii',
            nav_admin: 'Bulchaa',
            nav_users: 'Fayyadamtoota',
            nav_employer: 'Qaxaraa',
            footer_employers: 'Qaxarootaaf',
            footer_join: 'Bossjobitti Makami',
            footer_post: 'Hojii Maxxansi',
            footer_seekers: 'Barbaaddota Hojii',
            footer_browse: 'Hojii Ilaali',
            footer_resume: 'Galmee',
            footer_contact: 'Nu Qunnamaa',
            footer_rights: 'Mirgi hunduu eegamaa dha',
        }
    },

    async init() {
        this.page = this.detectPage();
        this.injectStyles();
        
        if (this.token) {
            await this.loadUser();
        }
        
        this.renderNavbar();
        this.renderFooter();
        this.renderModals();
        this.applyLanguage();
        this.bindEvents();
    },

    detectPage() {
        const path = window.location.pathname;
        const map = {
            '/': 'home', '/index.html': 'home',
            '/jobs.html': 'jobs', '/companies.html': 'companies',
            '/remote-jobs.html': 'remote', '/about.html': 'about',
            '/hr-dashboard.html': 'hr', '/dashboard.html': 'dashboard',
            '/chat.html': 'chat', '/resume.html': 'resume',
            '/profile.html': 'profile', '/analytics.html': 'analytics',
            '/boss-ai.html': 'ai', '/admin.html': 'admin',
            '/users.html': 'users', '/employer-dashboard.html': 'employer',
            '/ai-service.html': 'ai-service', '/job-details.html': 'job-details',
        };
        return map[path] || 'home';
    },

    injectStyles() {
        if (document.getElementById('bossjob-styles')) return;
        const styles = document.createElement('style');
        styles.id = 'bossjob-styles';
        styles.textContent = `
            :root {
                --primary: #4CAF50;
                --primary-dark: #388E3C;
                --dark: #1a1a2e;
                --text: #333;
                --text-light: #666;
                --border: #e0e0e0;
                --bg: #f5f6fa;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); }
            
            .bossjob-navbar {
                background: white;
                border-bottom: 1px solid var(--border);
                position: sticky;
                top: 0;
                z-index: 1000;
                box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            }
            .bossjob-navbar-inner {
                max-width: 1200px;
                margin: 0 auto;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
            }
            .bossjob-logo {
                display: flex;
                align-items: center;
                gap: 8px;
                text-decoration: none;
                cursor: pointer;
            }
            .bossjob-logo-icon {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #4CAF50, #388E3C);
                color: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 16px;
            }
            .bossjob-logo-text {
                font-size: 17px;
                font-weight: 800;
                color: var(--dark);
            }
            .bossjob-logo-country {
                font-size: 10px;
                color: var(--primary);
                font-weight: 600;
            }
            .bossjob-nav-menu {
                display: flex;
                gap: 18px;
                flex: 1;
                justify-content: center;
                flex-wrap: wrap;
            }
            .bossjob-nav-link {
                color: var(--text-light);
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
                padding: 5px 0;
                cursor: pointer;
                position: relative;
                transition: all 0.3s;
                white-space: nowrap;
            }
            .bossjob-nav-link:hover { color: var(--primary); }
            .bossjob-nav-link.active { color: var(--primary); font-weight: 700; }
            .bossjob-nav-link.active::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                right: 0;
                height: 2px;
                background: var(--primary);
                border-radius: 2px;
            }
            .bossjob-nav-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .bossjob-lang-select {
                padding: 8px 10px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-family: inherit;
                font-size: 13px;
                cursor: pointer;
                background: white;
                transition: all 0.3s;
            }
            .bossjob-lang-select:hover { border-color: var(--primary); }
            .bossjob-lang-select:focus { outline: none; border-color: var(--primary); }
            .bossjob-chat-link {
                font-size: 18px;
                color: var(--text-light);
                text-decoration: none;
                cursor: pointer;
            }
            .bossjob-chat-link:hover { color: var(--primary); }
            .bossjob-avatar {
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #4CAF50, #388E3C);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
            }
            .bossjob-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-family: inherit;
                font-size: 13px;
                transition: all 0.3s;
                white-space: nowrap;
            }
            .bossjob-btn-login {
                background: transparent;
                border: 1px solid var(--border);
                color: var(--text);
            }
            .bossjob-btn-login:hover { border-color: var(--primary); color: var(--primary); }
            .bossjob-btn-primary {
                background: var(--primary);
                color: white;
            }
            .bossjob-btn-primary:hover { background: var(--primary-dark); }
            
            .bossjob-footer {
                background: var(--dark);
                color: white;
                padding: 50px 0 20px;
                margin-top: 60px;
            }
            .bossjob-footer-grid {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1.5fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            .bossjob-footer-brand h3 { color: white; margin-bottom: 10px; }
            .bossjob-footer-brand p { color: #999; font-size: 13px; }
            .bossjob-footer-col h4 { color: white; font-size: 14px; margin-bottom: 12px; }
            .bossjob-footer-col a, .bossjob-footer-col p {
                display: block;
                color: #999;
                font-size: 13px;
                margin-bottom: 8px;
                text-decoration: none;
                cursor: pointer;
            }
            .bossjob-footer-col a:hover { color: var(--primary); }
            .bossjob-footer-bottom {
                max-width: 1200px;
                margin: 0 auto;
                padding: 15px 20px 0;
                border-top: 1px solid #333;
                text-align: center;
                font-size: 12px;
                color: #666;
            }
            
            .bossjob-modal {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.6);
                z-index: 9999;
                align-items: center;
                justify-content: center;
            }
            .bossjob-modal.show { display: flex; }
            .bossjob-modal-box {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 400px;
                padding: 25px;
                animation: bossjobModalIn 0.3s;
            }
            @keyframes bossjobModalIn {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .bossjob-modal-box h2 { text-align: center; margin-bottom: 5px; font-size: 20px; }
            .bossjob-modal-sub { text-align: center; color: #999; font-size: 13px; margin-bottom: 20px; }
            .bossjob-form-group { margin-bottom: 12px; }
            .bossjob-form-group label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 4px;
                color: #555;
            }
            .bossjob-form-control {
                width: 100%;
                padding: 10px 14px;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
            }
            .bossjob-form-control:focus {
                outline: none;
                border-color: var(--primary);
            }
            .bossjob-btn-block {
                width: 100%;
                padding: 12px;
                font-size: 15px;
                font-weight: 700;
            }
            .bossjob-demo-hint {
                text-align: center;
                margin-top: 12px;
                font-size: 12px;
                color: #999;
                background: #f8f9fa;
                padding: 8px;
                border-radius: 6px;
            }
            
            @media (max-width: 768px) {
                .bossjob-nav-menu { display: none; }
                .bossjob-footer-grid { grid-template-columns: 1fr; }
                .bossjob-navbar-inner { flex-wrap: wrap; }
            }
        `;
        document.head.appendChild(styles);
    },

    translate(key) {
        return this.translations[this.currentLang]?.[key] || this.translations.en[key] || key;
    },

    applyLanguage() {
        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.translate(key);
        });
        
        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.translate(key);
        });
        
        // Set html lang
        document.documentElement.lang = this.currentLang;
    },

    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('bossjob_language', lang);
        
        // Update selectors
        document.querySelectorAll('.bossjob-lang-select').forEach(select => {
            select.value = lang;
        });
        
        this.renderNavbar();
        this.applyLanguage();
        
        const langNames = { en: 'English', am: 'አማርኛ', om: 'Afaan Oromoo' };
        console.log('🌐 Language changed to:', langNames[lang] || lang);
    },

    async loadUser() {
        try {
            const res = await fetch('/api/v1/auth/me', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await res.json();
            if (data.success) {
                this.user = data.data;
                this.role = data.data.role;
            }
        } catch (e) {}
    },

    getNavItems() {
        const t = (key) => this.translate(key);
        
        const common = [
            { href: '/', label: t('nav_home'), page: 'home' },
            { href: '/jobs.html', label: t('nav_find_jobs'), page: 'jobs' },
            { href: '/companies.html', label: t('nav_companies'), page: 'companies' },
        ];
        
        switch (this.role) {
            case 'admin':
                return [...common,
                    { href: '/admin.html', label: t('nav_admin'), page: 'admin' },
                    { href: '/users.html', label: t('nav_users'), page: 'users' },
                    { href: '/hr-dashboard.html', label: t('nav_hr'), page: 'hr' },
                ];
            case 'boss':
                return [...common,
                    { href: '/hr-dashboard.html', label: t('nav_hr'), page: 'hr' },
                    { href: '/employer-dashboard.html', label: t('nav_employer'), page: 'employer' },
                    { href: '/analytics.html', label: 'Analytics', page: 'analytics' },
                ];
            case 'candidate':
                return [...common,
                    { href: '/dashboard.html', label: t('nav_dashboard'), page: 'dashboard' },
                    { href: '/remote-jobs.html', label: t('nav_remote'), page: 'remote' },
                ];
            default:
                return [...common,
                    { href: '/remote-jobs.html', label: t('nav_remote'), page: 'remote' },
                    { href: '/about.html', label: t('nav_about'), page: 'about' },
                ];
        }
    },

    renderLanguageSelector() {
        const langs = [
            { code: 'en', label: '🇬🇧 EN' },
            { code: 'am', label: '🇪🇹 አማ' },
            { code: 'om', label: '🇪🇹 Oro' },
        ];
        
        return `
            <select class="bossjob-lang-select" onchange="MasterLayout.setLanguage(this.value)" aria-label="Select language">
                ${langs.map(lang => 
                    `<option value="${lang.code}" ${this.currentLang === lang.code ? 'selected' : ''}>${lang.label}</option>`
                ).join('')}
            </select>
        `;
    },

    renderNavbar() {
        const el = document.getElementById('appNavbar');
        if (!el) return;

        const navItems = this.getNavItems();
        const initials = this.user ? this.user.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'U';
        const t = (key) => this.translate(key);

        el.className = 'bossjob-navbar';
        el.innerHTML = `
            <div class="bossjob-navbar-inner">
                <a href="/" class="bossjob-logo">
                    <span class="bossjob-logo-icon">B</span>
                    <span class="bossjob-logo-text">Bossjob <span class="bossjob-logo-country">Ethiopia</span></span>
                </a>
                <nav class="bossjob-nav-menu">
                    ${navItems.map(item => `
                        <a href="${item.href}" class="bossjob-nav-link ${this.page === item.page ? 'active' : ''}">${item.label}</a>
                    `).join('')}
                </nav>
                <div class="bossjob-nav-actions">
                    ${this.token ? `
                        <a href="/chat.html" class="bossjob-chat-link" title="${t('nav_chat')}">💬</a>
                        ${this.renderLanguageSelector()}
                        <div class="bossjob-avatar" onclick="location.href='/profile.html'">${initials}</div>
                        <button class="bossjob-btn bossjob-btn-login" onclick="MasterLayout.logout()">${t('nav_logout')}</button>
                    ` : `
                        ${this.renderLanguageSelector()}
                        <button class="bossjob-btn bossjob-btn-login" onclick="MasterLayout.showLogin()">${t('nav_login')}</button>
                        <button class="bossjob-btn bossjob-btn-primary" onclick="MasterLayout.showRegister()">${t('nav_get_started')}</button>
                    `}
                </div>
            </div>
        `;
    },

    renderFooter() {
        const el = document.getElementById('appFooter');
        if (!el) return;
        
        const t = (key) => this.translate(key);
        
        el.className = 'bossjob-footer';
        el.innerHTML = `
            <div class="bossjob-footer-grid">
                <div class="bossjob-footer-brand">
                    <h3>Bossjob Ethiopia</h3>
                    <p>Ethiopia's leading job platform.</p>
                </div>
                <div class="bossjob-footer-col">
                    <h4>${t('footer_employers')}</h4>
                    <a href="/company-register.html">${t('footer_join')}</a>
                    <a href="/post-job.html">${t('footer_post')}</a>
                </div>
                <div class="bossjob-footer-col">
                    <h4>${t('footer_seekers')}</h4>
                    <a href="/jobs.html">${t('footer_browse')}</a>
                    <a href="/resume.html">${t('footer_resume')}</a>
                </div>
                <div class="bossjob-footer-col">
                    <h4>${t('footer_contact')}</h4>
                    <p>📍 Bole Road, Addis Ababa</p>
                    <p>📞 +251 911 234 567</p>
                    <p>✉️ support@bossjob.et</p>
                </div>
            </div>
            <div class="bossjob-footer-bottom">
                <p>&copy; 2026 Bossjob Ethiopia. ${t('footer_rights')}</p>
            </div>
        `;
    },

    renderModals() {
        if (document.getElementById('loginModal')) return;
        
        const modals = document.createElement('div');
        modals.innerHTML = `
            <div class="bossjob-modal" id="loginModal">
                <div class="bossjob-modal-box">
                    <h2>Welcome Back!</h2>
                    <p class="bossjob-modal-sub">Login to your Bossjob account</p>
                    <form onsubmit="MasterLayout.handleLogin(event)">
                        <div class="bossjob-form-group">
                            <label>Phone Number</label>
                            <input type="tel" id="loginPhone" class="bossjob-form-control" placeholder="+251..." required>
                        </div>
                        <div class="bossjob-form-group">
                            <label>Password</label>
                            <input type="password" id="loginPassword" class="bossjob-form-control" required>
                        </div>
                        <button type="submit" class="bossjob-btn bossjob-btn-primary bossjob-btn-block">Login</button>
                    </form>
                    <div class="bossjob-demo-hint">Demo: +251900000000 / Admin@123</div>
                </div>
            </div>
            <div class="bossjob-modal" id="registerModal">
                <div class="bossjob-modal-box">
                    <h2>Create Account</h2>
                    <p class="bossjob-modal-sub">Join Bossjob Ethiopia</p>
                    <form onsubmit="MasterLayout.handleRegister(event)">
                        <div class="bossjob-form-group">
                            <label>Full Name</label>
                            <input type="text" id="regName" class="bossjob-form-control" required>
                        </div>
                        <div class="bossjob-form-group">
                            <label>Phone</label>
                            <input type="tel" id="regPhone" class="bossjob-form-control" required>
                        </div>
                        <div class="bossjob-form-group">
                            <label>Password</label>
                            <input type="password" id="regPassword" class="bossjob-form-control" required>
                        </div>
                        <div class="bossjob-form-group">
                            <label>Role</label>
                            <select id="regRole" class="bossjob-form-control">
                                <option value="candidate">Job Seeker</option>
                                <option value="boss">Employer</option>
                            </select>
                        </div>
                        <button type="submit" class="bossjob-btn bossjob-btn-primary bossjob-btn-block">Register</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modals);
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('bossjob-modal')) {
                e.target.classList.remove('show');
            }
        });
    },

    showLogin() {
        document.getElementById('registerModal').classList.remove('show');
        document.getElementById('loginModal').classList.add('show');
    },

    showRegister() {
        document.getElementById('loginModal').classList.remove('show');
        document.getElementById('registerModal').classList.add('show');
    },

    async handleLogin(e) {
        e.preventDefault();
        const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: document.getElementById('loginPhone').value,
                password: document.getElementById('loginPassword').value
            })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('authToken', data.data.accessToken);
            localStorage.setItem('userRole', data.data.user.role);
            location.reload();
        } else {
            alert(data.message || 'Login failed');
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const res = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone_number: document.getElementById('regPhone').value,
                password: document.getElementById('regPassword').value,
                full_name: document.getElementById('regName').value,
                role: document.getElementById('regRole').value
            })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('authToken', data.data.accessToken);
            localStorage.setItem('userRole', data.data.user.role);
            location.reload();
        } else {
            alert(data.message || 'Registration failed');
        }
    },

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        location.href = '/';
    }
};

// Global language change function
function changeLanguage(lang) {
    MasterLayout.setLanguage(lang);
}

document.addEventListener('DOMContentLoaded', () => MasterLayout.init());
window.MasterLayout = MasterLayout;
