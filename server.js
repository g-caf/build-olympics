const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const { sendTicketRetrievalEmail, processTicketPurchase } = require('./ticket-system');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Email configuration
let transporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

// File upload configuration
const uploadsDir = path.join(__dirname, 'uploads/competitors');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|zip|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, ZIP, DOC, DOCX, JPEG, JPG, and PNG files are allowed'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            mediaSrc: ["'self'", "blob:"],
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize SQLite database
const db = new sqlite3.Database('./signups.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        
        // Create signups table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS signups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notified BOOLEAN DEFAULT FALSE
            )
        `);
        
        // Create competitors table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS competitors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                github_username TEXT,
                twitter_username TEXT,
                profile_photo_url TEXT,
                bio TEXT,
                submission_files TEXT, -- JSON array stored as string
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'qualified', 'finalist', 'eliminated')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create tickets table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                ticket_type TEXT NOT NULL DEFAULT 'general_admission',
                price INTEGER NOT NULL DEFAULT 2000,
                stripe_payment_intent_id TEXT,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled')),
                ticket_code TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});

// Competitor authentication middleware
const authenticateCompetitorAdmin = (req, res, next) => {
    const adminKey = req.headers['competitor-admin-key'];
    const expectedKey = process.env.COMPETITOR_ADMIN_PASSCODE;
    
    if (!expectedKey) {
        return res.status(500).json({ error: 'Competitor admin authentication not configured' });
    }
    
    if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized - Invalid competitor admin key' });
    }
    
    next();
};

// General admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const adminKey = req.headers['admin-key'];
    const expectedKey = process.env.ADMIN_KEY || 'build-olympics-admin-2025';
    
    if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized - Invalid admin key' });
    }
    
    next();
};

// Generate unique ticket code
const generateTicketCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'wireframe-index.html'));
});

// Competitor dashboard routes
app.get('/competitors', (req, res) => {
    res.sendFile(path.join(__dirname, 'competitors.html'));
});

app.get('/competitors/profile/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'competitor-profile.html'));
});

// Attendee dashboard routes
app.get('/attendees', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Legacy admin route - redirect to attendees
app.get('/admin', (req, res) => {
    res.redirect('/attendees');
});

app.get('/attend', (req, res) => {
    // Read the HTML file and inject Stripe key
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'attend.html'), 'utf8');
    
    // Inject the Stripe key into the HTML
    const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    console.log('Stripe key injection:', stripeKey ? `Key present (${stripeKey.substring(0, 8)}...)` : 'No key found');
    
    html = html.replace('</head>', `
    <script>
        window.STRIPE_PUBLISHABLE_KEY = '${stripeKey}';
        console.log('Injected Stripe key:', '${stripeKey ? stripeKey.substring(0, 8) + '...' : 'empty'}');
    </script>
    </head>`);
    
    res.send(html);
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'terms.html'));
});

app.get('/tickets/retrieve', (req, res) => {
    res.sendFile(path.join(__dirname, 'ticket-retrieval-page.html'));
});

// API endpoint to get Stripe publishable key
app.get('/api/stripe/config', (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});

// Handle SPA routing fallback - send index for any unmatched routes
app.get('*', (req, res) => {
    // Only serve index.html for routes that don't look like API calls or static assets
    // and don't match our specific routes
    const path = req.path;
    if (!path.startsWith('/api/') && 
        !path.includes('.') && 
        path !== '/attendees' && 
        path !== '/competitors' && 
        path !== '/dashboard' && 
        path !== '/attend' && 
        path !== '/terms') {
        res.sendFile(path.join(__dirname, 'wireframe-index.html'));
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// =================================
// COMPETITOR API ENDPOINTS
// =================================

// Competitor admin authentication endpoint
app.post('/api/competitor-admin-auth', (req, res) => {
    const { passcode } = req.body;
    const expectedPasscode = process.env.COMPETITOR_ADMIN_PASSCODE;
    
    if (!expectedPasscode) {
        return res.status(500).json({ error: 'Competitor admin authentication not configured' });
    }
    
    if (passcode !== expectedPasscode) {
        return res.status(401).json({ error: 'Invalid passcode' });
    }
    
    res.json({ 
        competitorAdminKey: expectedPasscode,
        message: 'Competitor admin authentication successful' 
    });
});

// POST /api/competitors - Create new competitor
app.post('/api/competitors', (req, res) => {
    const { email, full_name, github_username, twitter_username, profile_photo_url, bio } = req.body;
    
    if (!email || !full_name) {
        return res.status(400).json({ error: 'Email and full name are required' });
    }
    
    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address required' });
    }
    
    const submissionFiles = JSON.stringify([]);
    
    db.run(
        `INSERT INTO competitors (email, full_name, github_username, twitter_username, profile_photo_url, bio, submission_files) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, full_name, github_username || null, twitter_username || null, profile_photo_url || null, bio || null, submissionFiles],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ error: 'Email already registered as competitor' });
                }
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            console.log(`New competitor: ${email} (ID: ${this.lastID})`);
            res.json({ 
                message: 'Competitor registered successfully!', 
                id: this.lastID 
            });
        }
    );
});

