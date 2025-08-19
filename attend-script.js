// Stripe configuration
const TICKET_PRICE = 20; // $20 per ticket

let stripe = null;
let cardElement = null;
let currentQuantity = 1;
let isProcessing = false;
let STRIPE_PUBLIC_KEY = null;

// Initialize Stripe after fetching the publishable key
document.addEventListener('DOMContentLoaded', async function () {
    await fetchStripeConfig();
    initializeStripe();
    setupQuantityControls();
    setupFormSubmission();
    updateTotals();
});

// Fetch Stripe configuration from server
async function fetchStripeConfig() {
    // Use key injected by server
    STRIPE_PUBLIC_KEY = window.STRIPE_PUBLISHABLE_KEY || null;
    
    if (!STRIPE_PUBLIC_KEY) {
        console.error('No Stripe publishable key found');
    } else {
        console.log('Stripe key loaded successfully');
    }
}

function initializeStripe() {
    console.log('Initializing Stripe with key:', STRIPE_PUBLIC_KEY ? 'Key loaded' : 'No key found');
    console.log('Key starts with:', STRIPE_PUBLIC_KEY ? STRIPE_PUBLIC_KEY.substring(0, 8) : 'null');
    
    if (!STRIPE_PUBLIC_KEY || STRIPE_PUBLIC_KEY === 'pk_test_placeholder' || STRIPE_PUBLIC_KEY.trim() === '') {
        // Show placeholder when no Stripe key is configured
        const cardElement = document.getElementById('card-element');
        cardElement.innerHTML = `
            <div style="padding: 1rem; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; color: #6c757d; text-align: center;">
                <p><strong>Payment form will appear here</strong></p>
                <p>Stripe integration ready - add your publishable key to activate payments</p>
                <p style="font-size: 12px; color: #999;">Debug: Key status = ${STRIPE_PUBLIC_KEY ? 'present but invalid' : 'missing'}</p>
            </div>
        `;
        return;
    }

    try {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        const elements = stripe.elements();

        // Create card element
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1a1a1a',
                    fontFamily: 'Inter, sans-serif',
                    '::placeholder': {
                        color: '#999999',
                    },
                },
                invalid: {
                    color: '#d73a49',
                    iconColor: '#d73a49'
                }
            }
        });

        cardElement.mount('#card-element');

        // Handle real-time validation errors from the card element
        cardElement.on('change', function (event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
    } catch (error) {
        console.error('Stripe initialization failed:', error);
        showMessage('Payment system initialization failed. Please refresh the page.', 'error');
    }
}

function setupQuantityControls() {
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const quantityInput = document.getElementById('quantity');

    decreaseBtn.addEventListener('click', function () {
        if (currentQuantity > 1) {
            currentQuantity--;
            quantityInput.value = currentQuantity;
            updateTotals();
            updateButtonState();
        }
    });

    increaseBtn.addEventListener('click', function () {
        if (currentQuantity < 10) {
            currentQuantity++;
            quantityInput.value = currentQuantity;
            updateTotals();
            updateButtonState();
        }
    });

    // Update button states initially
    updateButtonState();
}

function updateButtonState() {
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');

    decreaseBtn.disabled = currentQuantity <= 1;
    increaseBtn.disabled = currentQuantity >= 10;
}

function updateTotals() {
    const subtotal = TICKET_PRICE * currentQuantity;
    const total = subtotal; // No additional fees for now

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('button-total').textContent = `$${total.toFixed(2)}`;
}

function setupFormSubmission() {
    const form = document.getElementById('attend-form');
    form.addEventListener('submit', handleFormSubmission);
}

async function handleFormSubmission(event) {
    event.preventDefault();

    if (isProcessing) return;

    // Basic form validation
    const formData = getFormData();
    if (!validateForm(formData)) {
        return;
    }

    if (STRIPE_PUBLIC_KEY === 'pk_test_placeholder') {
        // Demo mode - show success without actual payment
        showDemoSuccess(formData);
        return;
    }

    setLoadingState(true);

    try {
        // Create payment intent on server (this would be a real API call)
        const paymentIntent = await createPaymentIntent(formData);

        // Confirm payment with Stripe
        const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
            paymentIntent.client_secret,
            {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: formData.fullName,
                        email: formData.email,
                    }
                }
            }
        );

        if (error) {
            console.error('Payment failed:', error);
            showMessage(error.message, 'error');
        } else {
            // Payment successful
            await saveTicketPurchase(formData, confirmedPaymentIntent);
            showSuccessConfirmation(formData, confirmedPaymentIntent);
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        showMessage('Payment processing failed. Please try again.', 'error');
    }

    setLoadingState(false);
}

