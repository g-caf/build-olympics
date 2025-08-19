const nodemailer = require('nodemailer');
const { sendTicketEmail, generateTicketCode } = require('./ticket-system');
require('dotenv').config();

async function testTicketEmail() {
    console.log('Testing ticket email system...');
    
    // Create test transporter (using same config as server.js)
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email configuration missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env file');
        return;
    }
    
    const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    // Test email configuration
    try {
        await transporter.verify();
        console.log('✓ Email configuration verified');
    } catch (error) {
        console.error('✗ Email configuration error:', error);
        return;
    }
    
    // Generate test ticket data
    const testTicketData = {
        email: 'adrienne@sourcegraph.com',
        ticketCode: generateTicketCode(),
        ticketType: 'General Admission',
        price: 20,
        eventDate: 'October 29th, 2025',
        venue: 'The Midway SF'
    };
    
    console.log('Test ticket data:', testTicketData);
    
    // Send test ticket email
    try {
        const result = await sendTicketEmail(transporter, testTicketData);
        
        if (result.success) {
            console.log('✓ Test ticket email sent successfully!');
            console.log('Message ID:', result.messageId);
            console.log('Response:', result.response);
        } else {
            console.error('✗ Test ticket email failed:', result.error);
        }
        
    } catch (error) {
        console.error('✗ Error sending test ticket email:', error);
    }
}

// Run the test
testTicketEmail().then(() => {
    console.log('Test completed');
}).catch((error) => {
    console.error('Test failed:', error);
});
