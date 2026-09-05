// Complete Jobs Filter System
class JobsFilter {
    constructor() {
        this.allJobs = [];
        this.filteredJobs = [];
        this.currentFilters = {
            search: '',
            category: '',
            region: '',
            job_type: '',
            experience: '',
            education: '',
            salary_range: '',
        };
        this.currentPage = 1;
        this.jobsPerPage = 10;
        
        this.init();
    }
    
    async init() {
        await this.loadJobs();
        this.setupEventListeners();
        this.renderJobs();
    }
    
    async loadJobs() {
        try {
            const response = await fetch('/api/v1/jobs?limit=100');
            const data = await response.json();
            
            if (data.success) {
                this.allJobs = data.data || [];
            } else {
                this.allJobs = this.getSampleJobs();
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
            this.allJobs = this.getSampleJobs();
        }
    }
    
    getSampleJobs() {
        return [
            { id: 1, title: 'Data Encoder', company_name: 'Ethio Tech Solutions PLC', salary_min_etb: 15000, salary_max_etb: 20000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa', category: 'IT' },
            { id: 2, title: 'Senior Go Backend Engineer', company_name: 'Ethio Tech Solutions PLC', salary_min_etb: 20000, salary_max_etb: 35000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa', category: 'IT' },
            { id: 3, title: 'Java Developer', company_name: 'Habesha Innovations', salary_min_etb: 25000, salary_max_etb: 30000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa', category: 'IT' },
            { id: 4, title: 'Backend Developer', company_name: 'Addis Digital Group', salary_min_etb: null, salary_max_etb: null, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa', category: 'IT' },
            { id: 5, title: 'C++ Developer', company_name: 'Ethio Tech Solutions PLC', salary_min_etb: 3000, salary_max_etb: 5000, job_type: 'Remote', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa', category: 'IT' },
            { id: 6, title: 'AI Application Engineer', company_name: 'Addis Digital Group', salary_min_etb: 3000, salary_max_etb: 6000, job_type: 'Remote', experience_level: '5-10 Yrs Exp', education_level_required: 'Edu not required', region: 'Addis Ababa', category: 'IT' },
            { id: 7, title: 'SEO Technical Engineer', company_name: 'Habesha Innovations', salary_min_etb: 2500, salary_max_etb: 5000, job_type: 'Remote', experience_level: '5-10 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa', category: 'IT' },
            { id: 8, title: 'Senior Accountant', company_name: 'Ethiopian Finance Corp', salary_min_etb: 20000, salary_max_etb: 30000, job_type: 'On-site', experience_level: '3-5 Yrs Exp', education_level_required: 'Bachelor', region: 'Addis Ababa', category: 'Finance' },
            { id: 9, title: 'Sales Representative', company_name: 'Green Valley Trading', salary_min_etb: 10000, salary_max_etb: 15000, job_type: 'On-site', experience_level: '1-3 Yrs Exp', education_level_required: 'Diploma', region: 'Addis Ababa', category: 'Sales' },
            { id: 10, title: 'Customer Service Officer', company_name: 'Blue Nile Services', salary_min_etb: 8000, salary_max_etb: 12000, job_type: 'On-site', experience_level: '1-3 Yrs Exp', education_level_required: 'Diploma', region: 'Addis Ababa', category: 'Customer Service' },
        ];
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }
        
        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            });
        }
        
        // Region filter
        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
            regionFilter.addEventListener('change', (e) => {
                this.currentFilters.region = e.target.value;
                this.applyFilters();
            });
        }
        
        // Job type filter
        const typeFilter = document.getElementById('jobTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilters.job_type = e.target.value;
                this.applyFilters();
            });
        }
        
        // Experience filter
        const expFilter = document.getElementById('experienceFilter');
        if (expFilter) {
            expFilter.addEventListener('change', (e) => {
                this.currentFilters.experience = e.target.value;
                this.applyFilters();
            });
        }
        
        // Education filter
        const eduFilter = document.getElementById('educationFilter');
        if (eduFilter) {
            eduFilter.addEventListener('change', (e) => {
                this.currentFilters.education = e.target.value;
                this.applyFilters();
            });
        }
        
