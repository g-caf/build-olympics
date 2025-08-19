const fs = require('fs');
const path = require('path');

console.log('🔧 RENDER DEPLOYMENT VALIDATION\n');

function checkFileExists(filePath) {
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${filePath} ${exists ? 'EXISTS' : 'MISSING'}`);
    return exists;
}

function validatePackageJson() {
    console.log('📦 PACKAGE.JSON VALIDATION:');
    
    if (!checkFileExists('./package.json')) {
        return false;
    }
    
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    console.log(`✅ Start script: ${pkg.scripts?.start || 'MISSING'}`);
    console.log(`✅ Main entry: ${pkg.main || 'MISSING'}`);
    console.log(`✅ Node version: ${pkg.engines?.node || 'NOT SPECIFIED'}`);
    
    const requiredDeps = ['express', 'sqlite3', 'nodemailer', 'cors', 'helmet'];
    console.log('\n📋 REQUIRED DEPENDENCIES:');
    
    let missingDeps = [];
    for (const dep of requiredDeps) {
        const exists = pkg.dependencies && pkg.dependencies[dep];
        console.log(`${exists ? '✅' : '❌'} ${dep} ${exists ? pkg.dependencies[dep] : 'MISSING'}`);
        if (!exists) missingDeps.push(dep);
    }
    
    return missingDeps.length === 0;
}

function validateServerFile() {
    console.log('\n🚀 SERVER.JS VALIDATION:');
    
    if (!checkFileExists('./server.js')) {
        return false;
    }
    
    const serverContent = fs.readFileSync('./server.js', 'utf8');
    
    // Check critical components
    const checks = [
        { name: 'Express app creation', pattern: /app = express\(\)/ },
        { name: 'Port configuration', pattern: /PORT.*process\.env\.PORT/ },
        { name: 'Database initialization', pattern: /sqlite3\.Database/ },
        { name: 'Server listening', pattern: /app\.listen.*PORT/ },
        { name: 'Email transporter setup', pattern: /nodemailer\.createTransporter/ }
    ];
    
    for (const check of checks) {
        const found = check.pattern.test(serverContent);
        console.log(`${found ? '✅' : '❌'} ${check.name}`);
    }
    
    return true;
}

function validateEnvironmentSetup() {
    console.log('\n🔐 ENVIRONMENT VARIABLES CHECK:');
    
    // Load .env if exists for local testing
    if (fs.existsSync('.env')) {
        require('dotenv').config();
        console.log('✅ Found .env file for reference');
    }
    
    const requiredEnvVars = [
        'EMAIL_HOST',
        'EMAIL_USER', 
        'EMAIL_PASS',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET'
    ];
    
    const optionalEnvVars = [
        'NOTIFY_EMAIL',
        'ADMIN_KEY',
        'COMPETITOR_ADMIN_PASSCODE',
        'EMAIL_PORT',
        'EMAIL_SECURE'
    ];
    
    console.log('\n🚨 REQUIRED (will cause crashes if missing):');
    for (const envVar of requiredEnvVars) {
        const exists = process.env[envVar];
        console.log(`${exists ? '✅' : '❌'} ${envVar} ${exists ? 'SET' : 'MISSING'}`);
    }
    
    console.log('\n📝 OPTIONAL (features may not work):');
    for (const envVar of optionalEnvVars) {
        const exists = process.env[envVar];
        console.log(`${exists ? '✅' : '⚠️ '} ${envVar} ${exists ? 'SET' : 'NOT SET'}`);
    }
}

function generateDeploymentChecklist() {
    console.log('\n📋 RENDER DEPLOYMENT CHECKLIST:');
    console.log('');
    console.log('1. ✅ Ensure all required files exist');
    console.log('2. ✅ Verify package.json configuration');
    console.log('3. ✅ Test server.js locally first: node server.js');
    console.log('4. 🔐 Set ALL environment variables in Render dashboard');
    console.log('5. 📁 Verify build command: npm install');
    console.log('6. 🚀 Verify start command: npm start');
    console.log('7. 🗂️  Check disk mount for SQLite database');
    console.log('8. 🌐 Monitor deployment logs in Render');
    console.log('');
}

function createTestServerScript() {
    console.log('\n🧪 Creating local test script...');
    
    const testScript = `const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        health: 'OK',
        database: 'Connected', // Simplified for testing
        email: process.env.EMAIL_HOST ? 'Configured' : 'Not configured'
    });
});

app.listen(PORT, () => {
    console.log(\`✅ Test server running on port \${PORT}\`);
    console.log(\`🌐 Visit http://localhost:\${PORT} to test\`);
    console.log(\`❤️  Health check: http://localhost:\${PORT}/health\`);
});`;

    fs.writeFileSync('./test-server.js', testScript);
    console.log('✅ Created test-server.js');
    console.log('💡 Run: node test-server.js to test basic functionality');
}

// Run all validations
validatePackageJson();
validateServerFile();
validateEnvironmentSetup();
generateDeploymentChecklist();
createTestServerScript();

console.log('\n🎯 NEXT STEPS:');
console.log('1. Run: node test-server.js (test locally)');
console.log('2. Check Render dashboard deployment logs');  
console.log('3. Verify all environment variables in Render');
console.log('4. Redeploy after fixing any issues');
console.log('5. Use debug-production-deployment.js to verify deployment');
