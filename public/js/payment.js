const API_BASE_URL = window.location.origin;
const authToken = localStorage.getItem('authToken');

let selectedPlan = null;
let selectedPaymentMethod = null;

const plans = {
    starter: { name: 'Starter', price: 500 },
    professional: { name: 'Professional', price: 1500 },
    enterprise: { name: 'Enterprise', price: 5000 }
};

const paymentMethods = {
    telebirr: 'Telebirr',
    chapa: 'Chapa',
    bank: 'Bank Transfer'
};

if (!authToken) {
    window.location.href = '/';
}

function selectPlan(planName) {
    selectedPlan = planName;
    
    // Update UI
    document.querySelectorAll('.plan-card').forEach(card => {
        card.style.borderColor = '#e0e0e0';
    });
    document.querySelector(`#select${planName.charAt(0).toUpperCase() + planName.slice(1)}`).parentElement.style.borderColor = '#4CAF50';
    
    // Show payment methods
    document.getElementById('paymentMethods').style.display = 'block';
    
    // Update summary
    updateSummary();
    
    // Scroll to payment methods
    document.getElementById('paymentMethods').scrollIntoView({ behavior: 'smooth' });
}

function selectPayment(method) {
    selectedPaymentMethod = method;
    
    // Update UI
    document.querySelectorAll('.payment-option').forEach(option => {
        option.style.borderColor = '#e0e0e0';
    });
    event.currentTarget.style.borderColor = '#4CAF50';
    
    // Show summary
    document.getElementById('paymentSummary').style.display = 'block';
    
    // Update summary
    updateSummary();
}

function updateSummary() {
    if (selectedPlan && selectedPaymentMethod) {
        document.getElementById('summaryPlan').textContent = plans[selectedPlan].name;
        document.getElementById('summaryAmount').textContent = `ETB ${plans[selectedPlan].price}`;
        document.getElementById('summaryMethod').textContent = paymentMethods[selectedPaymentMethod];
    }
}

async function processPayment() {
    if (!selectedPlan || !selectedPaymentMethod) {
        alert('Please select a plan and payment method');
        return;
    }
    
    const orderId = `ORDER-${Date.now()}`;
    const amount = plans[selectedPlan].price;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/payments/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                amount,
                payment_method: selectedPaymentMethod,
                order_id: orderId,
                plan: selectedPlan
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.data.paymentUrl) {
                window.location.href = data.data.paymentUrl;
            } else {
                alert('Payment initiated successfully!');
            }
        } else {
            alert(data.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed. Please try again.');
    }
}
