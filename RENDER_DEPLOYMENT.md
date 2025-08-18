# Amp Arena - Render Deployment Guide

## Overview
This guide provides complete instructions for deploying the Amp Arena project to Render with full backend functionality including real database, admin authentication, email notifications, and clean URL routing.

## Prerequisites
- Render account (https://render.com)
- GitHub repository connected to Render
- Email account configured for SMTP (Gmail recommended)
- Cloudflare account for custom domain (optional)

## Render Service Configuration

### 1. Create New Web Service
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `build-olympics`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2. Environment Variables
Set these environment variables in Render Dashboard → Service → Environment:

#### Required Variables:
```
ADMIN_KEY=your_secret_admin_key_2025_secure
NODE_ENV=production
PORT=10000
```

#### Email Configuration (Required for notifications):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
NOTIFY_EMAIL=admin@yourdomain.com
```

#### Optional Database (SQLite used by default):
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Gmail App Password Setup
For email notifications to work:

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → 2-Step Verification
3. Generate App Password:
   - Select "Mail" as app
   - Select "Other" as device
   - Name it "Amp Arena Render"
4. Use the generated 16-character password as `EMAIL_PASS`

## Deployment Process

### 1. Deploy to Render
1. Push your code to GitHub
2. Render will automatically build and deploy
3. Monitor build logs in Render dashboard
4. Service will be available at: `https://your-service-name.onrender.com`

### 2. Verify Deployment
Test these endpoints:
- `https://your-service.onrender.com/` - Main landing page
- `https://your-service.onrender.com/admin` - Admin dashboard
- `https://your-service.onrender.com/terms` - Terms page
- `https://your-service.onrender.com/attend` - Attend page

### 3. Test Backend Functionality

#### Lock Screen (Passcode: 102925)
- Should appear on all pages initially
- Test localStorage persistence after unlock
- Verify lock screen covers entire site

#### Admin Dashboard
1. Go to `/admin`
2. Enter passcode: `102925`
3. Verify server-side authentication works
4. Check signup data displays correctly
5. Test export functionality

#### Email Signups
1. Test signup form on main page
2. Verify email storage in database
3. Check email notifications are sent
4. Confirm duplicate email handling

## Custom Domain Setup (Cloudflare)

### 1. Configure Custom Domain in Render
1. Go to Service → Settings → Custom Domains
2. Add your domain: `amp-arena.com`
3. Note the CNAME target provided by Render

### 2. Configure DNS in Cloudflare
1. Go to Cloudflare Dashboard → DNS → Records
2. Delete existing A/CNAME records for your domain
3. Add new CNAME record:
   - **Type**: CNAME
   - **Name**: @ (or your subdomain)
   - **Target**: `your-service-name.onrender.com`
   - **Proxy Status**: Proxied (orange cloud)

### 3. SSL/TLS Configuration
1. In Cloudflare → SSL/TLS → Overview
2. Set encryption mode to: **Full (strict)**
3. Enable **Always Use HTTPS**
4. Configure **Minimum TLS Version** to 1.2

## Production Checklist

### Security
- [ ] `ADMIN_KEY` is secure and unique
- [ ] Gmail App Password is used (not regular password)
- [ ] All sensitive data in environment variables
- [ ] HTTPS enabled via Cloudflare
- [ ] CSP headers configured properly

### Functionality
- [ ] Main signup form works
- [ ] Database stores signups correctly
- [ ] Email notifications are sent
- [ ] Admin dashboard authentication works
- [ ] All routes accessible (`/`, `/admin`, `/terms`, `/attend`)
- [ ] Lock screen functions properly
- [ ] Clean URLs work without `.html` extensions

### Performance
- [ ] Static assets served correctly
- [ ] Database queries optimized
- [ ] Proper error handling implemented
- [ ] Graceful shutdown configured

## Troubleshooting

### Build Fails
- Check Node.js version compatibility (>=18.0.0)
- Verify all dependencies in package.json
- Review build logs in Render dashboard

### Database Issues
- SQLite database is created automatically
- For persistence, Render provides disk storage
- Check database initialization in server logs

### Email Not Working
- Verify Gmail App Password is correct
- Check SMTP settings match your provider
- Monitor server logs for email errors
- Test with different email providers if needed

### Admin Access Issues
- Confirm `ADMIN_KEY` environment variable is set
- Test passcode authentication (102925)
- Check browser localStorage for persistence
- Verify API endpoints return correct responses

### Routing Problems
- Ensure static files are served correctly
- Check express routes are in correct order
- Test clean URLs work without file extensions
- Verify fallback routing handles SPAs properly

## Maintenance

### Regular Tasks
- Monitor signup growth in admin dashboard
- Check email notification delivery
- Review server logs for errors
- Update dependencies periodically

### Scaling
- Render auto-scales based on traffic
- Monitor performance in dashboard
- Consider upgrading plan for high traffic
- Implement rate limiting if needed

### Backup
- Database is automatically backed up by Render
- Export signup data regularly via admin dashboard
- Keep local backup of environment variables

## Support
- Render documentation: https://render.com/docs
- For issues with this deployment: Check server logs and error messages
- Gmail SMTP issues: Verify app password and 2FA settings
