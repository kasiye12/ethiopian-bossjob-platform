// Language Switcher Component
function createLanguageSwitcher() {
    const containers = document.querySelectorAll('.language-selector, .lang-selector');
    
    containers.forEach(container => {
        // Remove existing content
        container.innerHTML = '';
        
        const currentLang = localStorage.getItem('bossjob_language') || 'en';
        
        const select = document.createElement('select');
        select.className = 'lang-select';
        select.style.cssText = 'padding:8px 12px;border:1px solid #e0e0e0;border-radius:6px;font-family:inherit;font-size:13px;cursor:pointer;background:white;';
        
        const languages = [
            { code: 'en', label: '🇬🇧 EN', name: 'English' },
            { code: 'am', label: '🇪🇹 አማ', name: 'Amharic' },
            { code: 'om', label: '🇪🇹 Oro', name: 'Afaan Oromoo' },
        ];
        
        select.innerHTML = languages.map(lang => 
            `<option value="${lang.code}" ${lang.code === currentLang ? 'selected' : ''}>${lang.label}</option>`
        ).join('');
        
        select.addEventListener('change', (e) => {
            const lang = e.target.value;
            localStorage.setItem('bossjob_language', lang);
            
            if (window.I18N) {
                window.I18N.setLanguage(lang);
            } else {
                location.reload();
            }
        });
        
        container.appendChild(select);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', createLanguageSwitcher);