        // Salary filter
        const salaryFilter = document.getElementById('salaryFilter');
        if (salaryFilter) {
            salaryFilter.addEventListener('change', (e) => {
                this.currentFilters.salary_range = e.target.value;
                this.applyFilters();
            });
        }
    }
    
    applyFilters() {
        const { search, category, region, job_type, experience, education, salary_range } = this.currentFilters;
        
        this.filteredJobs = this.allJobs.filter(job => {
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                const titleMatch = (job.title || '').toLowerCase().includes(searchLower);
                const companyMatch = (job.company_name || '').toLowerCase().includes(searchLower);
                if (!titleMatch && !companyMatch) return false;
            }
            
            // Category filter
            if (category && job.category !== category) return false;
            
            // Region filter
            if (region && job.region !== region) return false;
            
            // Job type filter
            if (job_type && job.job_type !== job_type) return false;
            
            // Experience filter
            if (experience) {
                const exp = job.experience_level || '';
                if (!exp.includes(experience.replace('+', ''))) return false;
            }
            
            // Education filter
            if (education && job.education_level_required !== education) return false;
            
            // Salary filter
            if (salary_range) {
                const minSalary = job.salary_min_etb || 0;
                if (salary_range === 'under10k' && minSalary >= 10000) return false;
                if (salary_range === '10-20k' && (minSalary < 10000 || minSalary >= 20000)) return false;
                if (salary_range === '20-30k' && (minSalary < 20000 || minSalary >= 30000)) return false;
                if (salary_range === '30k+' && minSalary < 30000) return false;
            }
            
            return true;
        });
        
        this.currentPage = 1;
        this.renderJobs();
    }
    
    renderJobs() {
        const jobsContainer = document.getElementById('jobsList');
        const paginationContainer = document.getElementById('pagination');
        
        if (!jobsContainer) return;
        
        const totalJobs = this.filteredJobs.length;
        const totalPages = Math.ceil(totalJobs / this.jobsPerPage);
        
        const startIndex = (this.currentPage - 1) * this.jobsPerPage;
        const endIndex = startIndex + this.jobsPerPage;
        const pageJobs = this.filteredJobs.slice(startIndex, endIndex);
        
        if (pageJobs.length === 0) {
            jobsContainer.innerHTML = `
                <div style="text-align: center; padding: 60px; grid-column: 1/-1;">
                    <p style="font-size: 48px; margin-bottom: 20px;">🔍</p>
                    <h3>No jobs found</h3>
                    <p style="color: #999;">Try adjusting your filters</p>
                    <button onclick="resetFilters()" style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer;">Reset Filters</button>
                </div>
            `;
            
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        
        jobsContainer.innerHTML = pageJobs.map(job => `
            <div class="job-card" onclick="viewJob('${job.id}')">
                <div class="job-card-header">
                    <div>
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company_name}</p>
                    </div>
                    <div class="job-salary">
                        ${job.salary_min_etb ? `ETB ${Number(job.salary_min_etb).toLocaleString()}${job.salary_max_etb ? `-${Number(job.salary_max_etb).toLocaleString()}` : ''}` : 'Negotiable'}
                    </div>
                </div>
                <div class="job-tags">
                    <span class="job-tag remote">${job.job_type === 'Remote' ? '🌐' : '📍'} ${job.job_type}</span>
                    <span class="job-tag">${job.experience_level || 'Any'}</span>
                    <span class="job-tag">${job.education_level_required || 'Any'}</span>
                    <span class="job-tag">${job.region}</span>
                </div>
            </div>
        `).join('');
        
        // Render pagination
        if (paginationContainer) {
            let paginationHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
            }
            paginationContainer.innerHTML = paginationHTML;
        }
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.renderJobs();
    }
    
    resetFilters() {
        this.currentFilters = {
            search: '', category: '', region: '', job_type: '',
            experience: '', education: '', salary_range: '',
        };
        
        // Reset form fields
        ['searchInput', 'categoryFilter', 'regionFilter', 'jobTypeFilter', 'experienceFilter', 'educationFilter', 'salaryFilter'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        this.applyFilters();
    }
}

// Initialize
let jobsFilter;
document.addEventListener('DOMContentLoaded', () => {
    jobsFilter = new JobsFilter();
});

function viewJob(id) {
    alert(`Viewing job #${id}`);
}

function goToPage(page) {
    jobsFilter.goToPage(page);
}

function resetFilters() {
    jobsFilter.resetFilters();
}

function toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
}
