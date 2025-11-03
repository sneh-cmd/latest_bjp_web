import React, { useState, useEffect } from 'react'
import logoImage from '../assets/image/BJP-Logo.png'
import backgroundImage from '../assets/image/logo-2.jpg'
import apiService from '../apidata.jsx'

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
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Header Section with Background Image */}
      <div className="relative h-[35%] sm:h-[40%] md:h-[35%] lg:h-[30%] w-full">
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
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
            <button 
              onClick={handleBack}
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-7 sm:w-8"></div> {/* Spacer */}
          </div>

          {/* BJP Logo */}
          <div className="flex-1 flex items-center justify-center sm:items-start sm:justify-start sm:ml-[5%] mt-[3%]">
            <img 
              src={logoImage} 
              alt="BJP Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 153, 51, 0.8)) drop-shadow(0 0 15px rgba(37, 125, 35, 0.4))'
              }}
            />
          </div>

          {/* Attractive Header Text */}
          <div className="px-3 sm:px-4 pb-2 text-center sm:text-left">
            <h2 className="text-white text-base sm:text-lg font-semibold mb-1" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              letterSpacing: '0.5px'
            }}>
              Select Your Corporation
            </h2>
            <p className="text-white/80 text-xs sm:text-sm" style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
            }}>
              Choose your municipal corporation to continue
            </p>
          </div>

          {/* Search Bar - Responsive */}
          <div className="absolute top-24 sm:top-28 md:top-32 left-1/2 transform -translate-x-1/2 px-3 sm:px-4 pb-2 flex justify-center">
            <div className="relative w-64 sm:w-80 md:w-96 lg:w-112">
                <input
                  type="text"
                  placeholder="Search by Corporation or City Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10 bg-white rounded-xl border-0 focus:outline-none text-gray-800 placeholder-gray-500 shadow-lg text-sm sm:text-base"
                />
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Body Section with Small Boxes Side by Side */}
      <div className="relative h-[65%] bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 overflow-hidden">
        <div className="h-full px-4 pt-6 pb-2 overflow-y-auto" style={{
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
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
                   <div className={`relative h-auto rounded-2xl overflow-hidden transition-all duration-300 ${
                     selectedCorporation === corporation.id
                       ? 'bg-gradient-to-br from-[#203D8C] to-[#102463] shadow-2xl scale-105'
                       : 'bg-white shadow-lg'
                   }`} style={{
                     boxShadow: selectedCorporation === corporation.id 
                       ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(16, 36, 99, 0.1)'
                       : '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                   }}>
                    
                     {/* Top Number Box */}
                     <div className="p-4">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-300 ${
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
                     <div className="px-4 pb-4">
                       <div className={`p-4 rounded-md transition-all duration-300 ${
                         selectedCorporation === corporation.id
                           ? 'bg-white/20 backdrop-blur-sm'
                           : 'bg-gray-50'
                       }`} style={{
                         boxShadow: selectedCorporation === corporation.id 
                           ? 'inset 0 1px 3px rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
                           : 'inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)'
                       }}>
                         <h3 className={`font-bold text-sm leading-tight transition-colors duration-300 mb-1 ${
                           selectedCorporation === corporation.id
                             ? 'text-white'
                             : 'text-gray-800'
                         }`} style={{
                           letterSpacing: '0.3px'
                         }}>
                           {corporation.name}
                         </h3>
                         <p className={`text-xs transition-colors duration-300 ${
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
                       <div className="absolute top-2 right-2">
                         <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                         </div>
                       </div>
                     )}
                    
                     {/* Bottom Accent Line */}
                     <div className={`absolute bottom-0 left-0 h-1 w-full transition-all duration-300 ${
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
