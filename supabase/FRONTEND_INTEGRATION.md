# Frontend Integration Guide

## Overview
This guide provides code examples for integrating WorkSure's Supabase Auth flow into your frontend application.

---

## Prerequisites

1. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

2. Initialize Supabase client:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Step 1: Email + Password Signup

```javascript
/**
 * Step 1: User signs up with email and password
 * @param {string} email - User email
 * @param {string} password - User password (min 8 chars)
 * @returns {Promise<{data, error}>}
 */
async function signUpStep1(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      // Handle specific errors
      if (error.message.includes('already registered')) {
        return {
          error: {
            message: 'This email is already registered. Please login instead.',
            code: 'EMAIL_EXISTS'
          }
        }
      }
      
      if (error.message.includes('password')) {
        return {
          error: {
            message: 'Password must be at least 8 characters long.',
            code: 'WEAK_PASSWORD'
          }
        }
      }

      return { error }
    }

    // User created, but not confirmed
    // OTP email has been sent
    return {
      data: {
        message: 'Please check your email for the verification code.',
        userId: data.user?.id
      }
    }
  } catch (err) {
    return {
      error: {
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      }
    }
  }
}
```

---

## Step 2: Email OTP Verification

```javascript
/**
 * Step 2: Verify OTP code sent to user's email
 * @param {string} email - User email
 * @param {string} token - OTP code from email
 * @returns {Promise<{data, error}>}
 */
async function verifyOTPStep2(email, token) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email'
    })

    if (error) {
      // Handle specific errors
      if (error.message.includes('expired')) {
        return {
          error: {
            message: 'This code has expired. Please request a new one.',
            code: 'OTP_EXPIRED'
          }
        }
      }

      if (error.message.includes('invalid')) {
        return {
          error: {
            message: 'Invalid verification code. Please try again.',
            code: 'INVALID_OTP'
          }
        }
      }

      return { error }
    }

    // User is now verified
    // Session is created, but we'll sign them out after profile creation
    return {
      data: {
        message: 'Email verified successfully!',
        user: data.user,
        session: data.session
      }
    }
  } catch (err) {
    return {
      error: {
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      }
    }
  }
}

/**
 * Resend OTP code
 * @param {string} email - User email
 * @returns {Promise<{data, error}>}
 */
async function resendOTP(email) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) {
      return {
        error: {
          message: 'Failed to resend code. Please try again.',
          code: 'RESEND_FAILED'
        }
      }
    }

    return {
      data: {
        message: 'Verification code sent to your email.'
      }
    }
  } catch (err) {
    return {
      error: {
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      }
    }
  }
}
```

---

## Step 3: Profile Completion

```javascript
/**
 * Step 3: Create user profile after OTP verification
 * @param {Object} profileData - Profile information
 * @param {File} profileImage - Profile picture file
 * @returns {Promise<{data, error}>}
 */
async function completeProfileStep3(profileData, profileImage) {
  const { full_name, phone, nid, date_of_birth } = profileData
  
  try {
    // Get current user (should be authenticated after OTP verification)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        error: {
          message: 'You must be logged in to complete your profile.',
          code: 'NOT_AUTHENTICATED'
        }
      }
    }

    let profileImageUrl = null

    // Upload profile image if provided
    if (profileImage) {
      const imageResult = await uploadProfileImage(user.id, profileImage)
      
      if (imageResult.error) {
        return imageResult
      }
      
      profileImageUrl = imageResult.data.url
    }

    // Insert profile into database
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: full_name,
        phone: phone,
        nid: nid,
        date_of_birth: date_of_birth,
        profile_image_url: profileImageUrl
      })
      .select()
      .single()

    if (error) {
      // Handle specific errors
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('nid')) {
          return {
            error: {
              message: 'This NID is already registered.',
              code: 'DUPLICATE_NID'
            }
          }
        }
        if (error.message.includes('phone')) {
          return {
            error: {
              message: 'This phone number is already registered.',
              code: 'DUPLICATE_PHONE'
            }
          }
        }
      }

      return { error }
    }

    // Sign out user - they must login manually
    await supabase.auth.signOut()

    return {
      data: {
        message: 'Profile created successfully! Please login to continue.',
        profile: data
      }
    }
  } catch (err) {
    return {
      error: {
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      }
    }
  }
}

/**
 * Upload profile image to Supabase Storage
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<{data, error}>}
 */
async function uploadProfileImage(userId, file) {
  try {
    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        error: {
          message: 'Image size must be less than 5MB.',
          code: 'FILE_TOO_LARGE'
        }
      }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        error: {
          message: 'Only JPEG, PNG, and WebP images are allowed.',
          code: 'INVALID_FILE_TYPE'
        }
      }
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/profile.${fileExt}`

    // Upload file
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      })

    if (error) {
      return {
        error: {
          message: 'Failed to upload image. Please try again.',
          code: 'UPLOAD_FAILED'
        }
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName)

    return {
      data: {
        url: urlData.publicUrl,
        path: data.path
      }
    }
  } catch (err) {
    return {
      error: {
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      }
    }
  }
}
```

---

## Step 4: Login

```javascript
/**
 * Step 4: User login (after signup and profile completion)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{data, error}>}
 */
