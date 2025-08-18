// Passcode lock functionality
const CORRECT_PASSCODE = '102925';
const PASSCODE_STORAGE_KEY = 'buildOlympicsAccess';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function checkPasscodeAccess() {
    const sessionData = localStorage.getItem(PASSCODE_STORAGE_KEY);
    const lockScreen = document.getElementById('lockScreen');
    
    let hasValidAccess = false;
    
    if (sessionData) {
        try {
            const parsed = JSON.parse(sessionData);
            const now = Date.now();
            
            // Check if session hasn't expired
            if (parsed.timestamp && (now - parsed.timestamp) < SESSION_DURATION) {
                hasValidAccess = true;
            } else {
                // Session expired, clear storage
                localStorage.removeItem(PASSCODE_STORAGE_KEY);
            }
        } catch (e) {
            // Invalid format, clear storage
            localStorage.removeItem(PASSCODE_STORAGE_KEY);
        }
    }
    
    if (hasValidAccess) {
        lockScreen.classList.add('hidden');
    } else {
        lockScreen.classList.remove('hidden');
        // Focus on passcode input
        setTimeout(() => {
            const passcodeInput = document.getElementById('passcodeInput');
            if (passcodeInput) {
                passcodeInput.focus();
            }
        }, 100);
    }
}

function initializePasscodeForm() {
    const passcodeForm = document.getElementById('passcodeForm');
    const passcodeInput = document.getElementById('passcodeInput');
    const passcodeButton = document.getElementById('passcodeButton');
    const passcodeError = document.getElementById('passcodeError');
    
    if (!passcodeForm || !passcodeInput || !passcodeButton || !passcodeError) {
        return;
    }
    
    passcodeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const enteredPasscode = passcodeInput.value.trim();
        
        if (enteredPasscode === CORRECT_PASSCODE) {
            // Correct passcode - store with timestamp
            const sessionData = {
                authenticated: true,
                timestamp: Date.now()
            };
            localStorage.setItem(PASSCODE_STORAGE_KEY, JSON.stringify(sessionData));
            document.getElementById('lockScreen').classList.add('hidden');
            passcodeError.classList.remove('show');
            
            // Clear the input for security
            passcodeInput.value = '';
        } else {
            // Incorrect passcode
            passcodeError.classList.add('show');
            passcodeInput.value = '';
            passcodeInput.focus();
            
            // Hide error after 3 seconds
            setTimeout(() => {
                passcodeError.classList.remove('show');
            }, 3000);
        }
    });
    
    // Clear error when user starts typing again
    passcodeInput.addEventListener('input', function() {
        passcodeError.classList.remove('show');
    });
}

// Add session extension functionality
function extendSession() {
    const sessionData = localStorage.getItem(PASSCODE_STORAGE_KEY);
    if (sessionData) {
        try {
            const parsed = JSON.parse(sessionData);
            parsed.timestamp = Date.now();
            localStorage.setItem(PASSCODE_STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) {
            // If parsing fails, clear storage
            localStorage.removeItem(PASSCODE_STORAGE_KEY);
        }
    }
}

// Extend session on user activity
function setupSessionExtension() {
    const activities = ['click', 'keypress', 'scroll', 'mousemove'];
    let lastActivity = Date.now();
    
    activities.forEach(activity => {
        document.addEventListener(activity, () => {
            const now = Date.now();
            // Only extend session once every 5 minutes to avoid excessive writes
            if (now - lastActivity > 5 * 60 * 1000) {
                extendSession();
                lastActivity = now;
            }
        });
    });
}

// Initialize passcode functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkPasscodeAccess();
    initializePasscodeForm();
    setupSessionExtension();
    
    // Check session validity every 30 minutes and recheck access
    setInterval(() => {
        checkPasscodeAccess();
    }, 30 * 60 * 1000);
});

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
                    showMessage('Success! You\'ll be notified about Amp Arena updates.', 'success');
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
