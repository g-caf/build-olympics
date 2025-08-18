# Amp Arena: Complete Vercel to Render Migration Guide

This guide provides step-by-step instructions for migrating the Amp Arena site from Vercel to Render with full backend functionality.

## 1. Environment Variables Setup

### Required Environment Variables in Render

When setting up your Render service, configure these environment variables in the Render dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets Node.js environment |
| `ADMIN_KEY` | `[Generate Strong Key]` | Secure key for admin dashboard access |
| `EMAIL_HOST` | `smtp.gmail.com` | Gmail SMTP server |
| `EMAIL_PORT` | `587` | Gmail SMTP port |
| `EMAIL_SECURE` | `false` | Use STARTTLS (not direct SSL) |
| `EMAIL_USER` | `your-email@gmail.com` | Your Gmail address |
| `EMAIL_PASS` | `[Gmail App Password]` | 16-character Gmail app password |
| `NOTIFY_EMAIL` | `admin@build-olympics.com` | Email to receive signup notifications |

### Gmail SMTP Configuration Steps

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account Settings → Security
   - Under "Signing in to Google" → App passwords
   - Select app: Mail, Device: Other (custom name)
   - Copy the 16-character password (no spaces)
3. **Use App Password** as `EMAIL_PASS` value

### Generate Secure Admin Key

Use a strong, unique admin key (minimum 32 characters):
```bash
# Generate a secure admin key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Domain Configuration Guide

### Step 1: Remove Vercel Domain Configuration

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Remove `build-olympics.com` from Vercel
3. Note: Keep the project active until Render is fully configured

### Step 2: Configure DNS in Cloudflare

1. **Login to Cloudflare** and select your `build-olympics.com` domain
2. **Update DNS Records:**

   Replace existing records with:
   ```
   Type: CNAME
   Name: @
   Target: your-render-service-name.onrender.com
   Proxy Status: Orange Cloud (Proxied)
   
   Type: CNAME
   Name: www
   Target: your-render-service-name.onrender.com
   Proxy Status: Orange Cloud (Proxied)
   ```

3. **SSL/TLS Settings in Cloudflare:**
   - Go to SSL/TLS → Overview
   - Set encryption mode to "Full (strict)"
   - Enable "Always Use HTTPS"

### Step 3: Configure Custom Domain in Render

1. In Render dashboard → Your service → Settings → Custom Domains
2. Add domain: `build-olympics.com`
3. Add domain: `www.build-olympics.com`
4. Render will automatically provision SSL certificates

## 3. Render Service Configuration

### Step 1: Create New Web Service

1. **Connect Repository:**
   - Go to Render dashboard → New → Web Service
   - Connect your GitHub repository: `g-caf/build-olympics`
   - Select branch: `main`

2. **Service Configuration:**
   ```
   Name: build-olympics
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables:**
   - Add all variables from Section 1 above
   - Use Render's "Generate Value" for `ADMIN_KEY` or set manually

4. **Advanced Settings:**
   ```
   Auto-Deploy: Yes
   Health Check Path: /
   ```

### Step 2: Persistent Storage Configuration

The service needs persistent storage for SQLite database:

1. **In Render dashboard → Your service → Settings**
2. **Add Persistent Disk:**
   ```
   Name: build-olympics-db
   Mount Path: /opt/render/project/src
   Size: 1 GB
   ```

### Step 3: Verify render.yaml Configuration

