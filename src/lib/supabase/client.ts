import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Safely access environment variables with fallbacks to avoid immediate crashes before validation
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

// Basic validation logging to help debugging
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    'Supabase URL or Key is missing. Please check your .env configuration.',
  )
}

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // Enhances reliability of auth redirects
    },
  },
)
