// Complete Internationalization System
const I18N = {
    currentLang: localStorage.getItem('bossjob_language') || 'en',
    
    translations: {
        en: {
            // Navigation
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
            
            // Hero
            hero_title: 'Find Your Dream Job in Ethiopia',
            hero_subtitle: 'Connect with 10,000+ employers across Ethiopia',
            hero_search: 'Job title, keyword, or company...',
            hero_search_btn: 'Search Jobs',
            
            // Common
            loading: 'Loading...',
            no_data: 'No data available',
            save: 'Save',
            cancel: 'Cancel',
            edit: 'Edit',
            delete: 'Delete',
            apply_now: 'Apply Now',
            view_details: 'View Details',
            search: 'Search',
            filters: 'Filters',
            all: 'All',
            
            // Jobs
            jobs_title: 'Find Jobs',
            job_type: 'Job Type',
            job_location: 'Location',
            job_salary: 'Salary',
            job_experience: 'Experience',
            job_education: 'Education',
            full_time: 'Full-time',
            part_time: 'Part-time',
            remote: 'Remote',
            on_site: 'On-site',
            
            // Footer
            footer_employers: 'For Employers',
            footer_seekers: 'For Job Seekers',
            footer_contact: 'Contact',
            footer_rights: 'All rights reserved',
        },
        
        am: {
            // Navigation
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
            
            // Hero
            hero_title: 'በኢትዮጵያ ውስጥ የህልም ስራዎን ያግኙ',
            hero_subtitle: 'በመላው ኢትዮጵያ ከ10,000+ አሰሪዎች ጋር ይገናኙ',
            hero_search: 'የስራ ርዕስ፣ ቁልፍ ቃል...',
            hero_search_btn: 'ስራ ፈልግ',
            
            // Common
            loading: 'በመጫን ላይ...',
            no_data: 'ምንም መረጃ የለም',
            save: 'አስቀምጥ',
            cancel: 'ሰርዝ',
            edit: 'አርትዕ',
            delete: 'አጥፋ',
            apply_now: 'አሁን ያመልክቱ',
            view_details: 'ዝርዝሮችን ይመልከቱ',
            search: 'ፈልግ',
            filters: 'ማጣሪያዎች',
            all: 'ሁሉም',
            
            // Jobs
            jobs_title: 'ስራ ፈልግ',
            job_type: 'የስራ አይነት',
            job_location: 'አካባቢ',
            job_salary: 'ደመወዝ',
            job_experience: 'ልምድ',
            job_education: 'ትምህርት',
            full_time: 'የሙሉ ጊዜ',
            part_time: 'የትርፍ ጊዜ',
            remote: 'ርቀት',
            on_site: 'በቦታው',
            
            // Footer
            footer_employers: 'ለአሰሪዎች',
            footer_seekers: 'ለስራ ፈላጊዎች',
            footer_contact: 'ያግኙን',
            footer_rights: 'መብቱ በህግ የተጠበቀ ነው',
        },
        
        om: {
            // Navigation
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
            
            // Hero
            hero_title: 'Itoophiyaa Keessatti Hojii Abjuu Kee Argadhu',
            hero_subtitle: 'Qaxaroota 10,000+ wajjin wal qunnami',
            hero_search: 'Mata-duree hojii...',
            hero_search_btn: 'Hojii Barbaadi',
            
            // Common
            loading: 'Feega...',
            no_data: 'Odeeffannoo hin jiru',
            save: 'Olkaa\'i',
            cancel: 'Haqi',
            edit: 'Gulaali',
            delete: 'Balleessi',
            apply_now: 'Amma Iyyadhu',
            view_details: 'Bal\'inaa Ilaali',
            search: 'Barbaadi',
            filters: 'Calalii',
            all: 'Hundaa',
            
            // Jobs
            jobs_title: 'Hojii Barbaadi',
            job_type: 'Gosa Hojii',
            job_location: 'Bakka',
            job_salary: 'Miindaa',
            job_experience: 'Muuxannoo',
            job_education: 'Barnoota',
            full_time: 'Yeroo Guutuu',
            part_time: 'Yeroo Gabaabaa',
            remote: 'Fagoo',
            on_site: 'Bakka',
            
            // Footer
            footer_employers: 'Qaxarootaaf',
            footer_seekers: 'Barbaaddota Hojii',
            footer_contact: 'Nu Qunnamaa',
            footer_rights: 'Mirgi hunduu eegamaa dha',
        }
    },
    
    translate(key) {
        return this.translations[this.currentLang]?.[key] || this.translations.en[key] || key;
    },
    
    applyTranslations() {
        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.translate(key);
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else if (el.tagName === 'SELECT') {
                // Skip selects
            } else {
                el.textContent = translation;
            }
        });
        
        // Translate elements with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.translate(key);
        });
        
        // Set html lang attribute
        document.documentElement.lang = this.currentLang;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLang } 
        }));
    },
    
    setLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('bossjob_language', lang);
        
        // Update all language selectors
        document.querySelectorAll('.lang-select, select[id*="lang"]').forEach(select => {
            select.value = lang;
        });
        
        this.applyTranslations();
        
        // Show notification
        const langNames = { en: 'English', am: 'አማርኛ', om: 'Afaan Oromoo' };
        console.log('🌐 Language changed to:', langNames[lang]);
    },
    
    getCurrentLang() {
        return this.currentLang;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    I18N.applyTranslations();
});

// Global function
function changeLanguage(lang) {
    I18N.setLanguage(lang);
}

window.I18N = I18N;
