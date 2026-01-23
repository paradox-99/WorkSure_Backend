# WorkSure Supabase Backend Setup

## Overview
This directory contains all SQL migrations, configuration guides, and integration documentation for implementing Supabase Auth in the WorkSure service marketplace.

---

## Directory Structure

```
supabase/
├── migrations/
│   ├── 001_create_profiles_table.sql      # Profiles table schema
│   ├── 002_enable_rls_profiles.sql        # Row Level Security policies
│   └── 003_create_storage_bucket.sql      # Storage bucket and policies
├── SUPABASE_AUTH_CONFIG.md                # Auth configuration guide
├── FRONTEND_INTEGRATION.md                 # Frontend code examples
├── ERROR_HANDLING.md                       # Error handling guide
└── README.md                               # This file
```

---

## Quick Start

### 1. Run Database Migrations

Execute the SQL files in order using Supabase SQL Editor:

1. **Create profiles table**:
   ```sql
   -- Run: migrations/001_create_profiles_table.sql
   ```

2. **Enable RLS policies**:
   ```sql
   -- Run: migrations/002_enable_rls_profiles.sql
   ```

3. **Create storage bucket** (via Dashboard):
   - Go to Storage → Create Bucket
   - Name: `profile-images`
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

4. **Set up storage policies**:
   ```sql
   -- Run: migrations/003_create_storage_bucket.sql
   ```

### 2. Configure Supabase Auth

Follow the detailed guide in `SUPABASE_AUTH_CONFIG.md`:

- Enable Email + Password authentication
- **Disable** "Auto Confirm Users" (CRITICAL)
- Enable email OTP verification
- Configure email templates
- Set up redirect URLs

### 3. Integrate Frontend

See `FRONTEND_INTEGRATION.md` for:
- Complete signup flow code
- Login implementation
- Profile completion
- Image upload
- Error handling

---

## Database Schema

### Profiles Table

```sql
profiles
├── id (UUID, PK, FK → auth.users.id)
├── full_name (TEXT, NOT NULL)
├── phone (TEXT, NOT NULL)
├── nid (TEXT, NOT NULL, UNIQUE)
├── date_of_birth (DATE, NOT NULL)
├── profile_image_url (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

**Constraints**:
- One profile per user (1:1 with auth.users)
- NID must be unique
- Cascade delete when user is deleted

---

## Security Features

### Row Level Security (RLS)

All RLS policies are enabled and configured:

- ✅ Users can only INSERT their own profile
- ✅ Users can only SELECT their own profile
- ✅ Users can only UPDATE their own profile
- ✅ DELETE is disabled (CASCADE handles deletion)

### Storage Security

- ✅ Public read access for profile images
- ✅ Only authenticated users can upload
- ✅ Users can only upload to their own folder
- ✅ File size limit: 5MB
- ✅ Allowed types: JPEG, PNG, WebP

---

## Signup Flow

```
Step 1: Email + Password
  ↓
Step 2: Email OTP Verification
  ↓
Step 3: Profile Completion
  ↓
User must manually login
```

**Key Points**:
- User is NOT auto-logged in after signup
- Profile can only be created after OTP verification
- User must login manually after profile completion

---

## Login Flow

```
User enters email + password
  ↓
Supabase validates credentials
  ↓
Session created (if email verified)
  ↓
Redirect to landing page
```

**Requirements**:
- Email must be verified
- User must have completed profile
- Session stored automatically

---

## Error Handling

See `ERROR_HANDLING.md` for comprehensive error scenarios:

- Duplicate email/NID/phone
- Invalid/expired OTP
- File upload failures
- Network errors
- Authentication errors

All errors return user-friendly messages with error codes.

---

## Testing Checklist

### Signup Flow
- [ ] Email + password signup works
- [ ] OTP email is received
- [ ] OTP verification works
- [ ] Profile creation works
- [ ] Image upload works
- [ ] User is signed out after profile creation
- [ ] User cannot login before OTP verification

### Login Flow
- [ ] Verified user can login
- [ ] Unverified user cannot login
- [ ] Invalid credentials show error
- [ ] Session persists correctly

### Security
- [ ] User cannot access another user's profile
- [ ] RLS policies are enforced
- [ ] Storage policies are enforced
- [ ] Duplicate NID/phone prevented

### Error Handling
- [ ] All error scenarios handled gracefully
- [ ] User-friendly error messages
- [ ] Proper error codes returned

---

## Production Checklist

Before deploying to production:

### Supabase Configuration
- [ ] Site URL set to production domain
- [ ] Redirect URLs configured
- [ ] Custom SMTP configured (recommended)
- [ ] Email templates customized
- [ ] Rate limiting enabled
- [ ] Auto confirm users: **OFF**

### Database
- [ ] All migrations run
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Constraints verified

### Storage
- [ ] Bucket created and configured
- [ ] Storage policies applied
- [ ] File size limits set
- [ ] MIME type restrictions set

### Security
- [ ] RLS enabled on all tables
- [ ] Storage policies verified
- [ ] No public access to sensitive data
- [ ] API keys secured (env variables)

### Monitoring
- [ ] Error logging configured
- [ ] Analytics set up
- [ ] Alerts configured
- [ ] Backup strategy in place

---

## API Reference

### Supabase Client Methods Used

```javascript
// Auth
supabase.auth.signUp({ email, password })
supabase.auth.verifyOtp({ email, token, type: 'email' })
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signOut()
supabase.auth.getUser()
supabase.auth.getSession()

// Database
supabase.from('profiles').insert({ ... })
supabase.from('profiles').select().eq('id', userId).single()
supabase.from('profiles').update({ ... }).eq('id', userId)

// Storage
supabase.storage.from('profile-images').upload(fileName, file)
supabase.storage.from('profile-images').getPublicUrl(fileName)
```

---

## Troubleshooting

### Users can login without OTP
**Fix**: Ensure "Auto Confirm Users" is **OFF** in Supabase Dashboard

### RLS policies not working
**Fix**: Verify RLS is enabled: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`

### Storage upload fails
**Fix**: 
- Verify bucket exists
- Check storage policies
- Verify file size and type

### Profile creation fails
**Fix**:
- Ensure user is authenticated (OTP verified)
- Check for duplicate NID/phone
- Verify all required fields provided

---

## Support

For issues or questions:
1. Check error messages in `ERROR_HANDLING.md`
2. Review Supabase documentation
3. Check Supabase Dashboard logs
4. Verify all migrations are applied

---

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

## License

This setup is part of the WorkSure project.
