# Error Handling Guide

## Overview
This document outlines all error scenarios and how to handle them in the WorkSure signup and login flow.

---

## Signup Flow Errors

### Step 1: Email + Password Signup

#### 1. Duplicate Email
**Error Code**: `EMAIL_EXISTS`  
**Supabase Error**: `User already registered`

```javascript
if (error.message.includes('already registered')) {
  return {
    error: {
      message: 'This email is already registered. Please login instead.',
      code: 'EMAIL_EXISTS'
    }
  }
}
```

**User Action**: Redirect to login page

---

#### 2. Weak Password
**Error Code**: `WEAK_PASSWORD`  
**Supabase Error**: `Password should be at least 8 characters`

```javascript
if (error.message.includes('password') || error.message.includes('8 characters')) {
  return {
    error: {
      message: 'Password must be at least 8 characters long.',
      code: 'WEAK_PASSWORD'
    }
  }
}
```

**User Action**: Show inline validation, prevent submission

---

#### 3. Invalid Email Format
**Error Code**: `INVALID_EMAIL`  
**Supabase Error**: `Invalid email address`

```javascript
if (error.message.includes('email') || error.message.includes('format')) {
  return {
    error: {
      message: 'Please enter a valid email address.',
      code: 'INVALID_EMAIL'
    }
  }
}
```

**User Action**: Show inline validation

---

#### 4. Rate Limit Exceeded
**Error Code**: `RATE_LIMIT_EXCEEDED`  
**Supabase Error**: `Too many requests`

```javascript
if (error.message.includes('too many') || error.status === 429) {
  return {
    error: {
      message: 'Too many signup attempts. Please try again in a few minutes.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }
}
```

**User Action**: Disable form, show countdown timer

---

### Step 2: OTP Verification

#### 1. Invalid OTP
**Error Code**: `INVALID_OTP`  
**Supabase Error**: `Invalid token`

```javascript
if (error.message.includes('invalid') || error.message.includes('token')) {
  return {
    error: {
      message: 'Invalid verification code. Please try again.',
      code: 'INVALID_OTP'
    }
  }
}
```

**User Action**: Clear input, allow retry, show resend option

---

#### 2. Expired OTP
**Error Code**: `OTP_EXPIRED`  
**Supabase Error**: `Token has expired`

```javascript
if (error.message.includes('expired')) {
  return {
    error: {
      message: 'This code has expired. Please request a new one.',
      code: 'OTP_EXPIRED'
    }
  }
}
```

**User Action**: Show resend OTP button

---

#### 3. OTP Already Used
**Error Code**: `OTP_ALREADY_USED`  
**Supabase Error**: `Token has already been used`

```javascript
if (error.message.includes('already been used')) {
  return {
    error: {
      message: 'This code has already been used. Please request a new one.',
      code: 'OTP_ALREADY_USED'
    }
  }
}
```

**User Action**: Show resend OTP button

---

### Step 3: Profile Completion

#### 1. Duplicate NID
**Error Code**: `DUPLICATE_NID`  
**Database Error**: `23505` (Unique constraint violation on `nid`)

```javascript
if (error.code === '23505' && error.message.includes('nid')) {
  return {
    error: {
      message: 'This NID is already registered.',
      code: 'DUPLICATE_NID'
    }
  }
}
```

**User Action**: Highlight NID field, show error message

---

#### 2. Duplicate Phone
**Error Code**: `DUPLICATE_PHONE`  
**Database Error**: `23505` (Unique constraint violation on `phone`)

```javascript
if (error.code === '23505' && error.message.includes('phone')) {
  return {
    error: {
      message: 'This phone number is already registered.',
      code: 'DUPLICATE_PHONE'
    }
  }
}
```

**User Action**: Highlight phone field, show error message

---

#### 3. Not Authenticated
**Error Code**: `NOT_AUTHENTICATED`  
**Scenario**: User session expired between OTP verification and profile creation

```javascript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return {
    error: {
      message: 'Your session has expired. Please start over.',
      code: 'NOT_AUTHENTICATED'
    }
  }
}
```

