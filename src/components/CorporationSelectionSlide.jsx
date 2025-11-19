import React, { useState, useEffect } from 'react'
import logoImage from '../assets/image/ic_app_logo.png'
import backgroundImage from '../assets/image/logo-2.jpg'
import apiService from '../apidata.jsx'
import localStorageManager from '../utils/localStorage.js'

const CorporationSelectionSlide = ({ navigation }) => {
  const { navigate } = navigation
  const [selectedCorporation, setSelectedCorporation] = useState(null) // Will be set after API call
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [corporations, setCorporations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch corporations data from API
    const fetchCorporations = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiService.displayAllCorporation()
        setCorporations(data)
        
        // No default selection - user must select manually
      } catch (err) {
        console.error('Error fetching corporations:', err)
        
        // Check if it's an authentication error
        if (err.message.includes('Authentication failed') || err.message.includes('Invalid credentials')) {
          setError('Authentication failed. Please check API credentials in apidata.jsx')
        } else if (err.message.includes('API returned: Invalid User')) {
          setError('Invalid API credentials. Please update AUTH_CONFIG in apidata.jsx')
        } else if (err.message.includes('500 - Internal Server Error')) {
          setError('Server error. The display_all_corporation API may not be available on this server. Using fallback data.')
        } else {
          setError('Failed to load corporations. Using fallback data.')
        }
        
        // Ensure no stale data shown on error
        setCorporations([])
        // No default selection - user must select manually
      } finally {
        setLoading(false)
      }
    }

    fetchCorporations()

    // Animate in when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const filteredCorporations = corporations.filter(corp =>
    corp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    corp.englishName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCorporationClick = (corporation) => {
    // Check if user is already logged in (coming from admin dashboard)
    const isLoggedIn = localStorageManager.isLoggedIn()
    
    if (isLoggedIn) {
      // User is logged in - update session with new corporation
      const currentSession = localStorageManager.getSession()
      if (currentSession) {
        // Update session with new corporation data
        localStorageManager.updateSession({
          corporation: {
            id: corporation.id,
            name: corporation.name,
            englishName: corporation.englishName
          }
        })
      }
      
      // Clear navigation state to prevent redirect to login
      localStorageManager.clearNavigationState()
      
      // Navigate to panel selection
      setTimeout(() => {
        setSelectedCorporation(corporation.id)
        setTimeout(() => {
          navigate(`/panel/${corporation.id}`)
        }, 300)
      }, 500)
      return
    }
    
    // Fresh flow - user not logged in
    // Save navigation state to sessionStorage
    localStorageManager.saveNavigationState(`/panel/${corporation.id}`, {
      screen: 'panel',
      corporationId: corporation.id,
      corporationName: corporation.name
    })
    
    // Add delay before selection and navigation
    setTimeout(() => {
      setSelectedCorporation(corporation.id)
      // Add another small delay before navigation
      setTimeout(() => {
        navigate(`/panel/${corporation.id}`)
      }, 300)
    }, 500)
  }

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/')
    }, 300)
  }


  return (
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-500 flex flex-col ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Header Section with Background Image */}
      <div className="relative h-[35%] sm:h-[40%] md:h-[35%] lg:h-[30%] w-full flex-shrink-0">
        {/* Background Image */}
        <div className="absolute top-0 left-0 w-full h-full">
          <img 
            src={backgroundImage} 
            alt="Parliament Background" 
            className="w-full h-full object-cover object-center brightness-50"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-black/40"></div>
        </div>

        {/* Header Content */}
        <div className="relative z-20 h-full flex flex-col">
          {/* Back Button and Logo Row */}
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 flex-shrink-0 absolute left-4 top-4"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center justify-center flex-1">
              <img 
                src={logoImage} 
                alt="BJP Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 153, 51, 0.8)) drop-shadow(0 0 15px rgba(37, 125, 35, 0.4))'
                }}
              />
            </div>
            {/* <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0"></div> Spacer to balance */}
          </div>

          {/* Search Bar Section */}
          <div className="flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-4 xl:px-4">
            <div className="flex justify-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-lg xl:max-w-xl">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search Corporation Name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-2.5 sm:pl-4 lg:pl-3 xl:pl-3 pr-8 sm:pr-12 lg:pr-10 xl:pr-10 py-1.5 sm:py-3 lg:py-2 xl:py-2 bg-white rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500 shadow-lg text-xs sm:text-base lg:text-sm xl:text-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-4 lg:pr-3 xl:pr-3 pointer-events-none">
                  <svg 
                    className="w-4 h-4 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-5 xl:h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    strokeWidth="2.5"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Body Section with Small Boxes Side by Side */}
      <div className="relative flex-1 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 overflow-hidden">
        <div className="h-full px-4 pt-6 overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}>
          <div className="max-w-4xl mx-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#102463] mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg font-medium">Loading Corporations...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-red-700 text-lg font-medium mb-2">Error Loading Data</p>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!loading && !error && corporations.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="text-gray-500 text-4xl mb-4">📋</div>
                  <p className="text-gray-700 text-lg font-medium mb-2">No Corporations Available</p>
                  <p className="text-gray-600 text-sm">Please try again later</p>
                </div>
              </div>
            )}

            {/* Simple Grid Layout */}
            {!loading && !error && corporations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                {filteredCorporations.map((corporation, index) => (
                <div
                  key={corporation.id}
                  className="cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  onClick={() => handleCorporationClick(corporation)}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                   {/* Small Box Design */}
                   <div className={`relative h-auto rounded-lg sm:rounded-2xl overflow-hidden transition-all duration-300 ${
                     selectedCorporation === corporation.id
                       ? 'bg-gradient-to-br from-[#203D8C] to-[#102463] shadow-2xl scale-105'
                       : 'bg-white shadow-lg'
                   }`} style={{
                     boxShadow: selectedCorporation === corporation.id 
                       ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(16, 36, 99, 0.1)'
                       : '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                   }}>
                    
                     {/* Top Number Box */}
                     <div className="p-2 sm:p-4">
                       <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg flex items-center justify-center font-bold text-base sm:text-lg transition-all duration-300 ${
                         selectedCorporation === corporation.id
                           ? 'bg-white text-[#102463]'
                           : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                       }`} style={{
                         boxShadow: selectedCorporation === corporation.id 
                           ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                           : '0 4px 12px rgba(251, 146, 60, 0.3), 0 2px 4px rgba(251, 146, 60, 0.2)'
                       }}>
                         {corporation.id}
                       </div>
                     </div>
                     
                     {/* Corporation Info */}
                     <div className="px-2 sm:px-4 pb-2 sm:pb-4">
                       <div className={`p-2 sm:p-4 rounded-md transition-all duration-300 ${
                         selectedCorporation === corporation.id
                           ? 'bg-white/20 backdrop-blur-sm'
                           : 'bg-gray-50'
                       }`} style={{
                         boxShadow: selectedCorporation === corporation.id 
                           ? 'inset 0 1px 3px rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
                           : 'inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)'
                       }}>
                         <h3 className={`font-bold text-xs sm:text-sm leading-tight transition-colors duration-300 mb-0.5 sm:mb-1 ${
                           selectedCorporation === corporation.id
                             ? 'text-white'
                             : 'text-gray-800'
                         }`} style={{
                           letterSpacing: '0.3px'
                         }}>
                           {corporation.name}
                         </h3>
                         <p className={`text-[10px] sm:text-xs transition-colors duration-300 ${
                           selectedCorporation === corporation.id
                             ? 'text-blue-100'
                             : 'text-gray-600'
                         }`} style={{
                           letterSpacing: '0.2px'
                         }}>
                           {corporation.englishName}
                         </p>
                         
                       </div>
                     </div>
                    
                     {/* Selection Indicator */}
                     {selectedCorporation === corporation.id && (
                       <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                         <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                           <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                         </div>
                       </div>
                     )}
                    
                     {/* Bottom Accent Line */}
                     <div className={`absolute bottom-0 left-0 h-0.5 sm:h-1 w-full transition-all duration-300 ${
                       selectedCorporation === corporation.id
                         ? 'bg-gradient-to-r from-[#203D8C] to-[#0A1A4A]'
                         : ''
                     }`} style={{
                       backgroundColor: selectedCorporation === corporation.id ? '' : '#102463'
                     }}></div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Custom CSS for Scrollbar */}
      <style jsx>{`
        /* Custom Scrollbar Styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}

export default CorporationSelectionSlide
