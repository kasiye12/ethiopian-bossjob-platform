// Mobile Navigation Component
class MobileNavigation {
    constructor() {
        this.createMobileNav();
        this.setActiveItem();
        this.loadBadges();
    }
    
    createMobileNav() {
        // Remove existing mobile nav
        const existingNav = document.querySelector('.mobile-nav');
        if (existingNav) existingNav.remove();
        
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        mobileNav.innerHTML = `
            <div class="mobile-nav-items">
                <a href="/" class="mobile-nav-item" id="mn-home">
                    <span class="nav-icon">🏠</span>
                    <span>Home</span>
                </a>
                <a href="/jobs.html" class="mobile-nav-item" id="mn-jobs">
                    <span class="nav-icon">💼</span>
                    <span>Jobs</span>
                </a>
                <a href="/companies.html" class="mobile-nav-item" id="mn-companies">
                    <span class="nav-icon">🏢</span>
                    <span>Companies</span>
                </a>
                <a href="/chat.html" class="mobile-nav-item" id="mn-chat">
                    <span class="nav-icon">💬</span>
                    <span>Chat</span>
                    <span class="badge" id="chatBadge" style="display:none;">0</span>
                </a>
                <a href="/profile.html" class="mobile-nav-item" id="mn-profile">
                    <span class="nav-icon">👤</span>
                    <span>Profile</span>
                </a>
            </div>
        `;
        
        document.body.appendChild(mobileNav);
    }
    
    setActiveItem() {
        const currentPath = window.location.pathname;
        
        const navMap = {
            '/': 'mn-home',
            '/index.html': 'mn-home',
            '/jobs.html': 'mn-jobs',
            '/companies.html': 'mn-companies',
            '/chat.html': 'mn-chat',
            '/profile.html': 'mn-profile',
            '/resume.html': 'mn-profile',
        };
        
        const activeId = navMap[currentPath];
        
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (activeId) {
            const activeItem = document.getElementById(activeId);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }
    
    async loadBadges() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            // Load unread notifications
            const notifRes = await fetch('/api/v1/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notifData = await notifRes.json();
            
            if (notifData.success && notifData.data && notifData.data.count > 0) {
                const chatBadge = document.getElementById('chatBadge');
                if (chatBadge) {
                    chatBadge.textContent = notifData.data.count;
                    chatBadge.style.display = 'inline';
                }
            }
            
            // Load unread messages
            const chatRes = await fetch('/api/v1/chats/threads', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const chatData = await chatRes.json();
            
            if (chatData.success && chatData.data) {
                const unreadCount = chatData.data.filter(t => t.unread_count > 0).length;
                const chatBadge = document.getElementById('chatBadge');
                
                if (chatBadge && unreadCount > 0) {
                    chatBadge.textContent = unreadCount;
                    chatBadge.style.display = 'inline';
                }
            }
        } catch (error) {
            console.error('Error loading badges:', error);
        }
    }
}

// Initialize mobile nav
document.addEventListener('DOMContentLoaded', () => {
    // Only show mobile nav on smaller screens
    if (window.innerWidth <= 768) {
        window.mobileNav = new MobileNavigation();
    }
});

// Re-check on resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && !window.mobileNav) {
        window.mobileNav = new MobileNavigation();
    } else if (window.innerWidth > 768 && window.mobileNav) {
        document.querySelector('.mobile-nav')?.remove();
        window.mobileNav = null;
    }
});
