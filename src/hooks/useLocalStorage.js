import { useState, useEffect } from 'react'
import localStorageManager from '../utils/localStorage.js'

// Custom hook for localStorage session management
export const useLocalStorage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null)

  useEffect(() => {
    const checkAuth = () => {
      const isValid = localStorageManager.isLoggedIn()
      setIsLoggedIn(isValid)
      
      if (isValid) {
        setUserData(localStorageManager.getUserData())
        setSessionInfo(localStorageManager.getSessionInfo())
      } else {
        setUserData(null)
        setSessionInfo(null)
      }
    }

    checkAuth()

    // Listen for storage changes (when localStorage is modified in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'bjp_user_session' || e.key === 'bjp_login_time') {
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = (sessionData) => {
    try {
      localStorageManager.saveSession(sessionData)
      setIsLoggedIn(true)
      setUserData(localStorageManager.getUserData())
      setSessionInfo(localStorageManager.getSessionInfo())
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = () => {
    localStorageManager.clearSession()
    setIsLoggedIn(false)
    setUserData(null)
    setSessionInfo(null)
  }

  const updateUserData = (updates) => {
    try {
      localStorageManager.updateSession(updates)
      setUserData(localStorageManager.getUserData())
      setSessionInfo(localStorageManager.getSessionInfo())
      return true
    } catch (error) {
      console.error('Update failed:', error)
      return false
    }
  }

  return {
    isLoggedIn,
    userData,
    sessionInfo,
    login,
    logout,
    updateUserData
  }
}

export default useLocalStorage
