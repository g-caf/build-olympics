# Build Olympics Landing Page 🏗️

A cosmic-themed landing page for the Build Olympics developer competition with email signup functionality.

## Features

- 🎯 Countdown timer to September 15th, 2025
- 📧 Email signup collection with backend storage
- 🎨 Sophisticated cosmic design with green color scheme
- 📱 Fully responsive design
- 🚀 Ready for deployment on Render

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Render

## Setup Instructions

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/g-caf/build-olympics.git
   cd build-olympics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Production Deployment (Render)

1. **Connect your GitHub repo to Render**
   - Service Type: Web Service
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Set environment variables in Render**
   - `ADMIN_KEY`: Secret key for accessing signup data
   - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`: Email configuration

## API Endpoints

- `POST /api/signup` - Submit email signup
- `GET /api/signups` - Get all signups (requires admin key)
- `GET /api/count` - Get total signup count

## Email Automation

### Send bulk notifications:
```bash
# Send welcome emails to new signups
node scripts/send-notification.js welcome

# Send reminder emails
node scripts/send-notification.js reminder
```

### View signups:
```bash
curl -H "admin-key: YOUR_ADMIN_KEY" https://your-app.onrender.com/api/signups
```

## Event Details

- **Qualifying Rounds**: 4 weeks starting September 15th, 2025
- **Final Event**: October 29th, 2025 in San Francisco
- **Prize**: $1,000,000 winner-takes-all
- **Final Seats**: 16 competitors in the final arena

## File Structure

```
├── index.html          # Main landing page
├── styles.css          # Cosmic-themed styles
├── script.js           # Frontend JavaScript
├── server.js           # Express.js backend
├── scripts/
│   └── send-notification.js  # Email automation
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.
