# Amp Arena - Production Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables Configuration ✅
- [ ] `ADMIN_KEY` - Strong, unique admin key (not the default)
- [ ] `EMAIL_HOST` - SMTP host (smtp.gmail.com for Gmail)
- [ ] `EMAIL_PORT` - SMTP port (587 for Gmail)
- [ ] `EMAIL_SECURE` - Set to false for Gmail
- [ ] `EMAIL_USER` - Your Gmail address
- [ ] `EMAIL_PASS` - Gmail App Password (16 characters)
- [ ] `NOTIFY_EMAIL` - Admin email for notifications
- [ ] `NODE_ENV` - Set to "production"

### 2. Gmail App Password Setup ✅
- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Generate App Password:
  - Go to Google Account → Security → 2-Step Verification
  - App passwords → Select Mail → Other (custom name)
  - Copy the 16-character password
- [ ] Test SMTP connection locally if possible

### 3. Repository Preparation ✅
- [ ] All sensitive data moved to environment variables
- [ ] `.env` file in `.gitignore` (never commit real credentials)
- [ ] Updated `package.json` with correct start command
- [ ] All files committed and pushed to main branch

## Render Service Configuration

### 4. Service Setup ✅
- [ ] New Web Service created in Render
- [ ] Connected to correct GitHub repository
- [ ] Branch set to `main`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Environment: `Node`

### 5. Environment Variables in Render ✅
- [ ] All required environment variables added
- [ ] Values properly escaped (no extra quotes)
- [ ] ADMIN_KEY is secure and different from example
- [ ] EMAIL_PASS is the 16-character App Password

## Deployment Testing

### 6. Backend Functionality Tests ✅

**Lock Screen (Passcode: 102925)**
- [ ] Lock screen appears on initial visit
- [ ] Correct passcode (102925) grants access
- [ ] Incorrect passcode shows error
- [ ] Access persists on page refresh
- [ ] Works across all pages (/, /attendees, /terms, /attend)

**Main Page Signup**
- [ ] Email signup form accepts valid emails
- [ ] Rejects invalid emails with proper error message
- [ ] Prevents duplicate signups
- [ ] Shows success message on successful signup
- [ ] Database stores signup correctly

**Admin Dashboard**
- [ ] `/attendees` route loads properly
- [ ] Passcode authentication works (102925)
- [ ] Server-side admin authentication validates correctly
- [ ] Dashboard shows real signup data
- [ ] Statistics update correctly
- [ ] Export CSV functionality works
- [ ] Auto-refresh updates data every 30 seconds

**Email Notifications**
- [ ] New signups trigger email notifications
- [ ] Notification emails are properly formatted
- [ ] Admin receives emails at specified NOTIFY_EMAIL
- [ ] Database marks notifications as sent

### 7. Routing Tests ✅
- [ ] `/` - Main landing page loads
- [ ] `/attendees` - Attendee dashboard loads
- [ ] `/terms` - Terms page loads (if exists)
- [ ] `/attend` - Attend page loads (if exists)
- [ ] Clean URLs work without `.html` extensions
- [ ] 404 handling for non-existent routes
- [ ] Static assets load correctly

### 8. Security Tests ✅
- [ ] Admin API requires proper authentication
- [ ] Invalid admin keys are rejected
- [ ] Passcode verification works server-side
- [ ] No sensitive data exposed in client code
- [ ] HTTPS enforced (handled by Render)
- [ ] CSP headers configured properly

## Custom Domain Setup (Optional)

### 9. Cloudflare Configuration ✅
- [ ] Custom domain added in Render dashboard
- [ ] CNAME record created in Cloudflare DNS
- [ ] SSL/TLS set to "Full (strict)" in Cloudflare
- [ ] "Always Use HTTPS" enabled
- [ ] Domain propagation complete (24-48 hours)

## Post-Deployment Verification

### 10. Full System Test ✅
- [ ] Visit main domain - lock screen appears
- [ ] Enter passcode - gains access to site
- [ ] Submit email signup - receives confirmation
- [ ] Check admin dashboard - signup appears
- [ ] Verify email notification received
- [ ] Test all page routes work
- [ ] Test on mobile and desktop

### 11. Performance & Monitoring ✅
- [ ] Page load times acceptable
- [ ] Database queries respond quickly
- [ ] Email delivery working consistently
- [ ] Server logs show no errors
- [ ] Monitor resource usage in Render dashboard

### 12. Backup & Recovery ✅
- [ ] Database data can be accessed via admin dashboard
- [ ] CSV export functionality tested
- [ ] Environment variables documented
- [ ] Deployment process documented

## Troubleshooting Common Issues

### Email Not Working
- Verify Gmail App Password (not regular password)
- Check 2FA is enabled on Gmail account
- Confirm EMAIL_PASS is exactly 16 characters
- Test with different email providers if needed

### Admin Authentication Failing  
- Verify ADMIN_KEY matches between server and database
- Check server logs for authentication errors
- Confirm passcode is exactly "102925"
- Clear browser cache and localStorage

### Database Issues
- SQLite file should be created automatically
- Check Render disk storage is properly mounted
- Verify database initialization in server logs
- Test signup API endpoints directly

### Routing Problems
- Ensure static file serving is working
- Check Express routes are in correct order
- Verify fallback routing for clean URLs
- Test all routes manually

## Final Launch Checklist

- [ ] All tests passing
- [ ] Email notifications working
- [ ] Admin dashboard fully functional  
- [ ] Custom domain configured (if applicable)
- [ ] Team notified of launch
- [ ] Monitoring and backup procedures established
- [ ] Support documentation updated

## Post-Launch Monitoring

### Daily Tasks
- Check admin dashboard for new signups
- Monitor email delivery
- Review server logs for errors
- Verify site accessibility

### Weekly Tasks  
- Export and backup signup data
- Review performance metrics
- Check for any security alerts
- Update dependencies if needed

---

**Deployment Date:** ___________  
**Deployed By:** ___________  
**Domain:** ___________  
**Admin Access:** Use passcode 102925
