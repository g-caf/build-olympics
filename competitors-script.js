// Competitors Dashboard JavaScript
class CompetitorsDashboard {
    constructor() {
        this.competitorAdminKey = localStorage.getItem('competitorAdminKey');
        this.competitors = [];
        this.filteredCompetitors = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.checkAuthentication();
    }

    initializeElements() {
        // Lock screen elements
        this.lockScreen = document.getElementById('lockScreen');
        this.dashboardContent = document.getElementById('dashboardContent');
        this.passcodeInput = document.getElementById('passcodeInput');
        this.passcodeBtn = document.getElementById('passcodeBtn');
        this.passcodeError = document.getElementById('passcodeError');

        // Dashboard elements
        this.totalCompetitors = document.getElementById('totalCompetitors');
        this.pendingCount = document.getElementById('pendingCount');
        this.qualifiedCount = document.getElementById('qualifiedCount');
        this.finalistCount = document.getElementById('finalistCount');

        // Controls
        this.searchInput = document.getElementById('searchInput');
        this.statusFilter = document.getElementById('statusFilter');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.addCompetitorBtn = document.getElementById('addCompetitorBtn');

        // Results
        this.competitorsGrid = document.getElementById('competitorsGrid');
        this.resultsCount = document.getElementById('resultsCount');

        // Modal elements
        this.addCompetitorModal = document.getElementById('addCompetitorModal');
        this.addCompetitorForm = document.getElementById('addCompetitorForm');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelModalBtn = document.getElementById('cancelModalBtn');

        // Status message
        this.statusMessage = document.getElementById('statusMessage');

        // Logout button
        this.logoutBtn = document.getElementById('logoutBtn');
    }

