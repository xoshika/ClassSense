import { createContext, useContext, useState, useCallback, useRef } from 'react'

const SessionContext = createContext(null)

export const SessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null)
  const [isDirty, setIsDirty] = useState(false)
  const pendingNavigation = useRef(null)

  const setSession = useCallback((session) => {
    setActiveSession(session)
    setIsDirty(!!session)
  }, [])

  const markDirty = useCallback(() => setIsDirty(true), [])
  const markClean = useCallback(() => setIsDirty(false), [])

  const confirmNavigation = useCallback((callback) => {
    if (!isDirty) {
      callback()
      return
    }
    pendingNavigation.current = callback
    return true
  }, [isDirty])

  const proceedNavigation = useCallback(() => {
    if (pendingNavigation.current) {
      pendingNavigation.current()
      pendingNavigation.current = null
    }
    setIsDirty(false)
  }, [])

  const cancelNavigation = useCallback(() => {
    pendingNavigation.current = null
  }, [])

  return (
    <SessionContext.Provider value={{
      activeSession,
      setSession,
      isDirty,
      markDirty,
      markClean,
      confirmNavigation,
      proceedNavigation,
      cancelNavigation
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}