// Company Position Management
const positions = [
    { name: 'Owner', icon: '👑', level: 10 },
    { name: 'Founder', icon: '🏗️', level: 10 },
    { name: 'CEO', icon: '💼', level: 9 },
    { name: 'HR Director', icon: '📊', level: 8 },
    { name: 'HR Manager', icon: '👥', level: 7 },
    { name: 'HR Officer', icon: '📋', level: 6 },
];

// Position permissions
const positionPermissions = {
    'Owner': ['all'],
    'Founder': ['all'],
    'CEO': ['all'],
    'HR Director': ['manage_jobs', 'manage_talents', 'manage_interviews', 'view_analytics', 'chat', 'view_company'],
    'HR Manager': ['manage_jobs', 'manage_talents', 'manage_interviews', 'chat', 'view_company'],
    'HR Officer': ['manage_jobs', 'chat', 'view_company'],
};

// Check if position has permission
function hasPermission(position, permission) {
    const permissions = positionPermissions[position] || [];
    return permissions.includes('all') || permissions.includes(permission);
}

// Update user position
async function updateCompanyPosition(position) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('/api/v1/companies/update-position', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ company_position: position })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Position updated successfully!');
            updatePositionDisplay(position);
            applyPositionPermissions(position);
        } else {
            showToast('Failed to update position');
        }
    } catch (error) {
        console.error('Error updating position:', error);
        showToast('Error updating position');
    }
}

// Update position display
function updatePositionDisplay(position) {
    const positionElement = document.querySelector('.user-status');
    if (positionElement) {
        positionElement.textContent = position;
    }
}

// Apply position permissions
function applyPositionPermissions(position) {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const section = item.getAttribute('data-section');
        const permissionMap = {
            'manage-jobs': 'manage_jobs',
            'chat': 'chat',
            'talent': 'manage_talents',
            'search-talent': 'manage_talents',
            'talents': 'manage_talents',
            'interviews': 'manage_interviews',
            'company': 'view_company',
            'analytics': 'view_analytics',
        };
        
        const requiredPermission = permissionMap[section];
        
        if (requiredPermission && !hasPermission(position, requiredPermission)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
}

// Show position selector modal
function showPositionSelector() {
    const modal = document.createElement('div');
    modal.className = 'position-modal';
    modal.id = 'positionModal';
    
    modal.innerHTML = `
        <div class="position-modal-content">
            <span class="close" onclick="closePositionModal()">&times;</span>
            <h2>Select Your Position</h2>
            <p>Choose your role within the company</p>
            <div class="position-list">
                ${positions.map(pos => `
                    <div class="position-option" onclick="selectPosition('${pos.name}')">
                        <div class="position-icon">${pos.icon}</div>
                        <div class="position-info">
                            <h4>${pos.name}</h4>
                            <p>Level ${pos.level}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closePositionModal() {
    const modal = document.getElementById('positionModal');
    if (modal) modal.remove();
}

function selectPosition(position) {
    updateCompanyPosition(position);
    closePositionModal();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #1a1a2e;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
