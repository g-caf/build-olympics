const QRCode = require('qrcode');
const { generateTicketEmailTemplate, generateTicketRetrievalTemplate } = require('./email-templates');
const { generateTicketPDF } = require('./pdf-generator');
const { generateICSFile } = require('./calendar-generator');

/**
 * Generate unique ticket code
 */
function generateTicketCode() {
    const prefix = 'AMP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate QR code as base64 string
 */
async function generateQRCode(data) {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(data, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        // Return just the base64 part (remove data:image/png;base64,)
        return qrCodeDataURL.split(',')[1];
    } catch (error) {
        console.error('QR code generation error:', error);
        return null;
    }
}

/**
 * Send ticket email with PDF attachment
 */
async function sendTicketEmail(transporter, ticketData) {
    const { email, ticketCode } = ticketData;
    
    try {
        // Generate QR code
        const qrCodeBase64 = await generateQRCode(ticketCode);
        
        // Generate email HTML
        const emailHTML = generateTicketEmailTemplate({
            ...ticketData,
            qrCodeBase64
        });
        
        // Generate PDF ticket
        const pdfBuffer = await generateTicketPDF(ticketData);
        
        // Generate calendar invite
        const icsContent = generateICSFile(ticketData);
        
        // Email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Amp Arena Ticket - Ready for October 29th!',
            html: emailHTML,
            attachments: [
                {
                    filename: `amp-arena-ticket-${ticketCode}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                },
                {
                    filename: 'amp-arena-event.ics',
                    content: icsContent,
                    contentType: 'text/calendar'
                }
            ]
        };
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Ticket email sent successfully:', info.response);
        
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
        
    } catch (error) {
        console.error('Error sending ticket email:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send ticket retrieval email
 */
async function sendTicketRetrievalEmail(transporter, email, tickets) {
    try {
        const emailHTML = generateTicketRetrievalTemplate({
            email,
            tickets,
            requestTime: new Date().toLocaleString()
        });
        
        // Generate PDFs for all tickets
        const attachments = [];
        for (const ticket of tickets) {
            try {
                const pdfBuffer = await generateTicketPDF({
                    email,
                    ticketCode: ticket.ticket_code,
                    ticketType: ticket.ticket_type,
                    price: ticket.price / 100 // Convert from cents
                });
                
                attachments.push({
                    filename: `amp-arena-ticket-${ticket.ticket_code}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                });
            } catch (pdfError) {
                console.error(`Error generating PDF for ticket ${ticket.ticket_code}:`, pdfError);
            }
        }
        
        // Add calendar invite (one per retrieval email)
        if (tickets.length > 0) {
            const icsContent = generateICSFile({ ticketCode: tickets[0].ticket_code });
            attachments.push({
                filename: 'amp-arena-event.ics',
                content: icsContent,
                contentType: 'text/calendar'
            });
        }
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Amp Arena Tickets Retrieved',
            html: emailHTML,
            attachments
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Ticket retrieval email sent successfully:', info.response);
        
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
        
    } catch (error) {
        console.error('Error sending ticket retrieval email:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Process successful payment and send ticket
 */
async function processTicketPurchase(db, transporter, paymentData) {
    const { email, paymentIntentId, ticketType = 'general_admission', price = 2000 } = paymentData;
    
    try {
        // Generate unique ticket code
        const ticketCode = generateTicketCode();
        
        // Save ticket to database
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO tickets (email, ticket_type, price, stripe_payment_intent_id, status, ticket_code) 
                 VALUES (?, ?, ?, ?, 'confirmed', ?)`,
                [email, ticketType, price, paymentIntentId, ticketCode],
                async function(err) {
                    if (err) {
                        console.error('Database error saving ticket:', err);
                        return reject(err);
                    }
                    
                    console.log(`Ticket created: ${ticketCode} for ${email}`);
                    
                    // Send ticket email
                    const emailResult = await sendTicketEmail(transporter, {
                        email,
                        ticketCode,
                        ticketType: ticketType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        price: price / 100 // Convert from cents to dollars
                    });
                    
                    resolve({
                        ticketId: this.lastID,
                        ticketCode,
                        emailSent: emailResult.success,
                        emailError: emailResult.error
                    });
                }
            );
        });
        
    } catch (error) {
        console.error('Error processing ticket purchase:', error);
        throw error;
    }
}

module.exports = {
    generateTicketCode,
    generateQRCode,
    sendTicketEmail,
    sendTicketRetrievalEmail,
    processTicketPurchase
};
