# Amp Arena Ticket Email System

Complete ticket delivery system with Amp branding, QR codes, and PDF generation.

## 📋 System Overview

The ticket system includes:
- **Email Templates**: Branded HTML emails with Amp styling
- **PDF Generation**: Professional ticket PDFs with QR codes
- **QR Code Generation**: Unique codes for venue scanning
- **Email Delivery**: Automated sending after payment
- **Ticket Retrieval**: Resend tickets to email addresses

## 🚀 Features Implemented

### 1. Email Templates (`email-templates.js`)
- Professional HTML email with Amp branding
- Responsive design matching site aesthetics
- Event details with placeholder for TBD time
- QR code embedding
- Ticket retrieval template for resends

### 2. PDF Ticket Generation (`pdf-generator.js`)
- Professional PDF tickets with Amp branding
- QR code generation and embedding
- Event information and ticket details
- Unique ticket codes with venue scanning support

### 3. Ticket System Core (`ticket-system.js`)
- Unique ticket code generation (`AMP-TIMESTAMP-RANDOM`)
- QR code generation as base64
- Email sending with PDF attachments
- Database integration for ticket storage

### 4. Server Integration (`server.js`)
- New API endpoints for ticket operations
- Integration with existing nodemailer setup
- Database schema already supports tickets table

### 5. Ticket Retrieval Page (`ticket-retrieval-page.html`)
- Standalone page for ticket retrieval
- Professional UI matching site design
- Email validation and error handling

## 🔧 API Endpoints Added

### POST `/api/tickets/purchase`
Process ticket purchase after successful payment
```json
{
  "email": "user@example.com",
  "paymentIntentId": "pi_stripe_id",
  "ticketType": "general_admission",
  "price": 2000
}
```

### POST `/api/tickets/retrieve`
Retrieve and resend tickets to email address
```json
{
  "email": "user@example.com"
}
```

### GET `/api/tickets`
Admin endpoint to list all tickets (requires admin-key header)

### GET `/api/tickets/count`
Get count of confirmed tickets

## 🛠 Dependencies Added

```bash
npm install qrcode pdfkit
```

- `qrcode`: Generate QR codes for tickets
- `pdfkit`: Create PDF documents

## 📧 Email Configuration Required

Set these environment variables in `.env`:
```env
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
```

## 🧪 Testing

Use `test-ticket-email.js` to test the email system:
```bash
node test-ticket-email.js
```

## 🎫 Ticket Flow

1. **Purchase**: Payment processor calls `/api/tickets/purchase`
2. **Generation**: System creates unique ticket code and QR code
3. **Storage**: Ticket saved to database with confirmed status
4. **Email**: Branded email sent with PDF attachment
5. **Retrieval**: Users can resend tickets via `/tickets/retrieve`

## 🎨 Branding Elements

- **Logo**: Uses existing `Amp_mark_white.webp`
- **Colors**: Amp green (#00ff88) and dark theme
- **Typography**: Professional, consistent with site
- **Layout**: Responsive design with mobile support

## 📱 Event Details

- **Event**: Amp Arena
- **Date**: October 29th, 2025
- **Venue**: The Midway SF
- **Time**: TBD (will be updated via email)
- **Ticket Type**: General Admission ($20)

## 🔐 Security Features

- Unique ticket codes for each purchase
- QR codes for secure venue entry
- Email validation and sanitization
- Admin authentication for ticket management
- Non-transferable ticket policy

## 📊 Database Schema

The system uses the existing `tickets` table:
```sql
CREATE TABLE tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ticket_type TEXT NOT NULL DEFAULT 'general_admission',
    price INTEGER NOT NULL DEFAULT 2000,
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'pending',
    ticket_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚦 Next Steps

1. **Configure Email**: Set up SMTP credentials in `.env`
2. **Test System**: Run test script to verify email delivery
3. **Payment Integration**: Connect to Stripe webhook for automatic ticket sending
4. **Logo Optimization**: Convert WebP logo to PNG for PDF compatibility
5. **Time Updates**: Add system for sending event time updates

## 🎯 Usage Examples

### Manual Ticket Test
```bash
# Test email system (requires email config)
node test-ticket-email.js
```

### Retrieve Tickets
Visit: `http://localhost:3000/tickets/retrieve`

### Admin Dashboard
Access ticket management through existing admin system with ticket count and list endpoints.

## 📝 Notes

- PDF generation includes fallback if logo can't be loaded
- QR codes work even if generation fails (shows text fallback)
- Email templates are responsive and work across email clients
- System handles multiple tickets per email address
- All tickets include venue entry instructions
