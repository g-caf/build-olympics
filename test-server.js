const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        health: 'OK',
        database: 'Connected', // Simplified for testing
        email: process.env.EMAIL_HOST ? 'Configured' : 'Not configured'
    });
});

app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
    console.log(`🌐 Visit http://localhost:${PORT} to test`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});