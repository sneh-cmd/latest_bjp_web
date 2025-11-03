// LocalStorage Session Management for BJP Web Application
// Handles user session data with localStorage persistence

class LocalStorageManager {
  constructor() {
    this.SESSION_KEY = 'bjp_user_session'
    this.LOGIN_TIME_KEY = 'bjp_login_time'
  }

  // Save session data to localStorage
  saveSession(userData) {
    try {
      const sessionData = {
        ...userData,
        loginTime: new Date().toISOString(),
        sessionId: this.generateSessionId()
      }
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
      localStorage.setItem(this.LOGIN_TIME_KEY, new Date().toISOString())
      
      console.log('Session saved to localStorage:', {
        sessionId: sessionData.sessionId,
        loginTime: sessionData.loginTime,
        phoneNumber: userData.phoneNumber
      })
      
      return sessionData
    } catch (error) {
      console.error('Error saving session to localStorage:', error)
      throw new Error('Failed to save session')
    }
  }

  // Get session data from localStorage
  getSession() {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      
      if (!sessionData) {
        return null
      }
      
      return JSON.parse(sessionData)
    } catch (error) {
      console.error('Error getting session from localStorage:', error)
      this.clearSession()
      return null
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    const session = this.getSession()
    return session !== null
  }

  // Get user data from session
  getUserData() {
    const session = this.getSession()
    return session ? {
      corporation: session.corporation,
      panel: session.panel,
      phoneNumber: session.phoneNumber,
      admin: session.admin,
      allAdmins: session.allAdmins,
      loginTime: session.loginTime,
      sessionId: session.sessionId,
      apiUrl: session.apiUrl
    } : null
  }

  // Update session data
  updateSession(updates) {
    try {
      const currentSession = this.getSession()
      if (!currentSession) {
        throw new Error('No active session to update')
      }
      
      const updatedSession = {
        ...currentSession,
        ...updates,
        lastUpdated: new Date().toISOString()
      }
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession))
      return updatedSession
    } catch (error) {
      console.error('Error updating session:', error)
      throw new Error('Failed to update session')
    }
  }

  // Clear session data (logout)
  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY)
      localStorage.removeItem(this.LOGIN_TIME_KEY)
      console.log('Session cleared from localStorage')
    } catch (error) {
      console.error('Error clearing session:', error)
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Get session info for debugging
  getSessionInfo() {
    const session = this.getSession()
    const loginTime = localStorage.getItem(this.LOGIN_TIME_KEY)
    
    return {
      isActive: session !== null,
      sessionId: session?.sessionId || null,
      loginTime: session?.loginTime || loginTime,
      userData: session ? {
        corporation: session.corporation?.name,
        panel: session.panel?.name,
        phoneNumber: session.phoneNumber,
        adminName: session.admin?.name,
        apiUrl: session.apiUrl
      } : null
    }
  }

  // Validate session before API calls
  validateSession() {
    const session = this.getSession()
    if (!session) {
      throw new Error('No active session. Please login.')
    }
    return session
  }

  // Get API URL from session
  getApiUrl() {
    const session = this.getSession()
    return session?.apiUrl || null
  }
}

// Create singleton instanced
const localStorageManager = new LocalStorageManager()

// Export the localStorage manager
export default localStorageManager

// Export individual functions for convenience
export const {
  saveSession,
  getSession,
  updateSession,
  isLoggedIn,
  getUserData,
  clearSession,
  getSessionInfo,
  validateSession,
  getApiUrl
} = localStorageManager
