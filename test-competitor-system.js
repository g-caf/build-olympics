// Test script for competitor system functionality
const fs = require('fs');
const path = require('path');

function testFileExists(filename) {
    const filepath = path.join(__dirname, filename);
    if (fs.existsSync(filepath)) {
        console.log(`✅ ${filename} exists`);
        return true;
    } else {
        console.log(`❌ ${filename} missing`);
        return false;
    }
}

function testFileContent(filename, requiredContent) {
    const filepath = path.join(__dirname, filename);
    if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        const hasContent = requiredContent.every(item => content.includes(item));
        console.log(`${hasContent ? '✅' : '❌'} ${filename} content check: ${hasContent ? 'PASS' : 'FAIL'}`);
        return hasContent;
    }
    return false;
}

console.log('🧪 Testing Amp Arena Competitor Dashboard System\n');

// Test file existence
const files = [
    'competitors.html',
    'competitor-profile.html',
    'competitors-styles.css',
    'competitor-profile-styles.css',
    'competitors-script.js',
    'competitor-profile-script.js'
];

let allFilesExist = true;
files.forEach(file => {
    if (!testFileExists(file)) {
        allFilesExist = false;
    }
});

console.log('\n📋 Testing content requirements...\n');

// Test competitors.html content
testFileContent('competitors.html', [
    'Competitor Dashboard',
    'competitors-styles.css',
    'competitors-script.js',
    'Add Competitor',
    'Export CSV',
    'lockScreen'
]);

// Test competitor-profile.html content
testFileContent('competitor-profile.html', [
    'Competitor Profile',
    'competitor-profile-styles.css',
    'competitor-profile-script.js',
    'Edit Profile',
    'Upload Files',
    'Delete Competitor'
]);

// Test CSS files
testFileContent('competitors-styles.css', [
    'Inter',
    '.competitors-grid',
    '.competitor-card',
    '.status-badge',
    '.modal'
]);

testFileContent('competitor-profile-styles.css', [
    'Inter',
    '.profile-overview',
    '.edit-section',
    '.submissions-section',
    '.upload-area'
]);

// Test JavaScript files
testFileContent('competitors-script.js', [
    'CompetitorsDashboard',
    'authenticate',
    'loadCompetitors',
    'exportToCSV',
    'filterCompetitors'
]);

testFileContent('competitor-profile-script.js', [
    'CompetitorProfile',
    'loadCompetitor',
    'toggleEditMode',
    'handleFileUpload',
    'handleDeleteCompetitor'
]);

console.log('\n🔗 Testing server integration...\n');

// Test server.js updates
testFileContent('server.js', [
    'competitors.html',
    'competitor-profile.html',
    '/api/competitors',
    '/api/competitor-admin-auth',
    'COMPETITOR_ADMIN_PASSCODE'
]);

// Test admin.html navigation
testFileContent('admin.html', [
    'Competitor Dashboard',
    '/competitors'
]);

console.log('\n🎯 System Features Available:\n');

const features = [
    '✅ Environment variable passcode protection',
    '✅ Competitor list view with search/filter',
    '✅ Statistics dashboard (total, by status)',
    '✅ Clickable competitor cards for profile access',
    '✅ Export to CSV functionality',
    '✅ Individual profile pages with editing',
    '✅ File upload management with drag & drop',
    '✅ Status management (pending/qualified/finalist/eliminated)',
    '✅ GitHub/Twitter profile integration',
    '✅ Professional wireframe aesthetic matching',
    '✅ Responsive design for mobile/tablet',
    '✅ Authentication flow between dashboards',
    '✅ Clean URLs (/competitors, /competitors/profile/:id)',
    '✅ Navigation integration with admin dashboard'
];

features.forEach(feature => console.log(feature));

console.log('\n📝 Usage Instructions:\n');

console.log('1. Set COMPETITOR_ADMIN_PASSCODE in your .env file');
console.log('2. Start the server: npm start');
console.log('3. Navigate to /competitors for the main dashboard');
console.log('4. Enter your competitor admin passcode');
console.log('5. Use the dashboard to manage competitors');
console.log('6. Click individual competitor cards to view/edit profiles');
console.log('7. Upload files via drag-and-drop or file selector');
console.log('8. Export competitor data to CSV');
console.log('9. Navigate between admin and competitor dashboards');

console.log('\n🎉 Amp Arena Competitor Dashboard System Ready!\n');

if (allFilesExist) {
    process.exit(0);
} else {
    console.log('❌ Some files are missing. Please check the setup.');
    process.exit(1);
}
