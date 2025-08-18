// Competitor Profile JavaScript
class CompetitorProfile {
    constructor() {
        this.competitorAdminKey = localStorage.getItem('competitorAdminKey');
        this.competitorId = this.getCompetitorIdFromURL();
        this.competitor = null;
        this.isEditing = false;

        this.initializeElements();
        this.attachEventListeners();
        this.checkAuthentication();
    }

    initializeElements() {
        // Lock screen elements
        this.lockScreen = document.getElementById('lockScreen');
        this.profileContent = document.getElementById('profileContent');
        this.passcodeInput = document.getElementById('passcodeInput');
        this.passcodeBtn = document.getElementById('passcodeBtn');
        this.passcodeError = document.getElementById('passcodeError');

        // Profile elements
        this.competitorPhoto = document.getElementById('competitorPhoto');
        this.competitorName = document.getElementById('competitorName');
        this.competitorEmail = document.getElementById('competitorEmail');
        this.competitorStatus = document.getElementById('competitorStatus');
        this.competitorJoined = document.getElementById('competitorJoined');
        this.competitorUpdated = document.getElementById('competitorUpdated');
        this.competitorBio = document.getElementById('competitorBio');
        this.githubLink = document.getElementById('githubLink');
        this.twitterLink = document.getElementById('twitterLink');

        // Edit elements
        this.editSection = document.getElementById('editSection');
        this.editProfileForm = document.getElementById('editProfileForm');
        this.editToggleBtn = document.getElementById('editToggleBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');

        // Submissions
        this.submissionsList = document.getElementById('submissionsList');
        this.uploadBtn = document.getElementById('uploadBtn');

        // Modals
        this.uploadModal = document.getElementById('uploadModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadProgress = document.getElementById('uploadProgress');

        // Actions
        this.deleteCompetitorBtn = document.getElementById('deleteCompetitorBtn');

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

        // Edit controls
        this.editToggleBtn.addEventListener('click', () => this.toggleEditMode());
        this.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
        this.editProfileForm.addEventListener('submit', (e) => this.handleSaveProfile(e));

        // File upload
        this.uploadBtn.addEventListener('click', () => this.showUploadModal());
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Modal controls
        this.setupModalControls();

        // Actions
        this.deleteCompetitorBtn.addEventListener('click', () => this.showDeleteModal());

        // Logout
        this.logoutBtn.addEventListener('click', () => this.logout());
    }

    setupModalControls() {
        // Upload modal
        document.getElementById('closeUploadModalBtn').addEventListener('click', () => this.hideUploadModal());
        document.getElementById('cancelUploadBtn').addEventListener('click', () => this.hideUploadModal());
        document.getElementById('uploadSubmitBtn').addEventListener('click', () => this.handleFileUpload());

        // Delete modal
        document.getElementById('closeDeleteModalBtn').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.handleDeleteCompetitor());

        // Click outside modals to close
        this.uploadModal.addEventListener('click', (e) => {
            if (e.target === this.uploadModal) this.hideUploadModal();
        });
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.hideDeleteModal();
        });
    }

    getCompetitorIdFromURL() {
        const path = window.location.pathname;
        const match = path.match(/\/competitors\/profile\/(\d+)/);
        return match ? match[1] : null;
    }

    checkAuthentication() {
        if (!this.competitorId) {
            this.showStatusMessage('Invalid competitor ID', 'error');
            setTimeout(() => window.location.href = '/competitors', 2000);
            return;
        }

        if (this.competitorAdminKey) {
            this.showProfile();
            this.loadCompetitor();
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
                this.showProfile();
                this.loadCompetitor();
            } else {
                this.showError(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showError('Connection error. Please try again.');
        } finally {
            this.passcodeBtn.disabled = false;
            this.passcodeBtn.textContent = 'Access Profile';
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
        this.profileContent.classList.add('hidden');
        this.passcodeInput.focus();
    }

    showProfile() {
        this.lockScreen.classList.add('hidden');
        this.profileContent.classList.remove('hidden');
    }

    logout() {
        localStorage.removeItem('competitorAdminKey');
        this.competitorAdminKey = null;
        this.passcodeInput.value = '';
        this.showLockScreen();
    }

    async loadCompetitor() {
        try {
            const response = await fetch(`/api/competitors/${this.competitorId}`, {
                headers: this.competitorAdminKey ? {
                    'competitor-admin-key': this.competitorAdminKey
                } : {}
            });

            if (response.ok) {
                this.competitor = await response.json();
                this.renderCompetitor();
            } else if (response.status === 401) {
                this.logout();
                return;
            } else if (response.status === 404) {
                this.showStatusMessage('Competitor not found', 'error');
                setTimeout(() => window.location.href = '/competitors', 2000);
                return;
            } else {
                throw new Error('Failed to load competitor');
            }
        } catch (error) {
            console.error('Error loading competitor:', error);
            this.showStatusMessage('Error loading competitor profile', 'error');
        }
    }

    renderCompetitor() {
        if (!this.competitor) return;

        // Basic info
        this.competitorName.textContent = this.competitor.full_name;
        this.competitorEmail.textContent = this.competitor.email;
        this.competitorStatus.textContent = this.competitor.status;
        this.competitorStatus.className = `status-badge status-${this.competitor.status}`;

        // Photo
        const photoImg = this.competitorPhoto.querySelector('.photo-img');
        const photoPlaceholder = this.competitorPhoto.querySelector('.photo-placeholder');
        
        if (this.competitor.profile_photo_url && this.competitor.profile_photo_url.trim()) {
            photoImg.src = this.competitor.profile_photo_url;
            photoImg.style.display = 'block';
            photoPlaceholder.classList.add('hidden');
            
            photoImg.onerror = () => {
                photoImg.style.display = 'none';
                photoPlaceholder.classList.remove('hidden');
            };
        } else {
            photoImg.style.display = 'none';
            photoPlaceholder.classList.remove('hidden');
        }

        // Social links
        this.updateSocialLinks();

        // Dates
        this.competitorJoined.textContent = new Date(this.competitor.created_at).toLocaleDateString();
        this.competitorUpdated.textContent = new Date(this.competitor.updated_at).toLocaleDateString();

        // Bio
        this.renderBio();

        // Submissions
        this.renderSubmissions();

        // Populate edit form
        this.populateEditForm();
    }

    updateSocialLinks() {
        if (this.competitor.github_username && this.competitor.github_username.trim()) {
            this.githubLink.href = `https://github.com/${this.competitor.github_username}`;
            this.githubLink.classList.remove('hidden');
        } else {
            this.githubLink.classList.add('hidden');
        }

        if (this.competitor.twitter_username && this.competitor.twitter_username.trim()) {
            this.twitterLink.href = `https://twitter.com/${this.competitor.twitter_username}`;
            this.twitterLink.classList.remove('hidden');
        } else {
            this.twitterLink.classList.add('hidden');
        }
    }

    renderBio() {
        if (this.competitor.bio && this.competitor.bio.trim()) {
            this.competitorBio.innerHTML = `<p>${this.escapeHtml(this.competitor.bio)}</p>`;
        } else {
            this.competitorBio.innerHTML = '<p class="empty-bio">No bio available</p>';
        }
    }

    renderSubmissions() {
        if (!this.competitor.submission_files || this.competitor.submission_files.length === 0) {
            this.submissionsList.innerHTML = `
                <div class="empty-submissions">
                    <p>No files submitted yet</p>
                </div>
            `;
            return;
        }

        this.submissionsList.innerHTML = this.competitor.submission_files
            .map(filePath => this.renderSubmissionItem(filePath))
            .join('');
    }

    renderSubmissionItem(filePath) {
        const fileName = filePath.split('/').pop();
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        return `
            <div class="submission-item">
                <div class="file-info">
                    <div class="file-name">${this.escapeHtml(fileName)}</div>
                    <div class="file-size">Type: ${fileExtension.toUpperCase()}</div>
                </div>
                <div class="file-actions">
                    <a href="/${filePath}" download class="download-btn">Download</a>
                </div>
            </div>
        `;
    }

    populateEditForm() {
        if (!this.competitor) return;

        document.getElementById('editName').value = this.competitor.full_name || '';
        document.getElementById('editEmail').value = this.competitor.email || '';
        document.getElementById('editGithub').value = this.competitor.github_username || '';
        document.getElementById('editTwitter').value = this.competitor.twitter_username || '';
        document.getElementById('editPhoto').value = this.competitor.profile_photo_url || '';
        document.getElementById('editStatus').value = this.competitor.status || 'pending';
        document.getElementById('editBio').value = this.competitor.bio || '';
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        
        if (this.isEditing) {
            this.editSection.classList.remove('hidden');
            this.editToggleBtn.textContent = 'Cancel Edit';
            this.editToggleBtn.classList.add('editing');
            this.populateEditForm();
        } else {
            this.editSection.classList.add('hidden');
            this.editToggleBtn.textContent = 'Edit Profile';
            this.editToggleBtn.classList.remove('editing');
        }
    }

    cancelEdit() {
        this.isEditing = false;
        this.editSection.classList.add('hidden');
        this.editToggleBtn.textContent = 'Edit Profile';
        this.editToggleBtn.classList.remove('editing');
    }

    async handleSaveProfile(event) {
        event.preventDefault();

        const formData = new FormData(this.editProfileForm);
        const profileData = Object.fromEntries(formData);

        // Remove empty fields except for required ones
        Object.keys(profileData).forEach(key => {
            if (!profileData[key].trim() && key !== 'full_name' && key !== 'email') {
                profileData[key] = null;
            }
        });

        try {
            const response = await fetch(`/api/competitors/${this.competitorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'competitor-admin-key': this.competitorAdminKey
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showStatusMessage('Profile updated successfully!', 'success');
                this.cancelEdit();
                this.loadCompetitor(); // Reload to show changes
            } else if (response.status === 401) {
                this.logout();
                return;
            } else {
                this.showStatusMessage(data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showStatusMessage('Error updating profile', 'error');
        }
    }

    // File upload methods
    showUploadModal() {
        this.uploadModal.classList.add('show');
        this.resetUploadModal();
    }

    hideUploadModal() {
        this.uploadModal.classList.remove('show');
    }

    resetUploadModal() {
        this.fileInput.value = '';
        this.uploadProgress.classList.add('hidden');
        this.updateUploadButton();
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        this.fileInput.files = e.dataTransfer.files;
        this.updateUploadButton();
    }

    handleFileSelect(e) {
        this.updateUploadButton();
    }

    updateUploadButton() {
        const uploadBtn = document.getElementById('uploadSubmitBtn');
        const fileCount = this.fileInput.files.length;
        
        if (fileCount > 0) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = `Upload ${fileCount} File${fileCount !== 1 ? 's' : ''}`;
        } else {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Upload Selected Files';
        }
    }

    async handleFileUpload() {
        const files = Array.from(this.fileInput.files);
        
        if (files.length === 0) {
            this.showStatusMessage('Please select files to upload', 'error');
            return;
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        this.uploadProgress.classList.remove('hidden');
        const progressFill = this.uploadProgress.querySelector('.progress-fill');
        const progressText = this.uploadProgress.querySelector('.progress-text');

        try {
            const response = await fetch(`/api/competitors/${this.competitorId}/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                progressFill.style.width = '100%';
                progressText.textContent = 'Upload complete!';
                
                setTimeout(() => {
                    this.hideUploadModal();
                    this.showStatusMessage('Files uploaded successfully!', 'success');
                    this.loadCompetitor(); // Reload to show new files
                }, 1000);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showStatusMessage(`Upload failed: ${error.message}`, 'error');
            this.uploadProgress.classList.add('hidden');
        }
    }

    // Delete competitor methods
    showDeleteModal() {
        document.getElementById('deleteCompetitorName').textContent = this.competitor.full_name;
        document.getElementById('deleteCompetitorEmail').textContent = this.competitor.email;
        this.deleteModal.classList.add('show');
    }

    hideDeleteModal() {
        this.deleteModal.classList.remove('show');
    }

    async handleDeleteCompetitor() {
        try {
            const response = await fetch(`/api/competitors/${this.competitorId}`, {
                method: 'DELETE',
                headers: {
                    'competitor-admin-key': this.competitorAdminKey
                }
            });

            if (response.ok) {
                this.showStatusMessage('Competitor deleted successfully', 'success');
                setTimeout(() => window.location.href = '/competitors', 1500);
            } else if (response.status === 401) {
                this.logout();
                return;
            } else {
                const data = await response.json();
                this.showStatusMessage(data.error || 'Failed to delete competitor', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showStatusMessage('Error deleting competitor', 'error');
        } finally {
            this.hideDeleteModal();
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

// Initialize the profile when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CompetitorProfile();
});
