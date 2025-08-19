const path = require('path');
const fs = require('fs');
const { generateCalendarLinks, generateCalendarInviteHTML } = require('./calendar-generator');

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
        venue = 'The Midway SF'
    } = ticketData;

    // Generate calendar links
    const calendarLinks = generateCalendarLinks(ticketData);
    const calendarHTML = generateCalendarInviteHTML(calendarLinks);

    // Try PNG first (better email client compatibility), fallback to WebP
    const pngLogoPath = path.join(__dirname, 'Style=outline.png');
    const webpLogoPath = path.join(__dirname, 'Amp_mark_outline.webp');
    let ampLogoBase64 = '';

    try {
        console.log('Looking for PNG logo at:', pngLogoPath);
        console.log('PNG file exists:', fs.existsSync(pngLogoPath));
        
        if (fs.existsSync(pngLogoPath)) {
            const logoBuffer = fs.readFileSync(pngLogoPath);
            ampLogoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            console.log('PNG logo loaded successfully, size:', logoBuffer.length, 'bytes');
        } else {
            console.log('Looking for WebP logo at:', webpLogoPath);
            console.log('WebP file exists:', fs.existsSync(webpLogoPath));
            
            if (fs.existsSync(webpLogoPath)) {
                const logoBuffer = fs.readFileSync(webpLogoPath);
                ampLogoBase64 = `data:image/webp;base64,${logoBuffer.toString('base64')}`;
                console.log('WebP logo loaded as fallback, size:', logoBuffer.length, 'bytes');
            } else {
                console.error('No logo files found for email template');
                console.log('Directory contents:', fs.readdirSync(__dirname).filter(f => f.includes('mp') || f.includes('tyle')));
            }
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
        }
        
        .header {
            background: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
        }
        
        .header h1 {
            color: #1a1a1a;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666666;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
            background: #ffffff;
        }
        
        .greeting {
            font-size: 18px;
            margin-bottom: 25px;
            color: #1a1a1a;
        }
        
        .ticket-info {
            background: #ffffff;
            border: 2px solid #e0e0e0;
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
            border-bottom: 1px solid #e0e0e0;
        }
        
        .ticket-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .ticket-label {
            font-weight: 600;
            color: #1a1a1a;
        }
        
        .ticket-value {
            color: #1a1a1a;
        }
        
        .ticket-code {
            font-family: 'Courier New', monospace;
            font-size: 20px;
            background: #f5f5f5;
            padding: 10px 15px;
            border-radius: 4px;
            letter-spacing: 2px;
            color: #1a1a1a;
            border: 1px solid #e0e0e0;
        }
        

        
        .cta-button {
            display: inline-block;
            background: #ffffff !important;
            color: #1a1a1a !important;
            border: 2px solid #e0e0e0;
            padding: 15px 30px;
            text-decoration: none !important;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .footer {
            background: #f9f9f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        
        .footer p {
            color: #666666;
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
                <p>Hello!</p>
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
            

            
            ${calendarHTML}
            

            
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

    // Try PNG first (better email client compatibility), fallback to WebP
    const pngLogoPath = path.join(__dirname, 'Style=outline.png');
    const webpLogoPath = path.join(__dirname, 'Amp_mark_outline.webp');
    let ampLogoBase64 = '';

    try {
        if (fs.existsSync(pngLogoPath)) {
            const logoBuffer = fs.readFileSync(pngLogoPath);
            ampLogoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            console.log('Using PNG logo for better email client compatibility (retrieval)');
        } else if (fs.existsSync(webpLogoPath)) {
            const logoBuffer = fs.readFileSync(webpLogoPath);
            ampLogoBase64 = `data:image/webp;base64,${logoBuffer.toString('base64')}`;
            console.log('Using WebP logo as fallback (retrieval)');
        } else {
            console.error('No logo files found for email template (retrieval)');
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
        }
        
        .header {
            background: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
        }
        
        .header h1 {
            color: #1a1a1a;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666666;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
            background: #ffffff;
        }
        
        .content h2 {
            color: #1a1a1a;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .ticket-item {
            background: #ffffff;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .ticket-item h4 {
            color: #1a1a1a;
            margin-bottom: 10px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 600;
        }
        
        .ticket-item p {
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        
        .footer {
            background: #f9f9f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        
        .footer p {
            color: #666666;
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