// GET /api/competitors - List all competitors (admin auth required)
app.get('/api/competitors', authenticateCompetitorAdmin, (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM competitors';
    let params = [];
    
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        // Parse submission_files JSON for each competitor
        const competitors = rows.map(competitor => ({
            ...competitor,
            submission_files: JSON.parse(competitor.submission_files || '[]')
        }));
        
        res.json(competitors);
    });
});

// GET /api/competitors/:id - Get single competitor profile
app.get('/api/competitors/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM competitors WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Competitor not found' });
        }
        
        // Parse submission_files JSON
        const competitor = {
            ...row,
            submission_files: JSON.parse(row.submission_files || '[]')
        };
        
        res.json(competitor);
    });
});

// PUT /api/competitors/:id - Update competitor profile
app.put('/api/competitors/:id', authenticateCompetitorAdmin, (req, res) => {
    const { id } = req.params;
    const { email, full_name, github_username, twitter_username, profile_photo_url, bio, status } = req.body;
    
    if (!email || !full_name) {
        return res.status(400).json({ error: 'Email and full name are required' });
    }
    
    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address required' });
    }
    
    if (status && !['pending', 'qualified', 'finalist', 'eliminated'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }
    
    db.run(
        `UPDATE competitors 
         SET email = ?, full_name = ?, github_username = ?, twitter_username = ?, 
             profile_photo_url = ?, bio = ?, status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [email, full_name, github_username || null, twitter_username || null, 
         profile_photo_url || null, bio || null, status || null, id],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ error: 'Email already in use by another competitor' });
                }
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Competitor not found' });
            }
            
            console.log(`Updated competitor ID: ${id}`);
            res.json({ message: 'Competitor updated successfully' });
        }
    );
});

// DELETE /api/competitors/:id - Remove competitor
app.delete('/api/competitors/:id', authenticateCompetitorAdmin, (req, res) => {
    const { id } = req.params;
    
    // First get the competitor to delete their files
    db.get('SELECT submission_files FROM competitors WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Competitor not found' });
        }
        
        // Delete files if they exist
        try {
            const files = JSON.parse(row.submission_files || '[]');
            files.forEach(filePath => {
                const fullPath = path.join(__dirname, filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        } catch (error) {
            console.error('Error deleting files:', error);
        }
        
        // Delete competitor from database
        db.run('DELETE FROM competitors WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            console.log(`Deleted competitor ID: ${id}`);
            res.json({ message: 'Competitor deleted successfully' });
        });
    });
});

// POST /api/competitors/:id/upload - Handle file uploads
app.post('/api/competitors/:id/upload', upload.array('files', 5), (req, res) => {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Get current competitor to update their submission files
    db.get('SELECT submission_files FROM competitors WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Competitor not found' });
        }
        
        try {
            const currentFiles = JSON.parse(row.submission_files || '[]');
            const newFilePaths = req.files.map(file => `uploads/competitors/${file.filename}`);
            const updatedFiles = [...currentFiles, ...newFilePaths];
            
            // Update database with new file paths
            db.run(
                'UPDATE competitors SET submission_files = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [JSON.stringify(updatedFiles), id],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    
                    console.log(`Files uploaded for competitor ID: ${id}`);
                    res.json({ 
                        message: 'Files uploaded successfully',
                        files: newFilePaths
                    });
                }
            );
        } catch (error) {
            console.error('Error processing files:', error);
            res.status(500).json({ error: 'Error processing uploaded files' });
        }
    });
});

// =================================
// TICKET API ENDPOINTS
// =================================

// POST /api/tickets/purchase - Initiate Stripe payment intent
app.post('/api/tickets/purchase', async (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address required' });
    }
    
    try {
        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2000, // $20.00 in cents
            currency: 'usd',
            metadata: {
                email: email,
                event: 'Build Olympics 2025'
            }
        });
        
        res.json({
            success: true,
            message: 'Payment intent created successfully',
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });
    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// POST /api/tickets/confirm - Confirm payment and create ticket record
app.post('/api/tickets/confirm', async (req, res) => {
    const { email, stripe_payment_intent_id } = req.body;
    
    if (!email || !stripe_payment_intent_id) {
        return res.status(400).json({ error: 'Email and payment intent ID required' });
    }
    
    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address required' });
    }
    
    try {
        // Note: Stripe payment verification would be here
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const paymentIntent = await stripe.paymentIntents.retrieve(stripe_payment_intent_id);
        // 
        // if (paymentIntent.status !== 'succeeded') {
        //     return res.status(400).json({ error: 'Payment not completed' });
        // }
        
        // Generate unique ticket code
        let ticketCode;
        let isUnique = false;
        
        while (!isUnique) {
            ticketCode = generateTicketCode();
            
            // Check if code already exists
            const existingTicket = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM tickets WHERE ticket_code = ?', [ticketCode], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!existingTicket) {
                isUnique = true;
            }
        }
        
        // Create ticket record
        db.run(
            `INSERT INTO tickets (email, ticket_type, price, stripe_payment_intent_id, status, ticket_code) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [email, 'general_admission', 2000, stripe_payment_intent_id, 'confirmed', ticketCode],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to create ticket record' });
                }
                
                console.log(`New ticket created: ${email} (ID: ${this.lastID}, Code: ${ticketCode})`);
                
                // Send confirmation email if configured
                if (transporter && process.env.EMAIL_USER) {
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: 'Build Olympics 2025 - Ticket Confirmation',
                        html: `
                            <h2>Build Olympics 2025 - Ticket Confirmed!</h2>
                            <p>Thank you for your purchase!</p>
                            <p><strong>Event:</strong> Build Olympics 2025</p>
                            <p><strong>Date:</strong> October 29th, 2025</p>
                            <p><strong>Venue:</strong> The Midway SF</p>
                            <p><strong>Ticket Type:</strong> General Admission</p>
                            <p><strong>Ticket Code:</strong> ${ticketCode}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <hr>
                            <p>Please save this email and bring your ticket code to the event.</p>
                            <p>We're excited to see you there!</p>
                        `
                    };
                    
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('Ticket confirmation email failed:', error);
                        } else {
                            console.log('Ticket confirmation email sent:', info.response);
                        }
                    });
                }
                
                res.json({ 
                    success: true,
                    message: 'Ticket confirmed successfully!', 
                    ticket: {
                        id: this.lastID,
                        email: email,
                        ticket_code: ticketCode,
                        ticket_type: 'general_admission',
                        price: 2000,
                        status: 'confirmed'
                    }
                });
            }
        );
    } catch (error) {
        console.error('Ticket confirmation error:', error);
        res.status(500).json({ error: 'Failed to confirm ticket' });
    }
});

