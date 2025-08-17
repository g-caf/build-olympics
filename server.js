const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
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

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            mediaSrc: ["'self'", "blob:"],
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

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
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'wireframe-index.html'));
});

// Admin dashboard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

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
                subject: 'New Build Olympics Signup',
                html: `
                    <h2>New Build Olympics Signup</h2>
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
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
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

// Admin authentication endpoint
app.post('/api/admin-auth', (req, res) => {
    const { passcode } = req.body;
    
    if (passcode !== '102925') {
        return res.status(401).json({ error: 'Invalid passcode' });
    }
    
    res.json({ 
        adminKey: process.env.ADMIN_KEY || 'admin-key-placeholder',
        message: 'Authentication successful' 
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
    console.log(`Build Olympics wireframe server running on port ${PORT}`);
});
