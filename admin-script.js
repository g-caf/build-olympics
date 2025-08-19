// Attendee Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.signupsData = [];
        this.filteredData = [];
        this.adminKey = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Passcode authentication
        document.getElementById('passcodeBtn').addEventListener('click', () => this.authenticate());
        document.getElementById('passcodeInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authenticate();
        });

        // Dashboard controls
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadSignups());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('filterBtn').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', () => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
        });

        // Date inputs
        document.getElementById('startDate').addEventListener('change', () => this.applyFilters());
        document.getElementById('endDate').addEventListener('change', () => this.applyFilters());
        
        // Set up activity-based session extension
        this.setupActivityExtension();
    }

    async authenticate() {
        const passcode = document.getElementById('passcodeInput').value;
        const errorElement = document.getElementById('passcodeError');
        const button = document.getElementById('passcodeBtn');

        if (!passcode) {
            errorElement.textContent = 'Please enter a passcode.';
            errorElement.classList.add('show');
            return;
        }

        button.disabled = true;
        button.textContent = 'Authenticating...';
        errorElement.classList.remove('show');

        try {
            const response = await fetch('/api/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ passcode })
            });

            const data = await response.json();

            if (response.ok) {
                this.adminKey = data.adminKey;
                this.showDashboard();
                this.startDashboard();
                this.showStatus('Attendee dashboard authentication successful', 'success');
            } else {
                errorElement.textContent = 'Incorrect passcode. Please try again.';
                errorElement.classList.add('show');
                document.getElementById('passcodeInput').value = '';
            }
        } catch (error) {
            console.error('Authentication error:', error);
            errorElement.textContent = 'Authentication failed. Please try again.';
            errorElement.classList.add('show');
            document.getElementById('passcodeInput').value = '';
        } finally {
            button.disabled = false;
            button.textContent = 'Access Dashboard';
        }
    }

    showDashboard() {
        document.getElementById('lockScreen').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
        
        // Store admin session with timestamp for cross-tab persistence
        const adminSession = {
            authenticated: true,
            adminKey: this.adminKey,
            timestamp: Date.now()
        };
        localStorage.setItem('adminAuth', JSON.stringify(adminSession));
    }

    startDashboard() {
        this.loadSignups();
        this.setupAutoRefresh();
        this.showStatus('Dashboard loaded successfully', 'success');
    }

    logout() {
        this.adminKey = null;
        this.clearAutoRefresh();
        localStorage.removeItem('adminAuth');
        document.getElementById('lockScreen').classList.remove('hidden');
        document.getElementById('dashboardContent').classList.add('hidden');
        document.getElementById('passcodeInput').value = '';
        document.getElementById('passcodeError').classList.remove('show');
    }

    checkAuth() {
        // Check if already authenticated with expiration check
        const sessionData = localStorage.getItem('adminAuth');
        
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                const now = Date.now();
                const ADMIN_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours for admin
                
                // Check if session hasn't expired
                if (parsed.timestamp && (now - parsed.timestamp) < ADMIN_SESSION_DURATION && parsed.adminKey) {
                    this.adminKey = parsed.adminKey;
                    this.showDashboard();
                    this.startDashboard();
                } else {
                    // Session expired, clear storage
                    localStorage.removeItem('adminAuth');
                }
            } catch (e) {
                // Invalid format, clear storage
                localStorage.removeItem('adminAuth');
            }
        }
    }

    async loadSignups() {
        try {
            this.showStatus('Loading signups...', 'info');
            
            const headers = {
                'admin-key': this.adminKey
            };

            const response = await fetch('/api/signups', { headers });
            
            if (!response.ok) {
                throw new Error('API not available - using demo data');
            }

            this.signupsData = await response.json();
            this.applyFilters();
            this.updateStatistics();
            this.updateLastUpdated();
            this.showStatus('Data refreshed successfully', 'success');
        } catch (error) {
            console.log('API not available, loading demo data:', error.message);
            this.showStatus('Demo mode - sample data loaded', 'info');
            
            // Load sample data for static deployment
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Sample data for demonstration
        const now = new Date();
        this.signupsData = [
            {
                id: 1,
                email: 'user1@example.com',
                created_at: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
                notified: true
            },
            {
                id: 2,
                email: 'user2@example.com',
                created_at: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
                notified: false
            },
            {
                id: 3,
                email: 'user3@example.com',
                created_at: now.toISOString(),
                notified: true
            }
        ];
        
        this.applyFilters();
        this.updateStatistics();
        this.updateLastUpdated();
        this.showStatus('Demo data loaded', 'info');
    }

    applyFilters() {
        let filtered = [...this.signupsData];
        
        // Search filter
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(signup => 
                signup.email.toLowerCase().includes(searchTerm)
            );
        }

        // Date filters
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter(signup => 
                new Date(signup.created_at) >= start
            );
        }
        
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(signup => 
                new Date(signup.created_at) <= end
            );
        }

        this.filteredData = filtered;
        this.renderTable();
        this.updateResultsCount();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        this.applyFilters();
    }

    renderTable() {
        const tbody = document.getElementById('signupsTableBody');
        
        if (this.filteredData.length === 0) {
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="5" class="loading-cell">No signups found</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredData.map(signup => {
            const date = new Date(signup.created_at);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const status = signup.notified ? 'Notified' : 'Pending';
            const statusClass = signup.notified ? 'status-notified' : 'status-pending';

            return `
                <tr>
                    <td>${signup.id}</td>
                    <td class="email-cell">${signup.email}</td>
                    <td class="date-cell">${dateStr}</td>
                    <td class="time-cell">${timeStr}</td>
                    <td class="status-cell ${statusClass}">${status}</td>
                </tr>
            `;
        }).join('');
    }

    updateStatistics() {
        const total = this.signupsData.length;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today.getTime() - (today.getDay() * 86400000));
        
        const todayCount = this.signupsData.filter(signup => 
            new Date(signup.created_at) >= today
        ).length;
        
        const weekCount = this.signupsData.filter(signup => 
            new Date(signup.created_at) >= weekStart
        ).length;

        document.getElementById('totalSignups').textContent = total;
        document.getElementById('todaySignups').textContent = todayCount;
        document.getElementById('weekSignups').textContent = weekCount;
    }

    updateResultsCount() {
        const count = this.filteredData.length;
        const total = this.signupsData.length;
        document.getElementById('resultsCount').textContent = 
            count === total ? `${count} results` : `${count} of ${total} results`;
    }

    updateLastUpdated() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('lastUpdated').textContent = timeStr;
    }

    exportCSV() {
        if (this.filteredData.length === 0) {
            this.showStatus('No data to export', 'error');
            return;
        }

        const headers = ['ID', 'Email', 'Signup Date', 'Signup Time', 'Notified'];
        const csvContent = [
            headers.join(','),
            ...this.filteredData.map(signup => {
                const date = new Date(signup.created_at);
                const dateStr = date.toLocaleDateString();
                const timeStr = date.toLocaleTimeString();
                return [
                    signup.id,
                    `"${signup.email}"`,
                    `"${dateStr}"`,
                    `"${timeStr}"`,
                    signup.notified ? 'Yes' : 'No'
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `build-olympics-signups-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.showStatus('CSV exported successfully', 'success');
    }

    setupAutoRefresh() {
        this.clearAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.loadSignups();
        }, 30000); // Refresh every 30 seconds
        
        // Set up session validation check
        this.sessionCheckInterval = setInterval(() => {
            this.validateSession();
        }, 60000); // Check every minute
    }

    clearAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
    }
    
    validateSession() {
        const sessionData = localStorage.getItem('adminAuth');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                const now = Date.now();
                const ADMIN_SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours
                
                if (!parsed.timestamp || (now - parsed.timestamp) >= ADMIN_SESSION_DURATION) {
                    // Session expired, logout
                    this.logout();
                    this.showStatus('Session expired. Please log in again.', 'warning');
                }
            } catch (e) {
                // Invalid session data, logout
                this.logout();
            }
        }
    }
    
    extendAdminSession() {
        const sessionData = localStorage.getItem('adminAuth');
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                parsed.timestamp = Date.now();
                localStorage.setItem('adminAuth', JSON.stringify(parsed));
            } catch (e) {
                // Invalid format, clear and logout
                this.logout();
            }
        }
    }
    
    setupActivityExtension() {
        const activities = ['click', 'keypress', 'scroll', 'mousemove'];
        let lastActivity = Date.now();
        
        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                const now = Date.now();
                // Only extend session once every 10 minutes to avoid excessive writes
                if (now - lastActivity > 10 * 60 * 1000) {
                    this.extendAdminSession();
                    lastActivity = now;
                }
            });
        });
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        statusEl.classList.add('show');
        
        setTimeout(() => {
            statusEl.classList.remove('show');
        }, 4000);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
