// Competitor Profile JavaScript - Clean Version (No Authentication)
class CompetitorProfile {
    constructor() {
        this.competitorId = this.getCompetitorIdFromURL();
        this.competitor = null;
        this.isEditing = false;

        this.initializeElements();
        this.attachEventListeners();
        this.loadCompetitor();
    }

    initializeElements() {
        // Profile elements
        this.competitorPhoto = document.getElementById('competitorPhoto');
        this.photoPlaceholder = document.getElementById('photoPlaceholder');
        this.competitorName = document.getElementById('competitorName');
        this.competitorEmail = document.getElementById('competitorEmail');
        this.competitorStatus = document.getElementById('competitorStatus');
        this.competitorJoined = document.getElementById('competitorJoined');
        this.competitorUpdated = document.getElementById('competitorUpdated');
        this.competitorBio = document.getElementById('competitorBio');
        this.githubLink = document.getElementById('githubLink');
        this.twitterLink = document.getElementById('twitterLink');
        this.socialLinks = document.getElementById('socialLinks');

        // Edit elements
        this.editSection = document.getElementById('editSection');
        this.editProfileForm = document.getElementById('editProfileForm');
        this.editToggleBtn = document.getElementById('editToggleBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');

        // Form inputs
        this.editName = document.getElementById('editName');
        this.editEmail = document.getElementById('editEmail');
        this.editGithub = document.getElementById('editGithub');
        this.editTwitter = document.getElementById('editTwitter');
        this.editPhoto = document.getElementById('editPhoto');
        this.editStatus = document.getElementById('editStatus');
        this.editBio = document.getElementById('editBio');

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
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Status messages
        this.statusMessage = document.getElementById('statusMessage');
    }

