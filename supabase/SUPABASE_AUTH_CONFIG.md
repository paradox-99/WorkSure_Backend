# Supabase Auth Configuration Guide

## Overview
This guide covers the Supabase Auth configuration required for WorkSure's multi-step signup and login flow.

---

## Step 1: Enable Email + Password Authentication

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - **Enable email provider**: ✅ ON
   - **Confirm email**: ✅ ON (REQUIRED)
   - **Secure email change**: ✅ ON

---

## Step 2: Configure Email OTP Verification

1. Go to **Authentication** → **Settings** → **Auth Settings**
2. Configure the following:

### Email Settings
- **Enable email confirmations**: ✅ ON
- **Enable email change confirmations**: ✅ ON
- **Secure email change**: ✅ ON

### User Management
- **Enable sign ups**: ✅ ON
- **Auto Confirm Users**: ❌ **OFF** (CRITICAL - Users must verify OTP)
- **Enable email confirmations**: ✅ ON

### OTP Settings
- **OTP Length**: 6 (default)
- **OTP Expiry**: 3600 seconds (1 hour)
- **Enable OTP**: ✅ ON

---

## Step 3: Email Templates Configuration

1. Go to **Authentication** → **Email Templates**

### Confirm Signup Template
Update the email template to match your brand:

```html
<h2>Welcome to WorkSure!</h2>
<p>Confirm your email address to complete your signup.</p>
<p>Your OTP code is: <strong>{{ .Token }}</strong></p>
<p>This code will expire in 1 hour.</p>
```

### Magic Link Template (if using)
Configure if you plan to use magic links in the future.

---

## Step 4: Site URL Configuration

1. Go to **Settings** → **API** → **URL Configuration**
2. Set **Site URL**: Your frontend URL (e.g., `http://localhost:3000` or `https://worksure.com`)
3. Add **Redirect URLs**:
   - `http://localhost:3000/**` (for development)
   - `https://worksure.com/**` (for production)

---

## Step 5: Security Settings

1. Go to **Authentication** → **Settings** → **Security**

### Password Requirements
- **Minimum password length**: 8 characters
- **Require uppercase**: Recommended
- **Require lowercase**: Recommended
- **Require numbers**: Recommended
- **Require special characters**: Optional

### Session Settings
- **JWT expiry**: 3600 seconds (1 hour)
- **Refresh token rotation**: ✅ ON (recommended)
- **Refresh token reuse detection**: ✅ ON (recommended)

---

## Step 6: Rate Limiting

1. Go to **Authentication** → **Settings** → **Rate Limits**
2. Configure:
   - **Email signups per hour**: 5 per IP
   - **OTP requests per hour**: 5 per email
   - **Password reset requests**: 3 per hour

---

## Step 7: Webhooks (Optional)

If you need to trigger actions on auth events:

1. Go to **Database** → **Webhooks**
2. Create webhook for `auth.users` table
3. Events: `INSERT`, `UPDATE`, `DELETE`
4. Use for:
   - Sending welcome emails
   - Creating related records
   - Analytics tracking

---

## Critical Configuration Checklist

- [ ] Email provider enabled
- [ ] **Auto Confirm Users: OFF** (MUST BE OFF)
- [ ] Email confirmations enabled
- [ ] OTP verification enabled
- [ ] Site URL configured
- [ ] Redirect URLs added
- [ ] Password requirements set
- [ ] Rate limiting configured
- [ ] Email templates customized

---

## Testing the Configuration

### Test Signup Flow:
1. User signs up with email + password
2. User receives OTP email
3. User cannot login until OTP is verified
4. After OTP verification, user can complete profile
5. User must manually login after profile completion

### Test Login Flow:
1. Verified user can login with email + password
2. Unverified user cannot login (should see error)
3. Session is created on successful login

---

## Troubleshooting

### Users can login without OTP verification
- **Fix**: Ensure "Auto Confirm Users" is **OFF**

### OTP emails not sending
- Check email provider configuration
- Verify SMTP settings (if using custom SMTP)
- Check spam folder
- Verify email template is configured

### Users can access other users' profiles
- **Fix**: Ensure RLS policies are enabled and correct
- Run `002_enable_rls_profiles.sql` migration

### Storage uploads failing
- Verify storage bucket exists
- Check storage policies
- Verify file size limits
- Check MIME type restrictions

---

## Production Checklist

Before going to production:

- [ ] Update Site URL to production domain
- [ ] Add production redirect URLs
- [ ] Configure custom SMTP (recommended)
- [ ] Set up email templates with branding
- [ ] Enable rate limiting
- [ ] Review and test all security settings
- [ ] Set up monitoring/alerts
- [ ] Document admin access procedures

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
