const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

/**
 * Generate PDF ticket with Amp branding
 */
async function generateTicketPDF(ticketData) {
    const {
        email,
        ticketCode,
        ticketType = 'General Admission',
        price = 20,
        eventDate = 'October 29th, 2025',
        venue = 'The Midway SF'
    } = ticketData;

    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Colors
            const ampGreen = '#00ff88';
            const darkBg = '#1a1a1a';
            const white = '#ffffff';

            // Background
            doc.rect(0, 0, doc.page.width, doc.page.height)
               .fill(darkBg);

            // Header with Amp branding
            doc.rect(0, 0, doc.page.width, 120)
               .fill(ampGreen);

            // Try to add Amp logo
            const logoPath = path.join(__dirname, 'Amp_mark_white.webp');
            try {
                if (fs.existsSync(logoPath)) {
                    // Note: PDFKit doesn't support WebP directly
                    // In production, you'd want to convert to PNG/JPEG
                    console.log('Logo found but WebP not supported in PDFKit - consider converting to PNG');
                }
            } catch (error) {
                console.error('Logo loading error:', error);
            }

            // Title
            doc.fontSize(32)
               .fillColor('#000000')
               .text('AMP ARENA', 70, 35, {
                   width: doc.page.width - 140,
                   align: 'center'
               });

            doc.fontSize(16)
               .text('ADMISSION TICKET', 70, 75, {
                   width: doc.page.width - 140,
                   align: 'center'
               });

            // Main ticket content
            doc.fillColor(white);
            
            // Event title
            doc.fontSize(24)
               .text('Amp Arena', 70, 160, {
                   width: doc.page.width - 140,
                   align: 'center'
               });

            // Ticket details box
            const detailsY = 220;
            const boxHeight = 280;
            
            doc.rect(70, detailsY, doc.page.width - 140, boxHeight)
               .strokeColor(ampGreen)
               .lineWidth(2)
               .stroke();

            // Ticket details
            let currentY = detailsY + 30;
            const lineHeight = 35;

            const details = [
                ['Date:', eventDate],
                ['Venue:', venue],
                ['Time:', 'TBD (Updates coming soon)'],
                ['Ticket Type:', ticketType],
                ['Price:', `$${price}`],
                ['Email:', email]
            ];

            details.forEach(([label, value]) => {
                doc.fontSize(14)
                   .fillColor(ampGreen)
                   .text(label, 90, currentY, { width: 120 });
                
                doc.fillColor(white)
                   .text(value, 220, currentY, { width: 280 });
                
                currentY += lineHeight;
            });

            // Ticket code (prominent)
            currentY += 20;
            doc.rect(90, currentY - 10, doc.page.width - 180, 50)
               .fill('rgba(0, 255, 136, 0.1)')
               .strokeColor(ampGreen)
               .lineWidth(1)
               .stroke();

            doc.fontSize(18)
               .fillColor(ampGreen)
               .text('TICKET CODE:', 90, currentY + 5);

            doc.fontSize(20)
               .font('Courier')
               .fillColor(white)
               .text(ticketCode, 220, currentY + 5, {
                   width: 250,
                   letterSpacing: 2
               });

            // Generate QR Code
            try {
                const qrCodeDataURL = await QRCode.toDataURL(ticketCode, {
                    width: 150,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                // Convert data URL to buffer
                const qrBase64 = qrCodeDataURL.split(',')[1];
                const qrBuffer = Buffer.from(qrBase64, 'base64');

                // Add QR code to PDF
                const qrSize = 120;
                const qrX = doc.page.width - 150;
                const qrY = detailsY + 150;

                // White background for QR code
                doc.rect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
                   .fill(white);

                doc.image(qrBuffer, qrX, qrY, {
                    width: qrSize,
                    height: qrSize
                });

                doc.fontSize(12)
                   .fillColor(white)
                   .text('Scan at venue', qrX - 5, qrY + qrSize + 15, {
                       width: qrSize + 10,
                       align: 'center'
                   });

            } catch (qrError) {
                console.error('QR code generation error:', qrError);
                
                // Fallback - just show text
                doc.fontSize(12)
                   .fillColor(white)
                   .text('Present ticket code\nat venue entrance', 
                         doc.page.width - 150, detailsY + 200, {
                             width: 120,
                             align: 'center'
                         });
            }

            // Important notes
            const notesY = detailsY + boxHeight + 30;
            
            doc.fontSize(16)
               .fillColor(ampGreen)
               .text('Important Information:', 70, notesY);

            doc.fontSize(11)
               .fillColor(white)
               .text('• Arrive early - doors open 30 minutes before start time', 70, notesY + 30)
               .text('• Bring valid ID matching your ticket registration', 70, notesY + 50)
               .text('• This ticket is non-transferable and non-refundable', 70, notesY + 70)
               .text('• Keep this ticket or email QR code for entry', 70, notesY + 90)
               .text('• Event time will be updated via email', 70, notesY + 110);

            // Footer
            const footerY = doc.page.height - 80;
            doc.rect(0, footerY, doc.page.width, 80)
               .fill(darkBg);

            doc.fontSize(12)
               .fillColor('#888888')
               .text('Amp Arena - Where Code Meets Competition', 70, footerY + 20, {
                   width: doc.page.width - 140,
                   align: 'center'
               });

            doc.text('Questions? Contact tickets@amparena.com', 70, footerY + 40, {
                width: doc.page.width - 140,
                align: 'center'
            });

            doc.fontSize(10)
               .text('© 2025 Amp Arena. All rights reserved.', 70, footerY + 60, {
                   width: doc.page.width - 140,
                   align: 'center'
               });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateTicketPDF
};
