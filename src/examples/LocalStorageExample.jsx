// Example of how to use localStorage session management
import React from 'react'
import localStorageManager from '../utils/localStorage.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

// Example 1: Using localStorage manager directly
const DirectUsageExample = () => {
  const handleLogin = () => {
    const sessionData = {
      corporation: { id: 1, name: 'ठाणे महानगरपालिका' },
      panel: { id: 2, name: 'Panel 2', voters: 45132 },
      phoneNumber: '9876543210',
      admin: { name: 'Admin User', type: 'admin' }
    }
    
    localStorageManager.saveSession(sessionData)
    console.log('Session saved!')
  }

  const handleLogout = () => {
    localStorageManager.clearSession()
    console.log('Session cleared!')
  }

  const checkSession = () => {
    const isLoggedIn = localStorageManager.isLoggedIn()
    const userData = localStorageManager.getUserData()
    console.log('Is logged in:', isLoggedIn)
    console.log('User data:', userData)
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Direct Usage Example</h2>
      <div className="space-x-2">
        <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
          Login
        </button>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
        <button onClick={checkSession} className="bg-green-500 text-white px-4 py-2 rounded">
          Check Session
        </button>
      </div>
    </div>
  )
}

// Example 2: Using the custom hook
const HookUsageExample = () => {
  const { isLoggedIn, userData, sessionInfo, login, logout } = useLocalStorage()

  const handleLogin = () => {
    const sessionData = {
      corporation: { id: 1, name: 'ठाणे महानगरपालिका' },
      panel: { id: 2, name: 'Panel 2', voters: 45132 },
      phoneNumber: '9876543210',
      admin: { name: 'Admin User', type: 'admin' }
    }
    
    const success = login(sessionData)
    if (success) {
      console.log('Login successful!')
    } else {
      console.log('Login failed!')
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Hook Usage Example</h2>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {isLoggedIn ? 'Logged In' : 'Not Logged In'}</p>
        {userData && (
          <div>
            <p><strong>User:</strong> {userData.admin?.name}</p>
            <p><strong>Phone:</strong> {userData.phoneNumber}</p>
            <p><strong>Corporation:</strong> {userData.corporation?.name}</p>
            <p><strong>Panel:</strong> {userData.panel?.name}</p>
          </div>
        )}
      </div>

      <div className="space-x-2">
        <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
          Login
        </button>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>
    </div>
  )
}

// Example 3: Session validation for API calls
const APICallExample = () => {
  const makeAuthenticatedAPICall = async (apiFunction, ...args) => {
    try {
      // Validate session before making API call
      localStorageManager.validateSession()
      
      // Make the API call
      const result = await apiFunction(...args)
      
      console.log('API call successful:', result)
      return result
    } catch (error) {
      if (error.message.includes('No active session')) {
        console.log('No active session, redirecting to login')
        // Handle no session - redirect to login
      }
      throw error
    }
  }

  const handleAPICall = async () => {
    try {
      // Example API call with session validation
      await makeAuthenticatedAPICall(() => {
        return Promise.resolve({ data: 'API response' })
      })
    } catch (error) {
      console.error('API call failed:', error)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">API Call Example</h2>
      <button onClick={handleAPICall} className="bg-purple-500 text-white px-4 py-2 rounded">
        Make Authenticated API Call
      </button>
    </div>
  )
}

// Main example component
const LocalStorageExample = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">LocalStorage Session Management Examples</h1>
      
      <div className="space-y-8">
        <DirectUsageExample />
        <HookUsageExample />
        <APICallExample />
      </div>
    </div>
  )
}

export default LocalStorageExample
