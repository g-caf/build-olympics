const https = require('https');

console.log('🔍 Debugging Production Deployment...\n');

async function testEndpoints() {
    const baseUrl = 'https://build-olympics-landing-page.onrender.com';
    
    const endpoints = [
        '/',
        '/api/count',
        '/api/tickets/count',
        '/api/tickets/adrienne@sourcegraph.com',
        '/health',
        '/status'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${baseUrl}${endpoint}`);
            
            const response = await fetch(`${baseUrl}${endpoint}`);
            const text = await response.text();
            
            console.log(`  Status: ${response.status}`);
            console.log(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
            console.log(`  Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
            console.log('');
            
        } catch (error) {
            console.log(`  ERROR: ${error.message}\n`);
        }
    }
}

async function checkRenderDeploymentStatus() {
    console.log('📊 Checking Render deployment status...\n');
    
    // Try to determine if this is a deployment issue
    try {
        const response = await fetch('https://build-olympics-landing-page.onrender.com/', {
            method: 'HEAD'
        });
        
        const headers = Object.fromEntries(response.headers.entries());
        
        console.log('Response Headers Analysis:');
        console.log(`- Status: ${response.status}`);
        console.log(`- Server: ${headers.server || 'unknown'}`);
        console.log(`- X-Render-Routing: ${headers['x-render-routing'] || 'unknown'}`);
        console.log(`- Content-Type: ${headers['content-type'] || 'unknown'}`);
        
        if (headers['x-render-routing'] === 'no-server') {
            console.log('\n❌ CRITICAL: Render shows "no-server" - App is not running!');
            console.log('This means:');
            console.log('1. The app failed to start during deployment');
            console.log('2. There\'s an error in the start command');
            console.log('3. The app crashed after starting');
            console.log('4. Port binding issues');
        }
        
    } catch (error) {
        console.log('❌ Failed to check deployment status:', error.message);
    }
}

async function suggestDebuggingSteps() {
    console.log('\n🛠️  DEBUGGING RECOMMENDATIONS:\n');
    
    console.log('1. CHECK RENDER LOGS:');
    console.log('   - Go to Render dashboard');
    console.log('   - Check deployment logs for errors');
    console.log('   - Look for startup failures\n');
    
    console.log('2. VERIFY START COMMAND:');
    console.log('   - Ensure package.json has "start": "node server.js"');
    console.log('   - Check if server.js exists and is correct\n');
    
    console.log('3. CHECK PORT BINDING:');
    console.log('   - Server should listen on process.env.PORT');
    console.log('   - Currently configured for PORT || 3000\n');
    
    console.log('4. ENVIRONMENT VARIABLES:');
    console.log('   - Verify all email env vars are set in Render');
    console.log('   - Check database path for SQLite\n');
    
    console.log('5. BUILD PROCESS:');
    console.log('   - Check if npm install completed successfully');
    console.log('   - Verify all dependencies are in package.json\n');
}

// Run all diagnostics
(async () => {
    await checkRenderDeploymentStatus();
    await testEndpoints();
    await suggestDebuggingSteps();
    
    console.log('🔍 Debug complete. Check Render dashboard for deployment logs.');
})();
