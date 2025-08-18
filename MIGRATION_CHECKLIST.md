# Amp Arena Migration Checklist

## Pre-Migration Setup

### Gmail Configuration
- [ ] Enable 2-Factor Authentication on Gmail account
- [ ] Generate Gmail App Password (16 characters)
- [ ] Test Gmail SMTP connection locally

### Environment Variables Preparation
- [ ] Generate secure admin key (32+ characters): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Prepare notification email address
- [ ] Document all environment variables

## Render Service Setup

### Service Creation
- [ ] Create new Web Service in Render
- [ ] Connect GitHub repository: `g-caf/build-olympics`
- [ ] Set branch to `main`
- [ ] Configure build command: `npm install`
- [ ] Configure start command: `npm start`

### Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `ADMIN_KEY` = `[your-generated-key]`
- [ ] `EMAIL_HOST` = `smtp.gmail.com`
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_SECURE` = `false`
- [ ] `EMAIL_USER` = `your-email@gmail.com`
- [ ] `EMAIL_PASS` = `[16-char-app-password]`
- [ ] `NOTIFY_EMAIL` = `admin@amp-arena.com`

### Persistent Storage
- [ ] Add persistent disk: `build-olympics-db`
- [ ] Set mount path: `/opt/render/project/src`
- [ ] Set size: `1 GB`

## Initial Deployment

### Deploy and Test
- [ ] Deploy service on Render
- [ ] Monitor build logs for errors
- [ ] Test service at temporary Render URL
- [ ] Run verification script: `node verify-render-deployment.js https://your-service.onrender.com`

### Functional Testing
- [ ] Homepage loads correctly
- [ ] Email signup works
- [ ] Admin dashboard accessible with passcode `102925`
- [ ] Signup data visible in admin panel
- [ ] Email notifications sent (check notification email)

## Domain Migration

### DNS Configuration
- [ ] Note current DNS settings in Cloudflare
- [ ] Update DNS records:
  - `@` CNAME → `your-service.onrender.com` (Proxied)
  - `www` CNAME → `your-service.onrender.com` (Proxied)
- [ ] Set Cloudflare SSL to "Full (strict)"
- [ ] Enable "Always Use HTTPS"

### Custom Domain in Render
- [ ] Add custom domain: `amp-arena.com`
- [ ] Add custom domain: `www.amp-arena.com`
- [ ] Wait for SSL certificate provisioning

### Domain Testing (24-48 hours later)
- [ ] Test `https://amp-arena.com`
- [ ] Test `https://www.amp-arena.com`
- [ ] Verify SSL certificate (green lock)
- [ ] Test all functionality on production domain

## Final Verification

### Complete Functionality Check
- [ ] Email signups work on production domain
- [ ] Admin dashboard accessible
- [ ] Email notifications arrive
- [ ] Database persistence confirmed
- [ ] All routes working (`/`, `/admin`, `/terms`, `/attend`)

### Performance and Security
- [ ] Page load times acceptable
- [ ] Security headers present
- [ ] No console errors in browser
- [ ] Admin endpoints properly protected

## Post-Migration

### Cleanup
- [ ] Monitor Render logs for 48 hours
- [ ] Remove domain from Vercel (after confidence in Render)
- [ ] Delete Vercel project (after 30 days)
- [ ] Update any documentation with new URLs

### Documentation
- [ ] Update README if needed
- [ ] Document new admin access process
- [ ] Save environment variable configuration
- [ ] Create backup plan documentation

## Rollback Plan (if needed)

### Quick Rollback Steps
1. Update Cloudflare DNS back to Vercel
2. Re-add domain to Vercel project
3. Export any new signup data from Render
4. Import data to previous system if needed

## Emergency Contacts

- **Gmail Account:** `your-email@gmail.com`
- **Render Account:** [Your Render Email]
- **Cloudflare Account:** [Your Cloudflare Email]
- **Domain Registrar:** [Your Domain Provider]

## Key URLs

- **Render Service:** `https://your-service.onrender.com`
- **Admin Dashboard:** `https://amp-arena.com/admin`
- **Admin Passcode:** `102925`
- **GitHub Repo:** `https://github.com/g-caf/build-olympics`

---

**Estimated Migration Time:** 2-4 hours active work + 24-48 hours DNS propagation
**Critical Path:** Environment setup → Render deployment → DNS configuration → Domain testing
