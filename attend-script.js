document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('attend-form');
    const submitBtn = document.querySelector('.submit-btn');
    const ticketOptions = document.querySelectorAll('input[name="ticketType"]');

    // Update button text based on selected ticket
    function updateButtonText() {
        const selectedTicket = document.querySelector('input[name="ticketType"]:checked');
        const price = selectedTicket.value === 'vip' ? '$100' : '$20';
        const ticketType = selectedTicket.value === 'vip' ? 'VIP' : 'GENERAL';
        submitBtn.textContent = `SECURE YOUR ${ticketType} SEAT - ${price}`;
    }

    // Add event listeners to ticket options
    ticketOptions.forEach(option => {
        option.addEventListener('change', updateButtonText);
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'PROCESSING...';
        submitBtn.disabled = true;

        try {
            // Here you would normally send the data to your server
            // For now, we'll simulate a successful submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            showSuccessMessage(data);
            
        } catch (error) {
            // Show error message
            showErrorMessage();
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    function showSuccessMessage(data) {
        const ticketType = data.ticketType === 'vip' ? 'VIP' : 'General Admission';
        const price = data.ticketType === 'vip' ? '$100' : '$20';
        
        const successHtml = `
            <div class="success-message">
                <h3>Registration Confirmed!</h3>
                <div class="confirmation-details">
                    <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Ticket Type:</strong> ${ticketType}</p>
                    <p><strong>Price:</strong> ${price}</p>
                </div>
                <p class="confirmation-note">
                    You'll receive payment instructions and your digital ticket via email within 24 hours.
                </p>
                <button class="new-registration-btn" onclick="location.reload()">Register Another Ticket</button>
            </div>
        `;
        
        document.querySelector('.registration-form-container').innerHTML = successHtml;
        
        // Add success message styles
        const style = document.createElement('style');
        style.textContent = `
            .success-message {
                text-align: center;
                padding: 3rem;
            }
            .success-message h3 {
                color: #4a7c59;
                font-size: 2rem;
                margin-bottom: 2rem;
                text-shadow: 0 0 15px rgba(74, 124, 89, 0.5);
            }
            .confirmation-details {
                background: rgba(0, 255, 65, 0.1);
                border: 1px solid rgba(0, 255, 65, 0.3);
                border-radius: 15px;
                padding: 2rem;
                margin: 2rem 0;
                text-align: left;
            }
            .confirmation-details p {
                margin: 0.5rem 0;
                color: #ffffff;
            }
            .confirmation-note {
                color: #cccccc;
                margin: 2rem 0;
                line-height: 1.6;
            }
            .new-registration-btn {
                background: linear-gradient(45deg, #2d5a3d, #4a7c59);
                color: #ffffff;
                border: 2px solid rgba(0, 255, 65, 0.5);
                padding: 1rem 2rem;
                border-radius: 10px;
                font-weight: 600;
                text-transform: uppercase;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .new-registration-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 255, 65, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    function showErrorMessage() {
        alert('There was an error processing your registration. Please try again or contact support.');
    }

    // Add some interactive effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
});
