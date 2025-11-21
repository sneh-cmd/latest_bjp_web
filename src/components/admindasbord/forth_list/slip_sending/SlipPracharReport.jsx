import React, { useRef, useState, useEffect, useCallback } from 'react'
import { get_total_slip_distribution_count } from '../../../../apidata'
import apiService from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'

const getPanelVoterValue = (panel) => {
  if (!panel) return 0
  const keys = [
    'voters',
    'total_voter',
    'totalVoter',
    'total_voters',
    'totalVoters',
    'voter',
    'total'
  ]

  for (const key of keys) {
    const value = panel[key]
    if (value === undefined || value === null || value === '') continue
    const numericValue = Number(value)
    if (!Number.isNaN(numericValue) && numericValue > 0) {
      return numericValue
    }
  }

  return 0
}

const SlipPracharReport = ({ navigation }) => {
  const { navigate } = navigation
  const containerRef = useRef(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [distributionData, setDistributionData] = useState({
    whtsapp: 0,
    web: 0,
    sms: 0,
    print: 0
  })
  const [loading, setLoading] = useState(true)
  const [totalVoters, setTotalVoters] = useState(() => {
    const userData = localStorageManager.getUserData()
    return getPanelVoterValue(userData?.panel) || 45132
  })

  // Get user data and fetch total voters if not available
  useEffect(() => {
    const userData = localStorageManager.getUserData()
    const panelVoterCount = getPanelVoterValue(userData?.panel)
    
    if (panelVoterCount > 0) {
      setTotalVoters(panelVoterCount)
      return
    }

    // If not found in localStorage, try to fetch from API
    const corporationId =
      userData?.corporation?.id ||
      userData?.corporation_id ||
      userData?.panel?.corporation_id

    const panelId = userData?.panel?.id || userData?.panel?.panel_no

    if (!corporationId || !panelId) return

    let isMounted = true

    const fetchPanelDetails = async () => {
      try {
        const panels = await apiService.displayCorporationWisePanel(corporationId)
        if (!Array.isArray(panels)) return

        const currentPanel = panels.find(
          (panel) => (panel.id ?? panel.panel_no) === panelId
        )

        if (!currentPanel) return

        const voters = getPanelVoterValue(currentPanel)
        if (voters > 0 && isMounted) {
          setTotalVoters(voters)
          try {
            localStorageManager.updateSession({
              panel: {
                ...userData?.panel,
                ...currentPanel,
                voters
              }
            })
          } catch (error) {
            console.warn('Failed to update panel data in session:', error)
          }
        }
      } catch (error) {
        console.error('Failed to fetch panel voters:', error)
      }
    }

    fetchPanelDetails()

    return () => {
      isMounted = false
    }
  }, [])

  // Calculate sent and not sent counts from API data
  const sentCount = distributionData.whtsapp + distributionData.sms + distributionData.print
  const notSentCount = totalVoters - sentCount

  // Fetch distribution data from API
  const fetchDistributionData = useCallback(async () => {
    try {
      setLoading(true)
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await get_total_slip_distribution_count(panelApiUrl)
      
      console.log('Distribution data response:', response)
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        setDistributionData({
          whtsapp: response.whtsapp || 0,
          web: response.web || 0,
          sms: response.sms || 0,
          print: response.print || 0
        })
      } else if (Array.isArray(response) && response.length > 0) {
        // If response is an array, take the first item
        setDistributionData({
          whtsapp: response[0].whtsapp || 0,
          web: response[0].web || 0,
          sms: response[0].sms || 0,
          print: response[0].print || 0
        })
      }
    } catch (error) {
      console.error('Error fetching distribution data:', error)
      // Keep default values on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDistributionData()
  }, [fetchDistributionData])

  // Use API data
  const whatsappCount = distributionData.whtsapp
  const smsCount = distributionData.sms
  const printSlipCount = distributionData.print

  // Calculate percentage for the donut chart
  const sentPercentage = (sentCount / totalVoters) * 100
  const notSentPercentage = (notSentCount / totalVoters) * 100

  const handleBack = () => {
    navigate(-1)
  }

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Smooth scroll to top on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Navigation buttons data
  const navigationButtons = [
    {
      id: 'my-phonebook',
      label: 'मेरा फोनबुक पर्ची रिपोर्ट',
      icon: (
        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Phonebook cover - light blue */}
          <rect x="20" y="15" width="60" height="70" rx="3" fill="#93c5fd" stroke="#3b82f6" strokeWidth="2"/>
          {/* Phonebook pages - white */}
          <rect x="25" y="20" width="50" height="60" rx="2" fill="white"/>
          {/* Person silhouette - dark gray */}
          <circle cx="50" cy="40" r="8" fill="#4b5563"/>
          <rect x="42" y="48" width="16" height="20" rx="8" fill="#4b5563"/>
          {/* Lines on pages */}
          <line x1="30" y1="55" x2="70" y2="55" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="30" y1="62" x2="65" y2="62" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="30" y1="69" x2="60" y2="69" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => navigate('/my-phonebook-slip-report')
    },
    {
      id: 'booth-wise',
      label: 'बूथ अनुसार',
      icon: (
        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Voting booth base - dark blue */}
          <rect x="25" y="50" width="50" height="35" rx="2" fill="#1e3a8a" stroke="#1e40af" strokeWidth="2"/>
          {/* Red curtain */}
          <path d="M25 50 Q50 30 75 50 L75 85 Q50 65 25 85 Z" fill="#dc2626" stroke="#b91c1c" strokeWidth="2"/>
          {/* Curtain folds */}
          <path d="M40 50 Q45 42 50 50" stroke="#b91c1c" strokeWidth="1.5" fill="none"/>
          <path d="M50 50 Q55 42 60 50" stroke="#b91c1c" strokeWidth="1.5" fill="none"/>
          {/* Booth door outline */}
          <rect x="35" y="55" width="30" height="25" rx="1" fill="none" stroke="#1e40af" strokeWidth="1.5" strokeDasharray="2 2"/>
        </svg>
      ),
      onClick: () => navigate('/booth-wise-slip-report')
    },
    {
      id: 'phonebook-wise',
      label: 'फोनबूक अनुसार',
      icon: (
        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Phonebook cover - light blue */}
          <rect x="20" y="15" width="60" height="70" rx="3" fill="#93c5fd" stroke="#3b82f6" strokeWidth="2"/>
          {/* Phonebook pages - white */}
          <rect x="25" y="20" width="50" height="60" rx="2" fill="white"/>
          {/* Person silhouette - dark gray */}
          <circle cx="50" cy="40" r="8" fill="#4b5563"/>
          <rect x="42" y="48" width="16" height="20" rx="8" fill="#4b5563"/>
          {/* Lines on pages */}
          <line x1="30" y1="55" x2="70" y2="55" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="30" y1="62" x2="65" y2="62" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="30" y1="69" x2="60" y2="69" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => navigate('/phonebook-wise-slip-report')
    },
    {
      id: 'polling-station-wise',
      label: 'मतदान स्थल अनुसार',
      icon: (
        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ballot box - brown */}
          <rect x="30" y="40" width="40" height="50" rx="3" fill="#92400e" stroke="#78350f" strokeWidth="2.5"/>
          {/* Box top */}
          <rect x="28" y="38" width="44" height="6" rx="2" fill="#a16207" stroke="#78350f" strokeWidth="2"/>
          {/* Slot opening */}
          <rect x="40" y="35" width="20" height="4" rx="1" fill="#451a03"/>
          {/* Hand inserting document */}
          <path d="M15 60 Q20 55 25 60 Q30 65 35 60" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <circle cx="20" cy="58" r="4" fill="#fbbf24"/>
          {/* Document being inserted */}
          <rect x="30" y="50" width="12" height="18" rx="1" fill="white" stroke="#9ca3af" strokeWidth="1.5"/>
          <line x1="33" y1="55" x2="39" y2="55" stroke="#4b5563" strokeWidth="1" strokeLinecap="round"/>
          <line x1="33" y1="60" x2="38" y2="60" stroke="#4b5563" strokeWidth="1" strokeLinecap="round"/>
          <line x1="33" y1="65" x2="40" y2="65" stroke="#4b5563" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => navigate('/polling-station-wise-slip-report')
    },
    {
      id: 'worker-slip',
      label: 'कार्यकर्ता का स्लिप प्रचार',
      icon: (
        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Three overlapping blue human silhouettes */}
          {/* First person - left */}
          <circle cx="30" cy="30" r="10" fill="#3b82f6" opacity="0.9"/>
          <rect x="22" y="40" width="16" height="30" rx="8" fill="#3b82f6" opacity="0.9"/>
          {/* Second person - center */}
          <circle cx="50" cy="28" r="10" fill="#2563eb" opacity="0.95"/>
          <rect x="42" y="38" width="16" height="32" rx="8" fill="#2563eb" opacity="0.95"/>
          {/* Third person - right */}
          <circle cx="70" cy="30" r="10" fill="#1d4ed8" opacity="0.9"/>
          <rect x="62" y="40" width="16" height="30" rx="8" fill="#1d4ed8" opacity="0.9"/>
        </svg>
      ),
      onClick: () => navigate('/worker-wise-slip-report')
    },
    {
      id: 'date-wise',
      label: 'तारीख अनुसार',
      icon: (
        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Calendar - black outline */}
          <rect x="20" y="20" width="60" height="65" rx="4" fill="none" stroke="#1f2937" strokeWidth="3"/>
          {/* Calendar header */}
          <rect x="20" y="20" width="60" height="18" rx="4" fill="#374151"/>
          {/* Calendar grid lines */}
          <line x1="35" y1="38" x2="35" y2="85" stroke="#6b7280" strokeWidth="1.5" opacity="0.5"/>
          <line x1="50" y1="38" x2="50" y2="85" stroke="#6b7280" strokeWidth="1.5" opacity="0.5"/>
          <line x1="65" y1="38" x2="65" y2="85" stroke="#6b7280" strokeWidth="1.5" opacity="0.5"/>
          <line x1="20" y1="50" x2="80" y2="50" stroke="#6b7280" strokeWidth="1.5" opacity="0.5"/>
          <line x1="20" y1="62" x2="80" y2="62" stroke="#6b7280" strokeWidth="1.5" opacity="0.5"/>
          <line x1="20" y1="74" x2="80" y2="74" stroke="#6b7280" strokeWidth="1.5" opacity="0.5"/>
          {/* Date dots */}
          <circle cx="35" cy="56" r="2" fill="#1f2937"/>
          <circle cx="50" cy="56" r="2" fill="#1f2937"/>
          <circle cx="65" cy="56" r="2" fill="#1f2937"/>
          <circle cx="35" cy="68" r="2" fill="#1f2937"/>
          <circle cx="50" cy="68" r="2" fill="#1f2937"/>
          {/* Clock icon - bottom right */}
          <circle cx="72" cy="75" r="8" fill="none" stroke="#1f2937" strokeWidth="2"/>
          <line x1="72" y1="75" x2="72" y2="70" stroke="#1f2937" strokeWidth="2" strokeLinecap="round"/>
          <line x1="72" y1="75" x2="76" y2="75" stroke="#1f2937" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="72" cy="75" r="1.5" fill="#1f2937"/>
        </svg>
      ),
      onClick: () => navigate('/date-wise-slip-report')
    },
    {
      id: 'master-search',
      label: 'मास्टर सर्च',
      icon: (
        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Search icon - magnifying glass */}
          <circle cx="45" cy="45" r="18" fill="none" stroke="#102463" strokeWidth="4" strokeLinecap="round"/>
          <line x1="58" y1="58" x2="75" y2="75" stroke="#102463" strokeWidth="4" strokeLinecap="round"/>
          {/* Search lines inside */}
          <circle cx="45" cy="45" r="12" fill="none" stroke="#102463" strokeWidth="2" opacity="0.3"/>
        </svg>
      ),
      onClick: () => console.log('Master Search')
    }
  ]

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
      onScroll={(e) => {
        // React scroll event handler
        const scrollTop = e.currentTarget.scrollTop
        setScrollPosition(scrollTop)
        
        // Show scroll to top button when scrolled down more than 300px
        if (scrollTop > 300) {
          setShowScrollTop(true)
        } else {
          setShowScrollTop(false)
        }
      }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3.5 md:py-4 flex items-center justify-between shadow-xl" style={{ backgroundColor: '#102463' }}>
        <button
          onClick={handleBack}
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95 shadow-sm"
        >
          <svg className="w-5 h-5 sm:w-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center flex-1 px-3 sm:px-4">स्लिप प्रचार रिपोर्ट</h1>
        
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11"></div>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 pb-6 sm:pb-8 md:pb-10 lg:pb-12">
        {/* Main White Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {/* Total Voters */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              टोटल मतदाता : {totalVoters.toLocaleString('en-IN')}
            </h2>
          </div>

          {/* Combined Section: Donut Chart and Sent/Not Sent Stats */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-3 lg:gap-4">
            {/* Left Section: Donut Chart */}
            <div className="flex-shrink-0">
              <div className="relative" style={{ width: '180px', height: '180px' }}>
                <svg width="180" height="180" className="transform -rotate-90 w-full h-full">
                  {/* Background circle */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="25"
                  />
                  {/* Not Sent (red) - almost full circle */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="25"
                    strokeDasharray={`${2 * Math.PI * 70 * (notSentPercentage / 100)} ${2 * Math.PI * 70}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Sent (green) - small segment */}
                  <circle
                    cx="90"
                    cy="90"
                    r="70"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="25"
                    strokeDasharray={`${2 * Math.PI * 70 * (sentPercentage / 100)} ${2 * Math.PI * 70}`}
                    strokeDashoffset={`-${2 * Math.PI * 70 * (notSentPercentage / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Middle Section: Sent/Not Sent Stats */}
            <div className="flex-1 w-full lg:w-auto flex flex-row items-center justify-evenly gap-2 sm:gap-4 md:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-1.5 sm:mr-2"></div>
                  <span className="text-base sm:text-lg font-semibold text-gray-800">भेज दिया</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{sentCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 mr-1.5 sm:mr-2"></div>
                  <span className="text-base sm:text-lg font-semibold text-gray-800">नहीं भेजा</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{notSentCount.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Second Separating Line - Horizontal on mobile, Vertical on desktop */}
            <div className="w-full lg:w-0 lg:h-48 border-t lg:border-t-0 lg:border-l border-dashed border-gray-300 my-2 lg:my-0"></div>

            {/* Right Section: Sent Breakdown */}
            <div className="flex-1 w-full lg:w-auto">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 text-center">
                भेज दिया ({sentCount})
              </h3>
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{whatsappCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Whatsapp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{smsCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">SMS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{printSlipCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Print Slip</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          {navigationButtons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick}
              className="bg-white rounded-lg sm:rounded-xl shadow-md p-2 sm:p-3 md:p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-200 min-h-[100px] sm:min-h-[110px] md:min-h-[120px] border border-gray-100 hover:border-blue-300"
            >
              <div className="text-blue-600 mb-3">
                {button.icon}
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold leading-tight">
                {button.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border-2"
          style={{ borderColor: '#102463' }}
          aria-label="Scroll to top"
        >
          <svg 
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#102463' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default SlipPracharReport