    attachEventListeners() {
        // Edit functionality
        this.editToggleBtn?.addEventListener('click', () => this.toggleEdit());
        this.cancelEditBtn?.addEventListener('click', () => this.cancelEdit());
        this.editProfileForm?.addEventListener('submit', (e) => this.handleProfileSave(e));

        // Upload functionality
        this.uploadBtn?.addEventListener('click', () => this.openUploadModal());
        this.uploadArea?.addEventListener('click', () => this.fileInput.click());
        this.uploadArea?.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea?.addEventListener('drop', (e) => this.handleFileDrop(e));
        this.fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));

        // Modal controls
        this.setupModalControls();

        // Delete functionality
        this.deleteCompetitorBtn?.addEventListener('click', () => this.openDeleteModal());
        this.confirmDeleteBtn?.addEventListener('click', () => this.deleteCompetitor());
    }

    setupModalControls() {
        // Upload modal
        document.getElementById('closeUploadModalBtn')?.addEventListener('click', () => this.closeUploadModal());
        document.getElementById('cancelUploadBtn')?.addEventListener('click', () => this.closeUploadModal());
        document.getElementById('uploadSubmitBtn')?.addEventListener('click', () => this.submitFiles());

        // Delete modal
        document.getElementById('closeDeleteModalBtn')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => this.closeDeleteModal());

        // Close modals on outside click
        [this.uploadModal, this.deleteModal].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeUploadModal();
                    this.closeDeleteModal();
                }
            });
        });
    }

    getCompetitorIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadCompetitor() {
        if (!this.competitorId) {
            this.showMessage('No competitor ID provided', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/competitors/${this.competitorId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.competitor = data.competitor;
            this.displayCompetitor();
            this.loadSubmissions();
        } catch (error) {
            console.error('Error loading competitor:', error);
            this.showMessage('Failed to load competitor profile', 'error');
        }
    }

    displayCompetitor() {
        if (!this.competitor) return;

        // Basic info
        this.competitorName.textContent = this.competitor.full_name || 'Unknown';
        this.competitorEmail.textContent = this.competitor.email || 'No email';
        
        // Status
        this.competitorStatus.textContent = this.competitor.status || 'pending';
        this.competitorStatus.className = `status-badge ${this.competitor.status || 'pending'}`;

        // Photo
        if (this.competitor.profile_photo_url) {
            this.competitorPhoto.src = this.competitor.profile_photo_url;
            this.competitorPhoto.classList.remove('hidden');
            this.photoPlaceholder.classList.add('hidden');
        } else {
            this.competitorPhoto.classList.add('hidden');
            this.photoPlaceholder.classList.remove('hidden');
        }

        // Social links
        this.updateSocialLinks();

        // Dates
        if (this.competitor.created_at) {
            this.competitorJoined.textContent = new Date(this.competitor.created_at).toLocaleDateString();
        }
        if (this.competitor.updated_at) {
            this.competitorUpdated.textContent = new Date(this.competitor.updated_at).toLocaleDateString();
        }

        // Bio
        this.displayBio();
    }

    updateSocialLinks() {
        // GitHub
        if (this.competitor.github_username) {
            this.githubLink.href = `https://github.com/${this.competitor.github_username}`;
            this.githubLink.classList.remove('hidden');
        } else {
            this.githubLink.classList.add('hidden');
        }

        // Twitter
        if (this.competitor.twitter_username) {
            this.twitterLink.href = `https://twitter.com/${this.competitor.twitter_username}`;
            this.twitterLink.classList.remove('hidden');
        } else {
            this.twitterLink.classList.add('hidden');
        }
    }

    displayBio() {
        if (this.competitor.bio && this.competitor.bio.trim()) {
            this.competitorBio.innerHTML = `<p>${this.competitor.bio.replace(/\n/g, '</p><p>')}</p>`;
        } else {
            this.competitorBio.innerHTML = '<p class="empty-bio">No bio available</p>';
        }
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
        
        if (this.isEditing) {
            this.populateEditForm();
            this.editSection.classList.remove('hidden');
            this.editToggleBtn.textContent = 'Cancel Edit';
        } else {
            this.editSection.classList.add('hidden');
            this.editToggleBtn.textContent = 'Edit Profile';
        }
    }

    cancelEdit() {
        this.isEditing = false;
        this.editSection.classList.add('hidden');
        this.editToggleBtn.textContent = 'Edit Profile';
    }

    populateEditForm() {
        if (!this.competitor) return;

        this.editName.value = this.competitor.full_name || '';
        this.editEmail.value = this.competitor.email || '';
        this.editGithub.value = this.competitor.github_username || '';
        this.editTwitter.value = this.competitor.twitter_username || '';
        this.editPhoto.value = this.competitor.profile_photo_url || '';
        this.editStatus.value = this.competitor.status || 'pending';
        this.editBio.value = this.competitor.bio || '';
    }

    async handleProfileSave(e) {
        e.preventDefault();
        
        const formData = new FormData(this.editProfileForm);
        const updates = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/api/competitors/${this.competitorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.competitor = data.competitor;
            this.displayCompetitor();
            this.cancelEdit();
            this.showMessage('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating competitor:', error);
            this.showMessage('Failed to update profile', 'error');
        }
    }

    async loadSubmissions() {
        try {
            const response = await fetch(`/api/competitors/${this.competitorId}/files`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.displaySubmissions(data.files || []);
        } catch (error) {
            console.error('Error loading submissions:', error);
        }
    }

    displaySubmissions(files) {
        if (!files.length) {
            this.submissionsList.innerHTML = '<div class="empty-submissions"><p>No files submitted yet</p></div>';
            return;
        }

        const filesHtml = files.map(file => `
            <div class="submission-item">
                <div class="file-info">
                    <span class="file-name">${file.original_name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <span class="file-date">${new Date(file.uploaded_at).toLocaleDateString()}</span>
                </div>
                <div class="file-actions">
                    <a href="/uploads/${file.file_path}" download class="download-btn">Download</a>
                    <button onclick="competitorProfile.deleteFile('${file.id}')" class="delete-file-btn">Delete</button>
                </div>
            </div>
        `).join('');

        this.submissionsList.innerHTML = filesHtml;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Upload functionality
    openUploadModal() {
        this.uploadModal.classList.add('show');
    }

    closeUploadModal() {
        this.uploadModal.classList.remove('show');
        this.resetUploadForm();
    }

    resetUploadForm() {
        this.fileInput.value = '';
        this.uploadProgress.classList.add('hidden');
        this.uploadArea.classList.remove('dragover');
        document.getElementById('uploadSubmitBtn').disabled = true;
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        this.handleFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        if (files.length > 0) {
            document.getElementById('uploadSubmitBtn').disabled = false;
        }
    }

    async submitFiles() {
        const files = this.fileInput.files;
        if (!files.length) return;

        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        this.uploadProgress.classList.remove('hidden');

        try {
            const response = await fetch(`/api/competitors/${this.competitorId}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.showMessage('Files uploaded successfully', 'success');
            this.loadSubmissions();
            this.closeUploadModal();
        } catch (error) {
            console.error('Error uploading files:', error);
            this.showMessage('Failed to upload files', 'error');
        }
    }

    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const response = await fetch(`/api/competitors/files/${fileId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.showMessage('File deleted successfully', 'success');
            this.loadSubmissions();
        } catch (error) {
            console.error('Error deleting file:', error);
            this.showMessage('Failed to delete file', 'error');
        }
    }

    // Delete competitor functionality
    openDeleteModal() {
        if (this.competitor) {
            document.getElementById('deleteCompetitorName').textContent = this.competitor.full_name || 'Unknown';
            document.getElementById('deleteCompetitorEmail').textContent = this.competitor.email || 'Unknown';
        }
        this.deleteModal.classList.add('show');
    }

    closeDeleteModal() {
        this.deleteModal.classList.remove('show');
    }

    async deleteCompetitor() {
        try {
            const response = await fetch(`/api/competitors/${this.competitorId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.showMessage('Competitor deleted successfully', 'success');
            // Redirect to competitors list after a delay
            setTimeout(() => {
                window.location.href = '/competitors';
            }, 2000);
        } catch (error) {
            console.error('Error deleting competitor:', error);
            this.showMessage('Failed to delete competitor', 'error');
        }
    }

    showMessage(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type} show`;
        
        setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 5000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.competitorProfile = new CompetitorProfile();
});
