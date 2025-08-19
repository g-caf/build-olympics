const nodemailer = require('nodemailer');
require('dotenv').config();

async function testProductionEmail() {
    console.log('Testing production email configuration...');
    
    // Test environment variables
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST ? 'SET' : 'NOT SET');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'DEFAULT (587)');
    console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'DEFAULT (false)');
    console.log('NOTIFY_EMAIL:', process.env.NOTIFY_EMAIL ? 'SET' : 'NOT SET');
    
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Missing required email environment variables');
        return;
    }
    
    // Create transporter with same config as server
    const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    try {
        // Test connection
        console.log('Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful');
        
        // Send test email
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'adrienne@sourcegraph.com',
            subject: '🧪 Production Email Test - Build Olympics',
            html: `
                <h2>Production Email Test</h2>
                <p>This is a test email sent from the production environment.</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <p><strong>Environment:</strong> Production (Render)</p>
                <p>If you receive this email, the email system is working correctly!</p>
            `
        });
        
        console.log('✅ Test email sent successfully');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        
    } catch (error) {
        console.error('❌ Email test failed:', error);
        console.error('Error details:', error.message);
    }
}

// Test via production API call
async function testProductionAPI() {
    console.log('\n--- Testing Production API ---');
    
    try {
        const response = await fetch('https://build-olympics-landing-page.onrender.com/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test-production@sourcegraph.com'
            })
        });
        
        const result = await response.json();
        console.log('API Response Status:', response.status);
        console.log('API Response:', result);
        
    } catch (error) {
        console.error('API Test Error:', error.message);
    }
}

testProductionEmail().then(() => {
    console.log('\n--- Email Test Complete ---');
    return testProductionAPI();
}).then(() => {
    console.log('\n--- All Tests Complete ---');
    process.exit(0);
}).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