function getFormData() {
    return {
        fullName: document.getElementById('full-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        company: document.getElementById('company').value.trim(),
        quantity: currentQuantity,
        total: TICKET_PRICE * currentQuantity,
        updates: document.getElementById('updates').checked
    };
}

function validateForm(formData) {
    // Clear previous errors
    showMessage('', '');

    if (!formData.fullName) {
        showMessage('Please enter your full name.', 'error');
        document.getElementById('full-name').focus();
        return false;
    }

    if (!formData.email || !isValidEmail(formData.email)) {
        showMessage('Please enter a valid email address.', 'error');
        document.getElementById('email').focus();
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Create payment intent via API
async function createPaymentIntent(formData) {
    try {
        const response = await fetch('/api/tickets/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                quantity: formData.quantity
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            id: result.payment_intent_id,
            client_secret: result.client_secret,
            amount: formData.total * 100,
            currency: 'usd'
        };
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
}

// Save ticket purchase via API
async function saveTicketPurchase(formData, paymentIntent) {
    try {
        const response = await fetch('/api/tickets/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                paymentIntentId: paymentIntent.id,
                ticketType: 'General Admission',
                price: formData.total
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            ...formData,
            paymentId: paymentIntent.id,
            orderId: result.ticketCode,
            purchaseDate: new Date().toISOString(),
            eventDate: '2025-10-29',
            eventTime: '7:00 PM - 11:00 PM PST',
            venue: 'The Midway SF',
            address: '900 Marin St, San Francisco, CA 94124',
            ticketCode: result.ticketCode
        };
    } catch (error) {
        console.error('Error saving ticket purchase:', error);
        throw error;
    }
}

function showDemoSuccess(formData) {
    // Show demo success for testing without Stripe keys
    const orderId = 'DEMO-' + Date.now();
    showSuccessConfirmation(formData, {
        id: 'demo_payment_id',
        status: 'succeeded'
    }, orderId);
}

function showSuccessConfirmation(formData, paymentIntent, orderId = null) {
    // Hide form and show confirmation
    document.getElementById('attend-form').style.display = 'none';
    document.querySelector('.ticket-selection-section').style.display = 'none';

    const confirmationSection = document.getElementById('confirmation-section');
    confirmationSection.style.display = 'block';

    // Update confirmation details
    document.getElementById('order-id').textContent = orderId || paymentIntent.id || 'N/A';
    document.getElementById('confirmed-quantity').textContent = formData.quantity;
    document.getElementById('confirmed-total').textContent = `$${formData.total.toFixed(2)}`;
    document.getElementById('confirmed-email').textContent = formData.email;

    // Scroll to confirmation
    confirmationSection.scrollIntoView({ behavior: 'smooth' });

    // Show success message
    showMessage('Purchase completed successfully!', 'success');
}

function setLoadingState(loading) {
    isProcessing = loading;
    const submitButton = document.getElementById('purchase-button');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonSpinner = submitButton.querySelector('.button-spinner');

    if (loading) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        buttonSpinner.style.display = 'block';
        buttonText.style.visibility = 'hidden';
    } else {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        buttonSpinner.style.display = 'none';
        buttonText.style.visibility = 'visible';
    }
}

function showMessage(message, type) {
    const messageElement = document.getElementById('form-message');
    messageElement.textContent = message;
    messageElement.className = 'form-message';

    if (type) {
        messageElement.classList.add(type);
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Handle browser back button to reset form if needed
window.addEventListener('popstate', function () {
    const confirmationSection = document.getElementById('confirmation-section');
    if (confirmationSection.style.display !== 'none') {
        location.reload(); // Simple reset - could be more sophisticated
    }
});
