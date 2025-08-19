const path = require('path');
const fs = require('fs');

/**
 * Generate ticket email template with Amp branding
 */
function generateTicketEmailTemplate(ticketData) {
    const {
        email,
        ticketCode,
        ticketType = 'General Admission',
        price = 20,
        eventDate = 'October 29th, 2025',
        venue = 'The Midway SF',
        qrCodeBase64
    } = ticketData;

    const ampLogoPath = path.join(__dirname, 'Amp_mark_white.webp');
    let ampLogoBase64 = '';
    
    try {
        if (fs.existsSync(ampLogoPath)) {
            const logoBuffer = fs.readFileSync(ampLogoPath);
            ampLogoBase64 = `data:image/webp;base64,${logoBuffer.toString('base64')}`;
        }
    } catch (error) {
        console.error('Error loading Amp logo:', error);
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Amp Arena Ticket</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background-color: #0a0a0a;
            color: #ffffff;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 255, 136, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
        }
        
        .header h1 {
            color: #000;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #000;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            margin-bottom: 25px;
        }
        
        .ticket-info {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }
        
        .ticket-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .ticket-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .ticket-label {
            font-weight: bold;
            color: #00ff88;
        }
        
        .ticket-value {
            color: #ffffff;
        }
        
        .ticket-code {
            font-family: 'Courier New', monospace;
            font-size: 20px;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 15px;
            border-radius: 4px;
            letter-spacing: 2px;
        }
        
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 25px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .qr-code {
            width: 200px;
            height: 200px;
            margin: 15px auto;
            background: white;
            padding: 10px;
            border-radius: 8px;
        }
        
        .important-info {
            background: rgba(255, 193, 7, 0.1);
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 25px 0;
        }
        
        .important-info h3 {
            color: #ffc107;
            margin-bottom: 10px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #000;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        
        .footer {
            background: #0a0a0a;
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .footer p {
            color: #888;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        @media (max-width: 600px) {
            .content {
                padding: 20px;
            }
            
            .ticket-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
            }
            
            .qr-code {
                width: 150px;
                height: 150px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            ${ampLogoBase64 ? `<img src="${ampLogoBase64}" alt="Amp Logo" class="logo">` : ''}
            <h1>AMP ARENA</h1>
            <p>Your ticket is ready!</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                <p>Hello! 👋</p>
                <p>Welcome to Amp Arena! Your ticket has been confirmed and is ready for the event.</p>
            </div>
            
            <div class="ticket-info">
                <div class="ticket-row">
                    <span class="ticket-label">Event:</span>
                    <span class="ticket-value">Amp Arena</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Date:</span>
                    <span class="ticket-value">${eventDate}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Venue:</span>
                    <span class="ticket-value">${venue}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Time:</span>
                    <span class="ticket-value">TBD (Updates coming soon)</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Ticket Type:</span>
                    <span class="ticket-value">${ticketType}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Price:</span>
                    <span class="ticket-value">$${price}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Ticket Code:</span>
                    <span class="ticket-value ticket-code">${ticketCode}</span>
                </div>
            </div>
            
            ${qrCodeBase64 ? `
            <div class="qr-section">
                <h3>Your QR Code</h3>
                <p>Present this QR code at the venue for quick entry:</p>
                <img src="data:image/png;base64,${qrCodeBase64}" alt="Ticket QR Code" class="qr-code">
                <p><small>Save this email or take a screenshot for backup</small></p>
            </div>
            ` : ''}
            
            <div class="important-info">
                <h3>⚠️ Important Information</h3>
                <ul>
                    <li>Arrive early - doors open 30 minutes before start time</li>
                    <li>Bring a valid ID that matches your ticket registration</li>
                    <li>This ticket is non-transferable and non-refundable</li>
                    <li>Keep this email or screenshot the QR code for entry</li>
                    <li>Event details and time will be updated via email</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <p>Need to access your ticket again?</p>
                <a href="mailto:tickets@amparena.com?subject=Ticket Retrieval - ${ticketCode}" class="cta-button">
                    Contact Support
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>Amp Arena - Where Code Meets Competition</p>
            <p>Questions? Reply to this email or contact us at tickets@amparena.com</p>
            <p><small>© 2025 Amp Arena. All rights reserved.</small></p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Generate ticket retrieval email template
 */
function generateTicketRetrievalTemplate(ticketData) {
    const {
        email,
        tickets,
        requestTime = new Date().toLocaleString()
    } = ticketData;

    const ampLogoPath = path.join(__dirname, 'Amp_mark_white.webp');
    let ampLogoBase64 = '';
    
    try {
        if (fs.existsSync(ampLogoPath)) {
            const logoBuffer = fs.readFileSync(ampLogoPath);
            ampLogoBase64 = `data:image/webp;base64,${logoBuffer.toString('base64')}`;
        }
    } catch (error) {
        console.error('Error loading Amp logo:', error);
    }

    const ticketsList = tickets.map(ticket => `
        <div class="ticket-item">
            <h4>Ticket Code: ${ticket.ticketCode}</h4>
            <p><strong>Type:</strong> ${ticket.ticketType || 'General Admission'}</p>
            <p><strong>Price:</strong> $${ticket.price || 20}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Amp Arena Tickets</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background-color: #0a0a0a;
            color: #ffffff;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 255, 136, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
        }
        
        .header h1 {
            color: #000;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .ticket-item {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .ticket-item h4 {
            color: #00ff88;
            margin-bottom: 10px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
        }
        
        .footer {
            background: #0a0a0a;
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .footer p {
            color: #888;
            font-size: 14px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            ${ampLogoBase64 ? `<img src="${ampLogoBase64}" alt="Amp Logo" class="logo">` : ''}
            <h1>AMP ARENA</h1>
            <p>Your tickets retrieved</p>
        </div>
        
        <div class="content">
            <h2>Here are your Amp Arena tickets:</h2>
            <p>Requested at: ${requestTime}</p>
            
            ${ticketsList}
            
            <p><strong>Event Details:</strong></p>
            <ul>
                <li>Date: October 29th, 2025</li>
                <li>Venue: The Midway SF</li>
                <li>Time: TBD (Updates coming soon)</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Amp Arena - Where Code Meets Competition</p>
            <p>Questions? Reply to this email or contact us at tickets@amparena.com</p>
        </div>
    </div>
</body>
</html>
    `;
}

module.exports = {
    generateTicketEmailTemplate,
    generateTicketRetrievalTemplate
};
