// Talent Search Filter System
class TalentFilter {
    constructor() {
        this.allTalents = [];
        this.filteredTalents = [];
        this.filters = {
            search: '',
            city: '',
            experience: '',
            qualification: '',
            salary_min: '',
            availability: '',
            skills: '',
        };
        
        this.init();
    }
    
    async init() {
        await this.loadTalents();
        this.setupListeners();
        this.render();
    }
    
    async loadTalents() {
        // Try to load from API
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.allTalents = this.getSampleTalents();
                return;
            }
            
            const response = await fetch('/api/v1/talents/search?limit=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.allTalents = data.data || this.getSampleTalents();
            } else {
                this.allTalents = this.getSampleTalents();
            }
        } catch (error) {
            this.allTalents = this.getSampleTalents();
        }
    }
    
    getSampleTalents() {
        return [
            { id: 1, full_name: 'Kasiye Taye', profession_title: 'Data Encoder', years_of_experience: 3, education_level: 'Bachelor', current_location: 'Addis Ababa, Bole', skills: ['Data Entry', 'Excel'], expected_salary_min: 15000 },
            { id: 2, full_name: 'Hana Tesfaye', profession_title: 'Software Developer', years_of_experience: 5, education_level: 'Bachelor', current_location: 'Addis Ababa, Kazanchis', skills: ['JavaScript', 'Node.js'], expected_salary_min: 30000 },
            { id: 3, full_name: 'Samuel Worku', profession_title: 'Accountant', years_of_experience: 4, education_level: 'Bachelor', current_location: 'Addis Ababa, Piassa', skills: ['Accounting', 'Excel'], expected_salary_min: 20000 },
            { id: 4, full_name: 'Liya Kebede', profession_title: 'Marketing Specialist', years_of_experience: 3, education_level: 'Master', current_location: 'Addis Ababa, Bole', skills: ['Marketing', 'SEO'], expected_salary_min: 25000 },
            { id: 5, full_name: 'Dawit Mengistu', profession_title: 'Project Manager', years_of_experience: 7, education_level: 'Master', current_location: 'Addis Ababa, CMC', skills: ['Agile', 'Scrum'], expected_salary_min: 40000 },
        ];
    }
    
    setupListeners() {
        // Search input
        const searchInput = document.getElementById('talentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }
        
        // City filter
        const cityFilter = document.getElementById('cityFilter');
        if (cityFilter) {
            cityFilter.addEventListener('change', (e) => {
                this.filters.city = e.target.value;
                this.applyFilters();
            });
        }
        
        // Experience filter
        const expFilter = document.getElementById('expFilter');
        if (expFilter) {
            expFilter.addEventListener('change', (e) => {
                this.filters.experience = e.target.value;
                this.applyFilters();
            });
        }
        
        // Qualification filter
        const qualFilter = document.getElementById('qualFilter');
        if (qualFilter) {
            qualFilter.addEventListener('change', (e) => {
                this.filters.qualification = e.target.value;
                this.applyFilters();
            });
        }
        
        // Salary filter
        const salaryFilter = document.getElementById('salaryFilterInput');
        if (salaryFilter) {
            salaryFilter.addEventListener('change', (e) => {
                this.filters.salary_min = e.target.value;
                this.applyFilters();
            });
        }
    }
    
    applyFilters() {
        const { search, city, experience, qualification, salary_min } = this.filters;
        
        this.filteredTalents = this.allTalents.filter(talent => {
            // Search by name or title
            if (search) {
                const s = search.toLowerCase();
                const nameMatch = (talent.full_name || '').toLowerCase().includes(s);
                const titleMatch = (talent.profession_title || '').toLowerCase().includes(s);
                if (!nameMatch && !titleMatch) return false;
            }
            
            // City filter
            if (city && !(talent.current_location || '').includes(city)) return false;
            
            // Experience filter
            if (experience) {
                const years = talent.years_of_experience || 0;
                if (experience === 'fresh' && years > 0) return false;
                if (experience === '1-3' && (years < 1 || years > 3)) return false;
                if (experience === '3-5' && (years < 3 || years > 5)) return false;
                if (experience === '5+' && years < 5) return false;
            }
            
            // Qualification filter
            if (qualification && talent.education_level !== qualification) return false;
            
            // Salary filter
            if (salary_min) {
                const expected = talent.expected_salary_min || 0;
                if (expected > parseInt(salary_min)) return false;
            }
            
            return true;
        });
        
        this.render();
    }
    
    render() {
        const container = document.getElementById('talentResults');
        if (!container) return;
        
        if (this.filteredTalents.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No talents match your filters</p>';
            return;
        }
        
        container.innerHTML = this.filteredTalents.map(talent => `
            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="margin-bottom: 5px;">${talent.full_name}</h3>
                        <p style="color: #666;">${talent.profession_title || 'Professional'}</p>
                    </div>
                    <span style="color: #4CAF50; font-weight: 700;">ETB ${(talent.expected_salary_min || 0).toLocaleString()}</span>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <span style="padding: 4px 12px; background: #f5f5f5; border-radius: 50px; font-size: 12px;">📍 ${talent.current_location || 'Ethiopia'}</span>
                    <span style="padding: 4px 12px; background: #f5f5f5; border-radius: 50px; font-size: 12px;">💼 ${talent.years_of_experience || 0} years</span>
                    <span style="padding: 4px 12px; background: #f5f5f5; border-radius: 50px; font-size: 12px;">🎓 ${talent.education_level || 'Any'}</span>
                </div>
                ${talent.skills && talent.skills.length > 0 ? `
                    <div style="margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap;">
                        ${talent.skills.map(skill => `<span style="padding: 3px 10px; background: #E3F2FD; color: #2196F3; border-radius: 50px; font-size: 11px;">${skill}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.talentFilter = new TalentFilter();
});