Your current [`render.yaml`](file:///Users/adrienne.caffarel/Amp%20Projects%20/BuildOlympics%20Landing%20Page/render.yaml) is properly configured for automatic deployment.

## 4. Production Deployment Checklist

### Pre-Deployment Verification

- [ ] All environment variables configured in Render
- [ ] Gmail app password generated and tested
- [ ] Admin key generated (32+ characters)
- [ ] Repository connected to Render
- [ ] Persistent disk configured for database storage

### Deployment Steps

1. **Deploy to Render:**
   - Push latest changes to `main` branch
   - Render will automatically deploy
   - Monitor build logs for any errors

2. **Initial Testing:**
   ```bash
   # Test basic connectivity
   curl -I https://your-service-name.onrender.com
   
   # Test health check
   curl https://your-service-name.onrender.com/
   ```

### Post-Deployment Testing Checklist

#### Basic Functionality
- [ ] Homepage loads correctly at service URL
- [ ] Email signup form works
- [ ] Database stores signups properly
- [ ] Admin dashboard accessible at `/admin`
- [ ] Terms page loads at `/terms`
- [ ] Attend page loads at `/attend`

#### Admin Dashboard Testing
1. **Access Admin Dashboard:**
   - Navigate to `https://your-service.onrender.com/admin`
   - Use passcode: `102925`
   - Verify admin key is returned

2. **Test Signup Data Retrieval:**
   - Create test signup
   - Verify it appears in admin dashboard
   - Check signup count updates

#### Email Notification Testing
1. **Test Email Functionality:**
   - Submit test signup
   - Check if notification email arrives at `NOTIFY_EMAIL`
   - Verify email contains correct signup details

### Domain Switch Testing (After DNS Propagation)
- [ ] `https://build-olympics.com` loads homepage
- [ ] `https://www.build-olympics.com` redirects properly
- [ ] SSL certificate is valid (green lock icon)
- [ ] All functionality works on production domain

## 5. Database and Admin Setup Verification

### SQLite Database Verification

1. **Check Database Creation:**
   - Monitor Render logs during first startup
   - Look for "Connected to SQLite database" message
   - Verify `signups` table is created

2. **Test Database Operations:**
   ```javascript
   // These operations should work without errors:
   // - INSERT new signups
   // - SELECT signup data for admin
   // - COUNT total signups
   ```

### Admin Authentication Flow

1. **Default Passcode:** `102925` (hardcoded in server.js line 180)
2. **Admin Key Verification:** Uses `ADMIN_KEY` environment variable
3. **Security Headers:** All admin API calls require `admin-key` header

### Database Persistence

- Database file: `./signups.db` (in project root)
- Persistent disk ensures data survives deployments
- Automatic table creation on first startup

## 6. Common Issues and Troubleshooting

### Build Failures
```bash
# If npm install fails, check Node.js version
"engines": {
  "node": ">=18.0.0"
}
```

### Email Notifications Not Working
- Verify Gmail app password is exactly 16 characters
- Check `EMAIL_USER` matches the Gmail account
- Ensure 2FA is enabled on Gmail account
- Test with: `node -e "console.log(process.env.EMAIL_PASS?.length)"`

### Database Issues
- Check persistent disk is mounted at `/opt/render/project/src`
- Verify SQLite3 package is installed: `npm list sqlite3`
- Monitor startup logs for database connection errors

### Domain SSL Issues
- Wait 24-48 hours for DNS propagation
- Verify Cloudflare SSL mode is "Full (strict)"
- Check Render custom domain status

### Performance Optimization
```bash
# Add to environment variables if needed:
NODE_OPTIONS=--max-old-space-size=1024
```

## 7. Final Verification Commands

After deployment, run these tests:

```bash
# Test signup functionality
curl -X POST https://build-olympics.com/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test admin authentication
curl -X POST https://build-olympics.com/api/admin-auth \
  -H "Content-Type: application/json" \
  -d '{"passcode":"102925"}'

# Test signup count
curl https://build-olympics.com/api/count
```

## 8. Rollback Plan

If issues occur:

1. **Quick Rollback:**
   - Update Cloudflare DNS back to Vercel
   - Keep both services running during transition

2. **Data Backup:**
   - Export signups from Render database
   - Store admin key and configuration safely

## 9. Post-Migration Cleanup

After successful migration:

1. **Remove Vercel project** (after 30 days to be safe)
2. **Update documentation** with new URLs
3. **Monitor error logs** for first 48 hours
4. **Set up monitoring/alerts** in Render dashboard

---

**Migration Timeline Estimate:** 2-4 hours
**DNS Propagation Time:** 24-48 hours for global propagation
**Rollback Time:** 15 minutes if needed
