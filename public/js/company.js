const API_BASE_URL = 'http://localhost:3001';

// Handle file upload click
document.getElementById('licenseUpload').addEventListener('click', function() {
    document.getElementById('licenseFile').click();
});

// Show selected file name
document.getElementById('licenseFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name;
    if (fileName) {
        document.getElementById('licenseUpload').innerHTML = `
            <p>📄 ${fileName}</p>
            <p>File selected</p>
            <input type="file" id="licenseFile" style="display: none;">
        `;
    }
});

// Handle company registration
document.getElementById('companyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please login first');
        window.location.href = '/';
        return;
    }
    
    const formData = new FormData();
    formData.append('company_name', document.getElementById('companyName').value);
    formData.append('industry', document.getElementById('industry').value);
    formData.append('company_size', document.getElementById('companySize').value);
    formData.append('website', document.getElementById('website').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('tin_number', document.getElementById('tinNumber').value);
    formData.append('business_license_number', document.getElementById('licenseNumber').value);
    formData.append('license_file', document.getElementById('licenseFile').files[0]);
    formData.append('region', document.getElementById('region').value);
    formData.append('sub_city', document.getElementById('subCity').value);
    formData.append('woreda', document.getElementById('woreda').value);
    formData.append('house_number', document.getElementById('houseNumber').value);
    formData.append('phone_number', document.getElementById('phoneNumber').value);
    formData.append('email', document.getElementById('email').value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/companies/register`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Company registered successfully!');
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Registration failed. Please try again.');
    }
});
