import React, { useState, useEffect } from 'react'
import logoImage from '../assets/image/BJP-Logo.png'
import backgroundGif from '../assets/GIF/1-slider (13).gif'
import pmModiImage from '../assets/image/pm-modi.png'
import apiService from '../apidata.jsx'
import localStorageManager from '../utils/localStorage.js'

const LoginSlide = ({ navigation }) => {
  const { navigate, params } = navigation
  const { corporationId, panelId } = params
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [adminData, setAdminData] = useState(null)
  const [loginError, setLoginError] = useState(null)
  const [panelData, setPanelData] = useState(null)

  // Get corporation name from ID
  const getCorporationName = (id) => {
    const corporations = {
      1: 'बृहन्मुंबई महानगरपालिका',
      2: 'ठाणे महानगरपालिका',
      5: 'नवी मुंबई महानगरपालिका',
      9: 'पुणे महानगरपालिका',
      16: 'नागपुर महानगरपालिका',
      17: 'अमरावती महानगरपालिका',
      18: 'चंद्रपुर महानगरपालिका'
    }
    return corporations[id] || `Unknown Corporation (ID: ${id})`
  }

  // Get panel data from API - fallback to basic info if not available
  const getPanelData = (corporationId, panelId) => {
    // Return basic panel info as fallback
    return { id: panelId, name: `Panel ${panelId}`, voters: 0 }
  }

  const selectedCorporation = { id: parseInt(corporationId), name: getCorporationName(parseInt(corporationId)) }
  const selectedPanel = panelData || getPanelData(parseInt(corporationId), parseInt(panelId))

  // Fetch panel data to get the API URL
  const fetchPanelData = async () => {
    try {
      console.log('Fetching panel data for corporation:', corporationId)
      const panels = await apiService.displayCorporationWisePanel(parseInt(corporationId))
      const panel = panels.find(p => p.id === parseInt(panelId))
      if (panel) {
        setPanelData(panel)
        console.log('Panel data loaded:', panel)
      } else {
        console.warn('Panel not found in API data, using fallback')
        setPanelData(getPanelData(parseInt(corporationId), parseInt(panelId)))
      }
    } catch (error) {
      console.error('Error fetching panel data:', error)
      // Use fallback data when API fails
      setPanelData(getPanelData(parseInt(corporationId), parseInt(panelId)))
    }
  }

  useEffect(() => {
    // Check if user is already logged in
    const existingSession = localStorageManager.getSession()
    if (existingSession) {
      console.log('Existing session found, redirecting to admin dashboard:', existingSession)
      // Navigate directly to admin dashboard if already logged in
      navigate('/admin', {
        state: existingSession
      })
      return
    }
    
    // Fetch panel data
    fetchPanelData()
    
    // Animate in when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [corporationId, panelId, navigate])

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 10) {
      setPhoneNumber(value)
    }
  }

  const handleLogin = async () => {
    console.log('Login button clicked!', { phoneNumber, length: phoneNumber.length })
    
    if (phoneNumber.length !== 10) {
      alert('कृपया 10 अंकों का वैध फोन नंबर दर्ज करें')
      return
    }

    console.log('Starting login process...')
    setIsLoading(true)
    setLoginError(null)
    
    try {
      // Get the panel API URL for admin login
      // Note: apiUrl should be base URL only (e.g., http://tmc1.mhbjplok.com)
      // The /webservice.asmx will be appended in adminLogin function
      const panelApiUrl = panelData?.apiUrl || `http://tmc${panelId}.mhbjplok.com`
      console.log('Using panel API URL:', panelApiUrl)
      
      // Call the admin login API
      const adminResponse = await apiService.adminLogin(phoneNumber, panelApiUrl, "1", "")
      console.log('Admin login response:', adminResponse)
      
      if (adminResponse && adminResponse.length > 0) {
        // Store the first admin data (you can modify this logic based on your needs)
        const admin = adminResponse[0]
        
        // Save session data to localStorage
        const sessionData = {
          corporation: selectedCorporation,
          panel: selectedPanel,
          phoneNumber: phoneNumber,
          admin: admin,
          allAdmins: adminResponse
        }
        
        try {
          localStorageManager.saveSession(sessionData)
          console.log('Session saved to localStorage for user:', admin.name)
        } catch (error) {
          console.error('Failed to save session:', error)
          // Continue with login even if session saving fails
        }
        
        // Navigate directly to admin dashboard (skip success screen)
        console.log('Login successful, navigating directly to admin dashboard')
        navigate('/admin', {
          state: sessionData
        })
      } else {
        throw new Error('No admin found for this phone number')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setLoginError(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate(`/panel/${corporationId}`)
    }, 300)
  }

  // Logout function
  const handleLogout = () => {
    // Clear session from localStorage
    localStorageManager.clearSession()
    
    // Reset component state
    setAdminData(null)
    setPhoneNumber('')
    
    console.log('User logged out and session cleared from localStorage')
    
    // Navigate back to corporation selection
    navigate('/corporation')
  }

  return (
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Animated GIF Background */}
      <div className="absolute inset-0">
        <img 
          src={backgroundGif} 
          alt="Background Animation" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/80 to-[#1e40af]/80"></div>
      </div>
      
      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <button 
          onClick={handleBack}
          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Main Container - Single Border Design */}
      <div className="relative z-10 h-full flex items-center justify-center px-2 sm:px-4 py-4 sm:py-0">
        {/* Single White Container with both sides */}
        <div className="w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col sm:flex-row" style={{
          boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          minHeight: '400px'
        }}>
          
          {/* Left Side - PM Modi Image */}
          <div className="w-full sm:w-1/2 h-48 sm:h-auto relative overflow-hidden">
            {/* Background with PM Modi Image */}
            <div className="absolute inset-0">
              <img 
                src={pmModiImage} 
                alt="PM Narendra Modi" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a]/70 to-[#1e40af]/70"></div>
            </div>
            
            {/* Content Overlay */}
            <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-6">
              {/* Top - BJP Logo */}
              <div className="flex items-center animate-fade-in-left">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg border border-white/30">
                  <img 
                    src={logoImage} 
                    alt="BJP Logo" 
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                </div>
                <div className="ml-2 sm:ml-3">
                  <h1 className="text-white text-sm sm:text-lg font-bold drop-shadow-lg">भारतीय जनता पार्टी</h1>
                  <p className="text-white/80 text-xs drop-shadow-md">Bharatiya Janata Party</p>
                </div>
              </div>
              
              {/* Center - Main Text */}
              <div className="text-center animate-fade-in-up">
                <h2 className="text-white text-xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                  संसद चुनाव 2024
                </h2>
                <p className="text-white/90 text-sm sm:text-base drop-shadow-md">
                  Digital India Initiative
                </p>
                {/* Animated underline */}
                <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-orange-400 to-white mx-auto mt-2 sm:mt-3 rounded-full animate-pulse"></div>
              </div>
              
              {/* Bottom - Decorative Elements */}
              <div className="flex justify-center space-x-2 animate-fade-in-right">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full sm:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-white relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16 opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-orange-50 to-yellow-50 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12 opacity-60"></div>
            
            <div className="w-full max-w-xs relative z-10">
              
              {/* Panel Info */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">
                  {selectedPanel?.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 rounded-full inline-block">
                  {selectedCorporation?.name}
                </p>
              </div>

              {/* Input Field */}
              <div className="mb-4 sm:mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="10 अंकों का फोन नंबर दर्ज करें"
                    className="relative w-full px-3 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base font-medium bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg transition-all duration-300 placeholder-gray-400"
                    style={{
                      letterSpacing: '1px'
                    }}
                    maxLength={10}
                  />
                  {phoneNumber.length > 0 && (
                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full shadow-sm ${
                        phoneNumber.length === 10 ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                      }`}></div>
                    </div>
                  )}
                  {/* Phone Icon */}
                  <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  अपना पंजीकृत फोन नंबर दर्ज करें
                </p>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{loginError}</p>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <div className="mb-4 sm:mb-6">
                <button
                  onClick={handleLogin}
                  disabled={phoneNumber.length !== 10 || isLoading}
                  className={`w-full py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 relative overflow-hidden border-2 ${
                    phoneNumber.length === 10 && !isLoading
                      ? 'bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white shadow-lg hover:shadow-xl hover:scale-105 border-blue-600'
                      : 'bg-gray-200 text-gray-600 cursor-not-allowed border-gray-300'
                  }`}
                  style={{
                    boxShadow: phoneNumber.length === 10 && !isLoading 
                      ? '0 10px 25px -3px rgba(30, 58, 138, 0.3), 0 4px 6px -2px rgba(30, 58, 138, 0.1)'
                      : '0 4px 6px -2px rgba(0, 0, 0, 0.1)',
                    minHeight: '48px'
                  }}
                >
                  {/* Button Shine Effect */}
                  {phoneNumber.length === 10 && !isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
                  )}
                  {isLoading ? (
                    <div className="flex items-center justify-center relative z-10">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm sm:text-base">प्रोसेसिंग...</span>
                    </div>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm sm:text-base">लॉग इन करें</span>
                      {phoneNumber.length === 10 && (
                        <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </span>
                  )}
                </button>
              </div>

              {/* Additional Info */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 sm:p-3 border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 space-y-1 sm:space-y-0">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Panel ID: {selectedPanel?.id}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{selectedPanel?.voters?.toLocaleString() || '0'} Voters</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default LoginSlide