**User Action**: Redirect to step 1, show message

---

#### 4. Image Upload Failure

##### File Too Large
**Error Code**: `FILE_TOO_LARGE`  
**Limit**: 5MB

```javascript
const maxSize = 5 * 1024 * 1024 // 5MB
if (file.size > maxSize) {
  return {
    error: {
      message: 'Image size must be less than 5MB.',
      code: 'FILE_TOO_LARGE'
    }
  }
}
```

**User Action**: Show file size limit, allow retry

---

##### Invalid File Type
**Error Code**: `INVALID_FILE_TYPE`  
**Allowed**: `image/jpeg`, `image/png`, `image/webp`

```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
if (!allowedTypes.includes(file.type)) {
  return {
    error: {
      message: 'Only JPEG, PNG, and WebP images are allowed.',
      code: 'INVALID_FILE_TYPE'
    }
  }
}
```

**User Action**: Show allowed formats, allow retry

---

##### Upload Error
**Error Code**: `UPLOAD_FAILED`  
**Supabase Storage Error**: Various

```javascript
const { error } = await supabase.storage
  .from('profile-images')
  .upload(fileName, file)

if (error) {
  return {
    error: {
      message: 'Failed to upload image. Please try again.',
      code: 'UPLOAD_FAILED',
      details: error.message
    }
  }
}
```

**User Action**: Allow retry, show generic error

---

#### 5. Database Constraint Violations

##### Missing Required Fields
**Error Code**: `MISSING_REQUIRED_FIELD`  
**Database Error**: `23502` (Not null violation)

```javascript
if (error.code === '23502') {
  const field = error.message.match(/column "(\w+)"/)?.[1]
  return {
    error: {
      message: `Please fill in all required fields. Missing: ${field}`,
      code: 'MISSING_REQUIRED_FIELD',
      field: field
    }
  }
}
```

**User Action**: Highlight missing field

---

##### Invalid Date Format
**Error Code**: `INVALID_DATE`  
**Database Error**: `22007` (Invalid date format)

```javascript
if (error.code === '22007') {
  return {
    error: {
      message: 'Please enter a valid date of birth.',
      code: 'INVALID_DATE'
    }
  }
}
```

**User Action**: Show date picker, validate format

---

## Login Flow Errors

### 1. Invalid Credentials
**Error Code**: `INVALID_CREDENTIALS`  
**Supabase Error**: `Invalid login credentials`

```javascript
if (error.message.includes('Invalid login credentials')) {
  return {
    error: {
      message: 'Invalid email or password.',
      code: 'INVALID_CREDENTIALS'
    }
  }
}
```

**User Action**: Clear password field, show error, allow retry

---

### 2. Email Not Verified
**Error Code**: `EMAIL_NOT_VERIFIED`  
**Supabase Error**: `Email not confirmed`

```javascript
if (error.message.includes('not confirmed') || error.message.includes('not verified')) {
  return {
    error: {
      message: 'Please verify your email before logging in.',
      code: 'EMAIL_NOT_VERIFIED'
    }
  }
}
```

**User Action**: Show resend verification email option

---

### 3. User Not Found
**Error Code**: `USER_NOT_FOUND`  
**Supabase Error**: `User not found`

```javascript
if (error.message.includes('not found')) {
  return {
    error: {
      message: 'No account found with this email.',
      code: 'USER_NOT_FOUND'
    }
  }
}
```

**User Action**: Show signup link

---

### 4. Account Suspended
**Error Code**: `ACCOUNT_SUSPENDED`  
**Custom Check**: Check user status in profiles table

```javascript
// After successful auth, check profile status
const { data: profile } = await supabase
  .from('profiles')
  .select('status')
  .eq('id', user.id)
  .single()

if (profile?.status === 'suspended') {
  await supabase.auth.signOut()
  return {
    error: {
      message: 'Your account has been suspended. Please contact support.',
      code: 'ACCOUNT_SUSPENDED'
    }
  }
}
```

