/**
 * WorkSure Supabase Auth Utilities
 * 
 * This file contains reusable functions for the signup and login flow.
 * Copy this file to your frontend project and customize as needed.
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// ERROR HANDLING
// ============================================

/**
 * User-friendly error handler
 */
export function handleAuthError(error) {
  const errorMap = {
    'EMAIL_EXISTS': 'This email is already registered. Please login instead.',
    'WEAK_PASSWORD': 'Password must be at least 8 characters long.',
    'INVALID_EMAIL': 'Please enter a valid email address.',
    'INVALID_CREDENTIALS': 'Invalid email or password.',
    'EMAIL_NOT_VERIFIED': 'Please verify your email before logging in.',
    'OTP_EXPIRED': 'This code has expired. Please request a new one.',
    'INVALID_OTP': 'Invalid verification code. Please try again.',
    'OTP_ALREADY_USED': 'This code has already been used. Please request a new one.',
    'DUPLICATE_NID': 'This NID is already registered.',
    'DUPLICATE_PHONE': 'This phone number is already registered.',
    'FILE_TOO_LARGE': 'Image size must be less than 5MB.',
    'INVALID_FILE_TYPE': 'Only JPEG, PNG, and WebP images are allowed.',
    'UPLOAD_FAILED': 'Failed to upload image. Please try again.',
    'NETWORK_ERROR': 'Network error. Please try again.',
    'NOT_AUTHENTICATED': 'You must be logged in to perform this action.',
    'RATE_LIMIT_EXCEEDED': 'Too many attempts. Please try again later.',
    'MISSING_REQUIRED_FIELD': 'Please fill in all required fields.',
    'INVALID_DATE': 'Please enter a valid date of birth.',
    'USER_NOT_FOUND': 'No account found with this email.',
    'ACCOUNT_SUSPENDED': 'Your account has been suspended. Please contact support.'
  }

  // Check if error has a code
  if (error?.code && errorMap[error.code]) {
    return {
      message: errorMap[error.code],
      code: error.code
    }
  }

  // Check error message for known patterns
  const message = error?.message || ''
  
  if (message.includes('already registered') || message.includes('User already registered')) {
    return { message: errorMap['EMAIL_EXISTS'], code: 'EMAIL_EXISTS' }
  }
  
  if (message.includes('Invalid login credentials')) {
    return { message: errorMap['INVALID_CREDENTIALS'], code: 'INVALID_CREDENTIALS' }
  }

  if (message.includes('not confirmed') || message.includes('not verified')) {
    return { message: errorMap['EMAIL_NOT_VERIFIED'], code: 'EMAIL_NOT_VERIFIED' }
  }

  if (message.includes('expired')) {
    return { message: errorMap['OTP_EXPIRED'], code: 'OTP_EXPIRED' }
  }

  if (message.includes('invalid') && message.includes('token')) {
    return { message: errorMap['INVALID_OTP'], code: 'INVALID_OTP' }
  }

  // Default error
  return {
    message: message || 'An unexpected error occurred. Please try again.',
    code: error?.code || 'UNKNOWN_ERROR'
  }
}

// ============================================
// STEP 1: EMAIL + PASSWORD SIGNUP
// ============================================

/**
 * Step 1: User signs up with email and password
 * @param {string} email - User email
 * @param {string} password - User password (min 8 chars)
 * @returns {Promise<{data, error}>}
 */
