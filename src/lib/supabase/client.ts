import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Safely access environment variables with fallbacks to avoid immediate crashes before validation
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Helper to validate URL structure
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Basic validation logging to help debugging
if (!isValidUrl(SUPABASE_URL) || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    'Supabase URL or Key is missing or invalid. Please check your .env configuration.',
  )
}

// Use a fallback URL if the env var is invalid to prevent createClient from throwing synchronously
// This ensures the app can at least initialize the JS runtime without crashing immediately
const validUrl = isValidUrl(SUPABASE_URL)
  ? SUPABASE_URL!
  : 'https://placeholder.supabase.co'
const validKey = SUPABASE_PUBLISHABLE_KEY || 'placeholder-key'

export const supabase = createClient<Database>(validUrl, validKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Enhances reliability of auth redirects
  },
})

// Safeguard against "Failed to fetch" errors during token refresh
// This monkey-patch catches network errors in the internal _refreshAccessToken method
// preventing unhandled promise rejections that could crash the application.
// This is critical for Dashboard availability during network instability.
const authClient = supabase.auth as any
if (authClient && typeof authClient._refreshAccessToken === 'function') {
  const originalRefresh = authClient._refreshAccessToken.bind(authClient)
  authClient._refreshAccessToken = async (...args: any[]) => {
    try {
      return await originalRefresh(...args)
    } catch (error) {
      console.warn(
        'Supabase auth refresh failed (network issue suspected). Suppressing crash.',
        error,
      )
      // Return an error structure that Supabase expects to prevent upstream crashes
      return {
        data: { session: null, user: null },
        error: error || new Error('Failed to refresh access token'),
      }
    }
  }
}