    attachEventListeners() {
        // Authentication
        this.passcodeBtn.addEventListener('click', () => this.authenticate());
        this.passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.authenticate();
        });

        // Search and filter
        this.searchInput.addEventListener('input', () => this.filterCompetitors());
        this.statusFilter.addEventListener('change', () => this.filterCompetitors());

        // Controls
        this.refreshBtn.addEventListener('click', () => this.loadCompetitors());
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.addCompetitorBtn.addEventListener('click', () => this.showAddCompetitorModal());

        // Modal controls
        this.closeModalBtn.addEventListener('click', () => this.hideAddCompetitorModal());
        this.cancelModalBtn.addEventListener('click', () => this.hideAddCompetitorModal());
        this.addCompetitorForm.addEventListener('submit', (e) => this.handleAddCompetitor(e));

        // Click outside modal to close
        this.addCompetitorModal.addEventListener('click', (e) => {
            if (e.target === this.addCompetitorModal) {
                this.hideAddCompetitorModal();
            }
        });

        // Logout
        this.logoutBtn.addEventListener('click', () => this.logout());
    }

    checkAuthentication() {
        if (this.competitorAdminKey) {
            this.showDashboard();
            this.loadCompetitors();
        } else {
            this.showLockScreen();
        }
    }

    async authenticate() {
        const passcode = this.passcodeInput.value.trim();
        
        if (!passcode) {
            this.showError('Please enter a passcode');
            return;
        }

        this.passcodeBtn.disabled = true;
        this.passcodeBtn.textContent = 'Authenticating...';

        try {
            const response = await fetch('/api/competitor-admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ passcode })
            });

            const data = await response.json();

            if (response.ok) {
                this.competitorAdminKey = data.competitorAdminKey;
                localStorage.setItem('competitorAdminKey', this.competitorAdminKey);
                this.showDashboard();
                this.loadCompetitors();
            } else {
                this.showError(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showError('Connection error. Please try again.');
        } finally {
            this.passcodeBtn.disabled = false;
            this.passcodeBtn.textContent = 'Access Dashboard';
        }
    }

    showError(message) {
        this.passcodeError.textContent = message;
        this.passcodeError.classList.add('show');
        setTimeout(() => {
            this.passcodeError.classList.remove('show');
        }, 3000);
    }

    showLockScreen() {
        this.lockScreen.classList.remove('hidden');
        this.dashboardContent.classList.add('hidden');
        this.passcodeInput.focus();
    }

    showDashboard() {
        this.lockScreen.classList.add('hidden');
        this.dashboardContent.classList.remove('hidden');
    }

    logout() {
        localStorage.removeItem('competitorAdminKey');
        this.competitorAdminKey = null;
        this.passcodeInput.value = '';
        this.showLockScreen();
    }

    async loadCompetitors() {
        this.showLoadingMessage('Loading competitors...');

        try {
            const response = await fetch('/api/competitors', {
                headers: {
                    'competitor-admin-key': this.competitorAdminKey
                }
            });

            if (response.ok) {
                this.competitors = await response.json();
                this.updateStatistics();
                this.filterCompetitors();
            } else if (response.status === 401) {
                this.logout();
                return;
            } else {
                throw new Error('Failed to load competitors');
            }
        } catch (error) {
            console.error('Error loading competitors:', error);
            this.showStatusMessage('Error loading competitors', 'error');
            this.showLoadingMessage('Error loading competitors');
        }
    }

    updateStatistics() {
        const stats = this.competitors.reduce((acc, competitor) => {
            acc.total++;
            acc[competitor.status] = (acc[competitor.status] || 0) + 1;
            return acc;
        }, { total: 0, pending: 0, qualified: 0, finalist: 0, eliminated: 0 });

        this.totalCompetitors.textContent = stats.total;
        this.pendingCount.textContent = stats.pending;
        this.qualifiedCount.textContent = stats.qualified;
        this.finalistCount.textContent = stats.finalist;
    }

    filterCompetitors() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        const statusFilter = this.statusFilter.value;

        this.filteredCompetitors = this.competitors.filter(competitor => {
            const matchesSearch = !searchTerm || 
                competitor.full_name.toLowerCase().includes(searchTerm) ||
                competitor.email.toLowerCase().includes(searchTerm) ||
                (competitor.github_username && competitor.github_username.toLowerCase().includes(searchTerm)) ||
                (competitor.twitter_username && competitor.twitter_username.toLowerCase().includes(searchTerm));

            const matchesStatus = !statusFilter || competitor.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        this.renderCompetitors();
        this.updateResultsCount();
    }

    renderCompetitors() {
        if (this.filteredCompetitors.length === 0) {
            this.competitorsGrid.innerHTML = `
                <div class="loading-message">
                    ${this.competitors.length === 0 ? 'No competitors found' : 'No competitors match your filters'}
                </div>
            `;
            return;
        }

        this.competitorsGrid.innerHTML = this.filteredCompetitors
            .map(competitor => this.renderCompetitorCard(competitor))
            .join('');

        // Add click handlers to cards
        this.competitorsGrid.querySelectorAll('.competitor-card').forEach(card => {
            card.addEventListener('click', () => {
                const competitorId = card.dataset.competitorId;
                window.location.href = `/competitors/profile/${competitorId}`;
            });
        });
    }

    renderCompetitorCard(competitor) {
        const joinedDate = new Date(competitor.created_at).toLocaleDateString();
        const hasPhoto = competitor.profile_photo_url && competitor.profile_photo_url.trim();
        const hasGithub = competitor.github_username && competitor.github_username.trim();
        const hasTwitter = competitor.twitter_username && competitor.twitter_username.trim();

        return `
            <div class="competitor-card" data-competitor-id="${competitor.id}">
                <div class="competitor-photo ${hasPhoto ? '' : 'no-photo'}">
                    ${hasPhoto ? 
                        `<img src="${competitor.profile_photo_url}" alt="${competitor.full_name}" onerror="this.parentElement.classList.add('no-photo'); this.style.display='none'; this.parentElement.innerHTML='No Photo';">` :
                        'No Photo'
                    }
                </div>
                
                <div class="competitor-header">
                    <div>
                        <h3 class="competitor-name">${this.escapeHtml(competitor.full_name)}</h3>
                        <p class="competitor-email">${this.escapeHtml(competitor.email)}</p>
                    </div>
                    <div class="status-badge status-${competitor.status}">${competitor.status}</div>
                </div>

                ${hasGithub || hasTwitter ? `
                    <div class="social-links">
                        ${hasGithub ? `<a href="https://github.com/${competitor.github_username}" target="_blank" class="social-link" onclick="event.stopPropagation();">GitHub</a>` : ''}
                        ${hasTwitter ? `<a href="https://twitter.com/${competitor.twitter_username}" target="_blank" class="social-link" onclick="event.stopPropagation();">Twitter</a>` : ''}
                    </div>
                ` : ''}

                <div class="competitor-meta">
                    <span><strong>Joined:</strong> ${joinedDate}</span>
                    <span><strong>Files:</strong> ${competitor.submission_files ? competitor.submission_files.length : 0}</span>
                </div>
            </div>
        `;
    }

    updateResultsCount() {
        const count = this.filteredCompetitors.length;
        this.resultsCount.textContent = `${count} competitor${count !== 1 ? 's' : ''}`;
    }

    showLoadingMessage(message) {
        this.competitorsGrid.innerHTML = `<div class="loading-message">${message}</div>`;
    }

    showAddCompetitorModal() {
        this.addCompetitorModal.classList.add('show');
        this.addCompetitorForm.reset();
        document.getElementById('competitorEmail').focus();
    }

    hideAddCompetitorModal() {
        this.addCompetitorModal.classList.remove('show');
    }

    async handleAddCompetitor(event) {
        event.preventDefault();
        
        const formData = new FormData(this.addCompetitorForm);
        const competitorData = Object.fromEntries(formData);

        // Remove empty fields
        Object.keys(competitorData).forEach(key => {
            if (!competitorData[key].trim()) {
                delete competitorData[key];
            }
        });

        try {
            const response = await fetch('/api/competitors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(competitorData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showStatusMessage('Competitor added successfully!', 'success');
                this.hideAddCompetitorModal();
                this.loadCompetitors(); // Reload to show the new competitor
            } else {
                this.showStatusMessage(data.error || 'Failed to add competitor', 'error');
            }
        } catch (error) {
            console.error('Error adding competitor:', error);
            this.showStatusMessage('Error adding competitor', 'error');
        }
    }

    async exportToCSV() {
        try {
            const dataToExport = this.filteredCompetitors.map(competitor => ({
                id: competitor.id,
                full_name: competitor.full_name,
                email: competitor.email,
                github_username: competitor.github_username || '',
                twitter_username: competitor.twitter_username || '',
                bio: competitor.bio || '',
                status: competitor.status,
                files_count: competitor.submission_files ? competitor.submission_files.length : 0,
                created_at: competitor.created_at,
                updated_at: competitor.updated_at
            }));

            if (dataToExport.length === 0) {
                this.showStatusMessage('No competitors to export', 'info');
                return;
            }

            const headers = Object.keys(dataToExport[0]);
            const csvContent = [
                headers.join(','),
                ...dataToExport.map(competitor => 
                    headers.map(header => {
                        const value = competitor[header] || '';
                        return `"${value.toString().replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `competitors-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showStatusMessage('CSV exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showStatusMessage('Error exporting CSV', 'error');
        }
    }

    showStatusMessage(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type} show`;
        
        setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CompetitorsDashboard();
});
