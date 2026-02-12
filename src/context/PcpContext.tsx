import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

interface PcpContextType {
  isPcpAuthorized: boolean
  authorizePcp: (password: string) => boolean
  checkPcpAuth: (onAuthorized: () => void, onUnauthorized: () => void) => void
}

const PcpContext = createContext<PcpContextType | undefined>(undefined)

export const usePcp = () => {
  const context = useContext(PcpContext)
  if (context === undefined) {
    throw new Error('usePcp must be used within a PcpProvider')
  }
  return context
}

export const PcpProvider = ({ children }: { children: ReactNode }) => {
  const [isPcpAuthorized, setIsPcpAuthorized] = useState(false)

  const authorizePcp = (password: string) => {
    if (password === 'PCP') {
      setIsPcpAuthorized(true)
      return true
    }
    return false
  }

  const checkPcpAuth = (
    onAuthorized: () => void,
    onUnauthorized: () => void,
  ) => {
    if (isPcpAuthorized) {
      onAuthorized()
    } else {
      onUnauthorized()
    }
  }

  // Inactivity Timer
  useEffect(() => {
    let timer: NodeJS.Timeout

    const resetTimer = () => {
      if (isPcpAuthorized) {
        clearTimeout(timer)
        timer = setTimeout(
          () => {
            setIsPcpAuthorized(false)
            // Ideally we would show a toast here, but we are outside the Toaster context if it is in App.tsx
            // But since the user will just be prompted again, it is fine silently.
          },
          2 * 60 * 1000,
        ) // 2 minutes
      }
    }

    if (isPcpAuthorized) {
      // Set initial timer
      resetTimer()

      // Add listeners to detect activity
      const events = [
        'mousemove',
        'mousedown',
        'keydown',
        'scroll',
        'touchstart',
      ]
      events.forEach((event) => window.addEventListener(event, resetTimer))

      return () => {
        clearTimeout(timer)
        events.forEach((event) => window.removeEventListener(event, resetTimer))
      }
    }
  }, [isPcpAuthorized])

  return (
    <PcpContext.Provider
      value={{ isPcpAuthorized, authorizePcp, checkPcpAuth }}
    >
      {children}
    </PcpContext.Provider>
  )
}