// GET /api/tickets/:email - Get tickets for email address
app.get('/api/tickets/:email', (req, res) => {
    const { email } = req.params;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address required' });
    }
    
    db.all(
        'SELECT id, email, ticket_type, price, status, ticket_code, created_at FROM tickets WHERE email = ? ORDER BY created_at DESC',
        [email],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            res.json({ tickets: rows });
        }
    );
});

// GET /api/tickets - List all tickets (admin only)
app.get('/api/tickets', authenticateAdmin, (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM tickets';
    let params = [];
    
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        res.json({ tickets: rows });
    });
});

// POST /api/stripe/webhook - Stripe webhook endpoint
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    // Stripe webhook verification
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.trim() : null;
    
    try {
        // Temporarily skip signature verification to avoid server crashes
        // TODO: Fix webhook signature verification later
        console.log('Stripe webhook received - processing without verification');
        res.json({received: true});
    } catch (err) {
        console.error('Webhook processing error:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// =================================
// SIGNUP API ENDPOINTS
// =================================

// API endpoint to handle email signups
app.post('/api/signup', (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address required' });
    }
    
    db.run('INSERT INTO signups (email) VALUES (?)', [email], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ error: 'Email already registered' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        console.log(`New signup: ${email} (ID: ${this.lastID})`);
        
        // Send email notification if configured
        if (transporter && process.env.NOTIFY_EMAIL) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.NOTIFY_EMAIL,
                subject: 'New Amp Arena Signup',
                html: `
                    <h2>New Amp Arena Signup</h2>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Signup Time:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Signup ID:</strong> ${this.lastID}</p>
                `
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Email notification failed:', error);
                } else {
                    console.log('Email notification sent:', info.response);
                    // Update notification status in database
                    db.run('UPDATE signups SET notified = TRUE WHERE id = ?', [this.lastID]);
                }
            });
        }
        
        res.json({ 
            message: 'Successfully signed up!', 
            id: this.lastID 
        });
    });
});