**User Action**: Sign out, show contact support message

---

## Network Errors

### 1. Connection Timeout
**Error Code**: `NETWORK_TIMEOUT`  
**Error**: Request timeout

```javascript
catch (err) {
  if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
    return {
      error: {
        message: 'Request timed out. Please check your connection and try again.',
        code: 'NETWORK_TIMEOUT'
      }
    }
  }
}
```

**User Action**: Show retry button

---

### 2. No Internet Connection
**Error Code**: `NO_CONNECTION`  
**Error**: Network error

```javascript
catch (err) {
  if (!navigator.onLine) {
    return {
      error: {
        message: 'No internet connection. Please check your network.',
        code: 'NO_CONNECTION'
      }
    }
  }
}
```

**User Action**: Show offline indicator, disable form

---

### 3. Server Error
**Error Code**: `SERVER_ERROR`  
**Error**: 500 status code

```javascript
if (error.status >= 500) {
  return {
    error: {
      message: 'Server error. Please try again later.',
      code: 'SERVER_ERROR'
    }
  }
}
```

**User Action**: Show retry button, log error for monitoring

---

## Error Handling Utility

```javascript
/**
 * Centralized error handler
 */
export function handleError(error, context = '') {
  // Log error for monitoring
  console.error(`[${context}]`, error)

  // Network errors
  if (!navigator.onLine) {
    return {
      message: 'No internet connection. Please check your network.',
      code: 'NO_CONNECTION'
    }
  }

  // Supabase errors
  if (error.status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      code: 'SERVER_ERROR'
    }
  }

  // Known error codes
  const errorMap = {
    'EMAIL_EXISTS': 'This email is already registered.',
    'WEAK_PASSWORD': 'Password must be at least 8 characters.',
    'INVALID_EMAIL': 'Please enter a valid email address.',
    'INVALID_CREDENTIALS': 'Invalid email or password.',
    'EMAIL_NOT_VERIFIED': 'Please verify your email first.',
    'OTP_EXPIRED': 'Verification code has expired.',
    'INVALID_OTP': 'Invalid verification code.',
    'DUPLICATE_NID': 'This NID is already registered.',
    'DUPLICATE_PHONE': 'This phone number is already registered.',
    'FILE_TOO_LARGE': 'Image size must be less than 5MB.',
    'INVALID_FILE_TYPE': 'Only JPEG, PNG, and WebP images are allowed.',
    'UPLOAD_FAILED': 'Failed to upload image.',
    'NOT_AUTHENTICATED': 'You must be logged in to perform this action.',
    'RATE_LIMIT_EXCEEDED': 'Too many attempts. Please try again later.'
  }

  // Check if error has a code
  if (error.code && errorMap[error.code]) {
    return {
      message: errorMap[error.code],
      code: error.code
    }
  }

  // Check error message for known patterns
  const message = error.message || ''
  
  if (message.includes('already registered')) {
    return { message: 'This email is already registered.', code: 'EMAIL_EXISTS' }
  }
  
  if (message.includes('Invalid login credentials')) {
    return { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' }
  }

  // Default error
  return {
    message: error.message || 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR'
  }
}
```

---

## Error Display Best Practices

1. **Show errors inline**: Display errors next to the relevant field
2. **Clear on change**: Clear errors when user starts typing
3. **Be specific**: Tell users exactly what went wrong
4. **Provide actions**: Offer clear next steps (retry, resend, etc.)
5. **Don't blame users**: Use friendly, helpful language
6. **Log for monitoring**: Always log errors server-side for debugging

---

## Testing Error Scenarios

Test all error cases:
- [ ] Duplicate email signup
- [ ] Weak password
- [ ] Invalid email format
- [ ] Invalid OTP
- [ ] Expired OTP
- [ ] Duplicate NID
- [ ] Duplicate phone
- [ ] Large image file
- [ ] Invalid image type
- [ ] Network timeout
- [ ] Offline mode
- [ ] Invalid login credentials
- [ ] Unverified email login
