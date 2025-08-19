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
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Colors - Clean white design
            const darkText = '#1a1a1a';
            const lightGray = '#f5f5f5';
            const white = '#ffffff';
            const borderGray = '#e0e0e0';

            // Clean white background
            doc.rect(0, 0, doc.page.width, doc.page.height)
               .fill(white);

            // Header with clean styling
            doc.rect(0, 0, doc.page.width, 80)
               .fill(lightGray)
               .strokeColor(borderGray)
               .lineWidth(1)
               .stroke();

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

            // Title - compact header
            doc.fontSize(28)
               .fillColor(darkText)
               .text('AMP ARENA', 50, 25, {
                   width: doc.page.width - 100,
                   align: 'center'
               });

            doc.fontSize(14)
               .fillColor('#666666')
               .text('ADMISSION TICKET', 50, 55, {
                   width: doc.page.width - 100,
                   align: 'center'
               });

            // Ticket details box - compact layout
            const detailsY = 110;
            const boxHeight = 350;
            
            doc.rect(50, detailsY, doc.page.width - 100, boxHeight)
               .strokeColor(borderGray)
               .lineWidth(2)
               .stroke();

            // Event title inside box
            doc.fontSize(22)
               .fillColor(darkText)
               .text('Amp Arena', 70, detailsY + 20, {
                   width: doc.page.width - 140,
                   align: 'center'
               });

            // Ticket details
            let currentY = detailsY + 60;
            const lineHeight = 28;

            const details = [
                ['Date:', eventDate],
                ['Venue:', venue],
                ['Time:', 'TBD (Updates coming soon)'],
                ['Ticket Type:', ticketType],
                ['Price:', `$${price}`],
                ['Email:', email]
            ];

            details.forEach(([label, value]) => {
                doc.fontSize(13)
                   .fillColor('#666666')
                   .text(label, 70, currentY, { width: 120 });
                
                doc.fillColor(darkText)
                   .text(value, 200, currentY, { width: 300 });
                
                currentY += lineHeight;
            });

            // Ticket code (prominent)
            currentY += 15;
            doc.rect(70, currentY - 5, doc.page.width - 140, 40)
               .fill(lightGray)
               .strokeColor(borderGray)
               .lineWidth(1)
               .stroke();

            doc.fontSize(16)
               .fillColor('#666666')
               .text('TICKET CODE:', 70, currentY + 8);

            doc.fontSize(18)
               .font('Courier')
               .fillColor(darkText)
               .text(ticketCode, 200, currentY + 8, {
                   width: 280,
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

                // Add QR code to PDF - smaller and repositioned
                const qrSize = 100;
                const qrX = doc.page.width - 140;
                const qrY = detailsY + 200;

                // White background for QR code
                doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
                   .fill(white)
                   .strokeColor(borderGray)
                   .lineWidth(1)
                   .stroke();

                doc.image(qrBuffer, qrX, qrY, {
                    width: qrSize,
                    height: qrSize
                });

                doc.fontSize(11)
                   .fillColor('#666666')
                   .text('Scan at venue', qrX, qrY + qrSize + 8, {
                       width: qrSize,
                       align: 'center'
                   });

            } catch (qrError) {
                console.error('QR code generation error:', qrError);
                
                // Fallback - just show text
                doc.fontSize(11)
                   .fillColor('#666666')
                   .text('Present ticket code\nat venue entrance', 
                         doc.page.width - 140, detailsY + 220, {
                             width: 100,
                             align: 'center'
                         });
            }

            // Important notes - compact
            const notesY = detailsY + boxHeight + 20;
            
            doc.fontSize(14)
               .fillColor(darkText)
               .text('Important Information:', 50, notesY);

            doc.fontSize(10)
               .fillColor('#666666')
               .text('• Arrive early - doors open 30 minutes before start time', 50, notesY + 25)
               .text('• Bring valid ID matching your ticket registration', 50, notesY + 40)
               .text('• This ticket is non-transferable and non-refundable', 50, notesY + 55)
               .text('• Keep this ticket or email QR code for entry', 50, notesY + 70)
               .text('• Event time will be updated via email', 50, notesY + 85);

            // Footer - minimal
            const footerY = doc.page.height - 60;
            
            doc.fontSize(11)
               .fillColor('#666666')
               .text('Amp Arena - Where Code Meets Competition', 50, footerY, {
                   width: doc.page.width - 100,
                   align: 'center'
               });

            doc.fontSize(10)
               .fillColor('#999999')
               .text('Questions? Contact tickets@amparena.com | © 2025 Amp Arena', 50, footerY + 20, {
                   width: doc.page.width - 100,
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
