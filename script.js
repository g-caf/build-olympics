// Countdown to September 15th, 2025
const targetDate = new Date('September 15, 2025 00:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        document.getElementById('countdown').innerHTML = '<div class="time-unit"><span class="time-value">LIVE</span><span class="time-label">NOW</span></div>';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days);
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Update countdown immediately and then every second
updateCountdown();
setInterval(updateCountdown, 1000);

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Countdown numbers stay static

    // Prize amount stays static

    // Add particle effect background
    createParticles();
});

function createParticles() {
    const particleCount = 50;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: fixed;
            width: 2px;
            height: 2px;
            background: rgba(45, 90, 61, 0.3);
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
        `;
        
        document.body.appendChild(particle);
        particles.push({
            element: particle,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.1
        });
    }

    function animateParticles() {
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
            if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

            particle.element.style.left = particle.x + 'px';
            particle.element.style.top = particle.y + 'px';
            particle.element.style.opacity = particle.opacity;
        });

        requestAnimationFrame(animateParticles);
    }

    animateParticles();
}

// Email signup functionality
document.addEventListener('DOMContentLoaded', function() {
    const signupBtn = document.getElementById('signup-btn');
    const emailInput = document.getElementById('email');
    const messageDiv = document.getElementById('signup-message');
    
    if (signupBtn && emailInput && messageDiv) {
        signupBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            if (!email || !email.includes('@')) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }
            
            // Disable button during request
            signupBtn.disabled = true;
            signupBtn.textContent = 'Signing Up...';
            
            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Success! You\'ll be notified about Build Olympics updates.', 'success');
                    emailInput.value = '';
                } else {
                    showMessage(data.error || 'Something went wrong. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Signup error:', error);
                showMessage('Network error. Please try again.', 'error');
            } finally {
                signupBtn.disabled = false;
                signupBtn.textContent = 'Get Notified';
            }
        });
        
        // Allow enter key to submit
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                signupBtn.click();
            }
        });
    }
    
    function showMessage(text, type) {
        const messageDiv = document.getElementById('signup-message');
        messageDiv.textContent = text;
        messageDiv.className = `signup-message ${type}`;
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
        }, 5000);
    }
});
