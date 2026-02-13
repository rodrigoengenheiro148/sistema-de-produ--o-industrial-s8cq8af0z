import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
  updatePassword: (password: string) => Promise<{ data: any; error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Set up auth state listener FIRST
    // This handles subsequent updates and refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // It is FORBIDDEN to use async / await inside this callback
      if (mounted) {
        // Handle token refresh failure or network issues gracefully
        // If we get a SIGNED_OUT event but it was triggered by an error we might want to be careful,
        // but typically standard events are safe.
        // We focus on updating state.
        setSession(session)
        setUser(session?.user ?? null)

        // Log refresh events for debugging concurrent session issues
        if (event === 'TOKEN_REFRESHED') {
          console.debug('Session token refreshed successfully.')
        }

        // If we get an event, we are done loading
        setLoading(false)
      }
    })

    // THEN check for existing session
    // We add robust error handling here to prevent white screens on network failure
    // during the initial fetch.
    const checkSession = async () => {
      try {
        // Using getSession instead of getUser because getSession reads from local storage first (fast)
        // and verifies if valid. The supabase client custom fetch will retry if network fails.
        const { data, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.warn('Error checking initial session:', error.message)
          // Even if there is an error (e.g. network), we must stop loading
          // so the user sees the UI (e.g. login screen or public routes).
          // We set session to null to force re-login or public view.
          setSession(null)
          setUser(null)
        } else {
          setSession(data.session)
          setUser(data.session?.user ?? null)
        }
      } catch (err) {
        if (!mounted) return
        console.error('Unexpected exception during session check:', err)
        // In case of catastrophic failure (e.g. invalid URL or unhandled fetch error),
        // we ensure the app doesn't hang in loading
        setSession(null)
        setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
