import React, { useState, useEffect } from 'react'
import logoImage from '../assets/image/ic_app_logo.png'
import backgroundImage from '../assets/image/logo-2.jpg'
import apiService from '../apidata.jsx'
import localStorageManager from '../utils/localStorage.js'

const PanelSelectionSlide = ({ navigation }) => {
  const { navigate, params } = navigation
  const { corporationId } = params
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [panels, setPanels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPanel, setSelectedPanel] = useState(null)

  // Get corporation name from API data
  const getCorporationName = () => {
    if (panels.length > 0 && (panels[0].corporationName || panels[0].corporation_name)) {
      return panels[0].corporationName || panels[0].corporation_name
    }
    return `Corporation ID: ${corporationId}`
  }

  // Debug logging
  console.log('PanelSelectionSlide - corporationId:', corporationId)
  console.log('PanelSelectionSlide - corporationId type:', typeof corporationId)
  console.log('PanelSelectionSlide - corporationId parsed:', parseInt(corporationId))
  console.log('PanelSelectionSlide - corporation name:', corporationId ? getCorporationName() : 'No corporationId')
  
  

  // Fetch panel data from API
  const fetchPanelData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching panel data for corporation:', corporationId)
      
      const panelData = await apiService.displayCorporationWisePanel(parseInt(corporationId))
      console.log('Panel data received:', panelData)
      
      setPanels(panelData || [])
    } catch (err) {
      console.error('Error fetching panel data:', err)
      setError(err.message || 'Failed to fetch panel data')
      // Fallback to empty array on error
      setPanels([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch panel data when component mounts
    fetchPanelData()
    
    // Animate in when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [corporationId])

  const filteredPanels = panels.filter(panel =>
    (panel.name || panel.panel_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePanelClick = (panel) => {
    const panelId = panel.id ?? panel.panel_no
    
    // Check if user is already logged in (coming from admin dashboard)
    const isLoggedIn = localStorageManager.isLoggedIn()
    
    if (isLoggedIn) {
      // User is logged in - update session with new panel and go directly to admin dashboard
      const currentSession = localStorageManager.getSession()
      if (currentSession) {
        // Update session with new panel data
        const updatedPanel = {
          ...currentSession.panel,
          id: panelId,
          panel_no: panelId,
          name: panel.name || panel.panel_name,
          ...panel
        }
        
        localStorageManager.updateSession({ panel: updatedPanel })
        
        // Get updated session for navigation
        const updatedSession = localStorageManager.getSession()
        
        // Clear navigation state
        localStorageManager.clearNavigationState()
        
        // Navigate directly to admin dashboard
        setTimeout(() => {
          setSelectedPanel(panelId)
          setTimeout(() => {
            navigate('/admin', { state: updatedSession })
          }, 300)
        }, 500)
        return
      }
    }
    
    // Fresh flow - user not logged in
    // Save navigation state to sessionStorage
    localStorageManager.saveNavigationState(`/login/${corporationId}/${panelId}`, {
      screen: 'login',
      corporationId: corporationId,
      panelId: panelId,
      panelName: panel.name || panel.panel_name
    })
    
    // Add delay before selection and navigation
    setTimeout(() => {
      setSelectedPanel(panelId)
      // Add another small delay before navigation
      setTimeout(() => {
        navigate(`/login/${corporationId}/${panelId}`)
      }, 300)
    }, 500)
  }

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/corporation')
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
          {/* Back Button, Corporation Name, and Logo Row */}
          <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3">
            {/* Back Button and Corporation Name Section */}
            <div className="absolute left-2 sm:left-4 top-2 sm:top-4 flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0 max-w-[60%] sm:max-w-none">
              <button 
                onClick={handleBack}
                className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center flex-shrink-0 min-w-0">
                <h2 className="text-white text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold truncate" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  letterSpacing: '0.3px'
                }}>
                  {getCorporationName()}
                </h2>
              </div>
            </div>

            {/* Logo Section */}
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
          </div>

          {/* Search Bar Section */}
          <div className="flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-4 xl:px-4">
            <div className="flex justify-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-lg xl:max-w-xl">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search Panel Name"
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

      {/* Body Section with Panel Cards */}
      <div className="relative flex-1 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 overflow-hidden">
        <div className="h-full px-4 pt-6 overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}>
          <div className="max-w-4xl mx-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading panels...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium mb-2">Error loading panels</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <button 
                    onClick={fetchPanelData}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Panel Grid - Only show when not loading and no error */}
            {!loading && !error && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                {filteredPanels.map((panel, index) => (
                <div
                  key={panel.id ?? panel.panel_no}
                  className="cursor-pointer transition-all duration-300 transform hover:scale-105"
                  onClick={() => handlePanelClick(panel)}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Panel Card Design */}
                  <div className={`relative h-full rounded-2xl overflow-hidden transition-all duration-300 ${
                    selectedPanel === (panel.id ?? panel.panel_no)
                      ? 'bg-gradient-to-br from-[#203D8C] to-[#102463] shadow-2xl scale-105'
                      : 'bg-white shadow-lg hover:shadow-xl'
                  }`} style={{
                    boxShadow: selectedPanel === panel.panel_no 
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(16, 36, 99, 0.1)'
                      : '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                  }}>
                    
                    {/* Top Panel ID Circle - Better Size */}
                    <div className="p-3 flex justify-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                        selectedPanel === (panel.id ?? panel.panel_no) 
                          ? 'bg-white text-[#102463]'
                          : 'bg-gradient-to-br from-orange-400 to-orange-500 text-white'
                      }`} style={{
                        boxShadow: selectedPanel === panel.panel_no 
                          ? '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
                          : '0 4px 12px rgba(251, 146, 60, 0.3), 0 2px 4px rgba(251, 146, 60, 0.2)'
                      }}>
                        {panel.id ?? panel.panel_no}
                      </div>
                    </div>
                    
                    {/* Panel Info - Better Readability */}
                    <div className="px-3 pb-3 flex-1">
                      <div className={`p-3 rounded-lg transition-all duration-300 ${
                        selectedPanel === (panel.id ?? panel.panel_no)
                          ? 'bg-white/20 backdrop-blur-sm'
                          : 'bg-gray-50'
                      }`} style={{
                        boxShadow: selectedPanel === panel.panel_no 
                          ? 'inset 0 1px 3px rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)'
                          : 'inset 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}>
                        <h3 className={`font-bold text-sm leading-tight transition-colors duration-300 mb-2 text-center ${
                          selectedPanel === panel.panel_no
                            ? 'text-white'
                            : 'text-gray-800'
                        }`} style={{
                          letterSpacing: '0.3px'
                        }}>
                          {panel.name || panel.panel_name}
                        </h3>
                        
                        {/* Voter Count */}
                        <div className="text-center mb-2">
                          <div className={`text-xs font-medium transition-colors duration-300 ${
                            selectedPanel === (panel.id ?? panel.panel_no)
                              ? 'text-blue-100'
                              : 'text-gray-600'
                          }`} style={{
                            letterSpacing: '0.2px'
                          }}>
                            Voter : {(panel.voters ?? panel.total_voter ?? 0).toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Status Indicator */}
                        <div className="flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            (panel.voters ?? panel.total_voter ?? 0) > 0 ? 'bg-blue-400' : 'bg-gray-400'
                          }`}></div>
                          <span className={`text-xs font-medium ${
                            (panel.voters ?? panel.total_voter ?? 0) > 0 ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {(panel.voters ?? panel.total_voter ?? 0) > 0 ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection Indicator */}
                    {selectedPanel === (panel.id ?? panel.panel_no) && (
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
                      selectedPanel === (panel.id ?? panel.panel_no)
                        ? 'bg-gradient-to-r from-[#203D8C] to-[#0A1A4A]'
                        : ''
                    }`} style={{
                      backgroundColor: selectedPanel === panel.panel_no ? '' : '#102463'
                    }}></div>
                  </div>
                </div>
              ))}
              </div>
            )}

            {/* No panels found message */}
            {!loading && !error && filteredPanels.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <p className="text-gray-600 font-medium">No panels found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search term</p>
                </div>
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

export default PanelSelectionSlide