async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      // Handle specific errors
      if (error.message.includes('Invalid login credentials')) {
        return {
          error: {
            message: 'Invalid email or password.',
            code: 'INVALID_CREDENTIALS'
          }
        }
      }

      if (error.message.includes('Email not confirmed')) {
        return {
          error: {
            message: 'Please verify your email before logging in.',
            code: 'EMAIL_NOT_VERIFIED'
          }
        }
      }

      return { error }
    }

    // Login successful
    // Session is automatically stored
    return {
      data: {
        user: data.user,
        session: data.session,
        message: 'Login successful!'
      }
    }
  } catch (err) {
    return {
      error: {
        message: 'Network error. Please try again.',
        code: 'NETWORK_ERROR'
      }
    }
  }
}
```

---

## Complete Signup Flow Example

```javascript
/**
 * Complete signup flow orchestrator
 */
async function completeSignupFlow(signupData) {
  const { email, password, profileData, profileImage, otp } = signupData

  // Step 1: Sign up
  const step1Result = await signUpStep1(email, password)
  if (step1Result.error) {
    return step1Result
  }

  // Step 2: Verify OTP
  const step2Result = await verifyOTPStep2(email, otp)
  if (step2Result.error) {
    return step2Result
  }

  // Step 3: Complete profile
  const step3Result = await completeProfileStep3(profileData, profileImage)
  if (step3Result.error) {
    return step3Result
  }

  return {
    data: {
      message: 'Signup completed! Please login to continue.'
    }
  }
}
```

---

## React Component Example

```jsx
import { useState } from 'react'
import { signUpStep1, verifyOTPStep2, completeProfileStep3, login } from './supabaseAuth'

function SignupFlow() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [profileData, setProfileData] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleStep1 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signUpStep1(email, password)
    
    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setStep(2)
    setLoading(false)
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await verifyOTPStep2(email, otp)
    
    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setStep(3)
    setLoading(false)
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await completeProfileStep3(profileData, profileImage)
    
    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    // Redirect to login
    window.location.href = '/login'
  }

  return (
    <div>
      {step === 1 && (
        <form onSubmit={handleStep1}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
          />
          <button type="submit" disabled={loading}>
            Sign Up
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2}>
          <p>Enter the code sent to {email}</p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="OTP Code"
            required
          />
          <button type="submit" disabled={loading}>
            Verify
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleStep3}>
          {/* Profile form fields */}
          <input
            type="text"
            value={profileData.full_name}
            onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
            placeholder="Full Name"
            required
          />
          {/* ... other fields ... */}
          <button type="submit" disabled={loading}>
            Complete Profile
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}
```

---

## Error Handling Utility

```javascript
/**
 * User-friendly error handler
 */
export function handleAuthError(error) {
  const errorMap = {
    'EMAIL_EXISTS': 'This email is already registered.',
    'WEAK_PASSWORD': 'Password must be at least 8 characters.',
    'INVALID_CREDENTIALS': 'Invalid email or password.',
    'EMAIL_NOT_VERIFIED': 'Please verify your email first.',
    'OTP_EXPIRED': 'Verification code has expired.',
    'INVALID_OTP': 'Invalid verification code.',
    'DUPLICATE_NID': 'This NID is already registered.',
    'DUPLICATE_PHONE': 'This phone number is already registered.',
    'FILE_TOO_LARGE': 'Image size must be less than 5MB.',
    'INVALID_FILE_TYPE': 'Only JPEG, PNG, and WebP images are allowed.',
    'UPLOAD_FAILED': 'Failed to upload image.',
    'NETWORK_ERROR': 'Network error. Please try again.',
    'NOT_AUTHENTICATED': 'You must be logged in to perform this action.'
  }

  return errorMap[error.code] || error.message || 'An unexpected error occurred.'
}
```

---

## Session Management

```javascript
/**
 * Check if user is authenticated
 */
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return { error }
  }

  return { data }
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    return { error }
  }
  return { data: { message: 'Signed out successfully' } }
}
```

---

## Next Steps

1. Implement the signup flow in your frontend
2. Add form validation
3. Add loading states
4. Add success/error notifications
5. Implement protected routes
6. Add session persistence
7. Test all error scenarios
