// Page Loader - Loads common components
class PageLoader {
    static async loadCommonComponents() {
        // Load CSS
        const cssFiles = [
            '/css/jobs.css',
            '/css/language-switcher.css',
            '/css/responsive.css',
        ];
        
        cssFiles.forEach(css => {
            if (!document.querySelector(`link[href="${css}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = css;
                document.head.appendChild(link);
            }
        });
        
        // Load JS
        const jsFiles = [
            '/js/translations.js',
            '/js/language-switcher.js',
            '/js/mobile-nav.js',
            '/socket.io/socket.io.js',
            '/js/realtime.js',
        ];
        
        for (const js of jsFiles) {
            await this.loadScript(js);
        }
    }
    
    static loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    
    static showLoading() {
        const loader = document.createElement('div');
        loader.id = 'pageLoader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        loader.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border: 4px solid #e0e0e0; border-top-color: #4CAF50; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="color: #666; font-weight: 600;">Loading...</p>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
            </style>
        `;
        document.body.appendChild(loader);
    }
    
    static hideLoading() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.3s';
            setTimeout(() => loader.remove(), 300);
        }
    }
}

// Auto-load common components
document.addEventListener('DOMContentLoaded', async () => {
    await PageLoader.loadCommonComponents();
});