export async function signUpStep1(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      return {
        error: handleAuthError(error)
      }
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
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

// ============================================
// STEP 2: EMAIL OTP VERIFICATION
// ============================================

/**
 * Step 2: Verify OTP code sent to user's email
 * @param {string} email - User email
 * @param {string} token - OTP code from email
 * @returns {Promise<{data, error}>}
 */
export async function verifyOTPStep2(email, token) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email'
    })

    if (error) {
      return {
        error: handleAuthError(error)
      }
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
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

/**
 * Resend OTP code
 * @param {string} email - User email
 * @returns {Promise<{data, error}>}
 */
export async function resendOTP(email) {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) {
      return {
        error: handleAuthError({ message: 'Failed to resend code. Please try again.', code: 'RESEND_FAILED' })
      }
    }

    return {
      data: {
        message: 'Verification code sent to your email.'
      }
    }
  } catch (err) {
    return {
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

// ============================================
// STEP 3: PROFILE COMPLETION
// ============================================

/**
 * Upload profile image to Supabase Storage
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<{data, error}>}
 */
export async function uploadProfileImage(userId, file) {
  try {
    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        error: handleAuthError({ message: 'Image size must be less than 5MB.', code: 'FILE_TOO_LARGE' })
      }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        error: handleAuthError({ message: 'Only JPEG, PNG, and WebP images are allowed.', code: 'INVALID_FILE_TYPE' })
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
        error: handleAuthError({ message: 'Failed to upload image. Please try again.', code: 'UPLOAD_FAILED' })
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
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

/**
 * Step 3: Create user profile after OTP verification
 * @param {Object} profileData - Profile information
 * @param {File} profileImage - Profile picture file (optional)
 * @returns {Promise<{data, error}>}
 */
export async function completeProfileStep3(profileData, profileImage = null) {
  const { full_name, phone, nid, date_of_birth } = profileData
  
  try {
    // Get current user (should be authenticated after OTP verification)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        error: handleAuthError({ message: 'You must be logged in to complete your profile.', code: 'NOT_AUTHENTICATED' })
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
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('nid')) {
          return {
            error: handleAuthError({ message: 'This NID is already registered.', code: 'DUPLICATE_NID' })
          }
        }
        if (error.message.includes('phone')) {
          return {
            error: handleAuthError({ message: 'This phone number is already registered.', code: 'DUPLICATE_PHONE' })
          }
        }
      }

      if (error.code === '23502') { // Not null violation
        return {
          error: handleAuthError({ message: 'Please fill in all required fields.', code: 'MISSING_REQUIRED_FIELD' })
        }
      }

      return {
        error: handleAuthError(error)
      }
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
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

// ============================================
// STEP 4: LOGIN
// ============================================

/**
 * User login (after signup and profile completion)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{data, error}>}
 */
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      return {
        error: handleAuthError(error)
      }
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
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Get current user
 * @returns {Promise<{user, error}>}
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Get user profile
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {Promise<{data, error}>}
 */
export async function getUserProfile(userId = null) {
  try {
    // If userId not provided, get current user
    if (!userId) {
      const { user } = await getCurrentUser()
      if (!user) {
        return {
          error: handleAuthError({ message: 'You must be logged in.', code: 'NOT_AUTHENTICATED' })
        }
      }
      userId = user.id
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return { error: handleAuthError(error) }
    }

    return { data }
  } catch (err) {
    return {
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

/**
 * Update user profile
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<{data, error}>}
 */
export async function updateUserProfile(updates) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        error: handleAuthError({ message: 'You must be logged in.', code: 'NOT_AUTHENTICATED' })
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return { error: handleAuthError(error) }
    }

    return { data }
  } catch (err) {
    return {
      error: handleAuthError({ message: err.message, code: 'NETWORK_ERROR' })
    }
  }
}

/**
 * Sign out
 * @returns {Promise<{data, error}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    return { error: handleAuthError(error) }
  }
  return { data: { message: 'Signed out successfully' } }
}

// ============================================
// COMPLETE SIGNUP FLOW
// ============================================

/**
 * Complete signup flow orchestrator
 * @param {Object} signupData - All signup data
 * @param {string} signupData.email - User email
 * @param {string} signupData.password - User password
 * @param {string} signupData.otp - OTP code
 * @param {Object} signupData.profileData - Profile information
 * @param {File} signupData.profileImage - Profile picture (optional)
 * @returns {Promise<{data, error}>}
 */
export async function completeSignupFlow(signupData) {
  const { email, password, otp, profileData, profileImage } = signupData

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

// ============================================
// EXPORTS
// ============================================

export default {
  supabase,
  signUpStep1,
  verifyOTPStep2,
  resendOTP,
  completeProfileStep3,
  uploadProfileImage,
  login,
  checkAuth,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  signOut,
  completeSignupFlow,
  handleAuthError
}