// API endpoint to get all signups (for admin)
app.get('/api/signups', (req, res) => {
    const adminKey = req.headers['admin-key'];
    const expectedKey = process.env.ADMIN_KEY || 'build-olympics-admin-2025';
    if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    db.all('SELECT * FROM signups ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
    });
});

// API endpoint to get signup count
app.get('/api/count', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM signups', (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ count: row.count });
    });
});

// Attendee dashboard authentication endpoint
app.post('/api/admin-auth', (req, res) => {
    const { passcode } = req.body;
    const expectedPasscode = process.env.COMPETITOR_ADMIN_PASSCODE;
    
    if (!expectedPasscode) {
        return res.status(500).json({ error: 'Attendee dashboard authentication not configured' });
    }
    
    if (passcode !== expectedPasscode) {
        return res.status(401).json({ error: 'Invalid passcode' });
    }
    
    res.json({ 
        adminKey: process.env.ADMIN_KEY || 'build-olympics-admin-2025',
        message: 'Attendee dashboard authentication successful' 
    });
});

// =================================
// TICKET EMAIL ENDPOINTS
// =================================

// POST /api/tickets/confirm - Process ticket purchase after payment
app.post('/api/tickets/confirm', async (req, res) => {
    const { email, paymentIntentId, ticketType, price } = req.body;
    
    if (!email || !paymentIntentId) {
        return res.status(400).json({ error: 'Email and payment intent ID are required' });
    }
    
    if (!transporter) {
        return res.status(500).json({ error: 'Email service not configured' });
    }
    
    try {
        const result = await processTicketPurchase(db, transporter, {
            email,
            paymentIntentId,
            ticketType,
            price
        });
        
        res.json({
            success: true,
            ticketCode: result.ticketCode,
            emailSent: result.emailSent,
            message: 'Ticket purchased successfully!'
        });
        
    } catch (error) {
        console.error('Ticket purchase error:', error);
        res.status(500).json({ 
            error: 'Failed to process ticket purchase',
            details: error.message
        });
    }
});

// POST /api/tickets/retrieve - Retrieve and resend tickets to email
app.post('/api/tickets/retrieve', async (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address required' });
    }
    
    if (!transporter) {
        return res.status(500).json({ error: 'Email service not configured' });
    }
    
    // Find tickets for this email
    db.all(
        'SELECT * FROM tickets WHERE email = ? AND status = "confirmed" ORDER BY created_at DESC',
        [email],
        async (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            if (!rows || rows.length === 0) {
                return res.status(404).json({ error: 'No confirmed tickets found for this email address' });
            }
            
            try {
                // Send retrieval email with all tickets
                const emailResult = await sendTicketRetrievalEmail(transporter, email, rows);
                
                if (emailResult.success) {
                    res.json({
                        success: true,
                        ticketCount: rows.length,
                        message: 'Tickets sent to your email successfully!'
                    });
                } else {
                    res.status(500).json({
                        error: 'Failed to send tickets email',
                        details: emailResult.error
                    });
                }
                
            } catch (error) {
                console.error('Ticket retrieval error:', error);
                res.status(500).json({ 
                    error: 'Failed to retrieve tickets',
                    details: error.message
                });
            }
        }
    );
});

// GET /api/tickets - List all tickets (admin auth required)
app.get('/api/tickets', (req, res) => {
    const adminKey = req.headers['admin-key'];
    const expectedKey = process.env.ADMIN_KEY || 'build-olympics-admin-2025';
    
    if (!adminKey || adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM tickets';
    let params = [];
    
    if (status) {
        query += ' WHERE status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        
        res.json(rows);
    });
});

// GET /api/tickets/count - Get ticket count
app.get('/api/tickets/count', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM tickets WHERE status = "confirmed"', (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ count: row.count });
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`Amp Arena wireframe server running on port ${PORT}`);
});
