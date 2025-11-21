import React, { useState, useEffect } from 'react'
import { Chart } from 'react-google-charts'
import logoImage from '../../../assets/image/ic_app_logo.png'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import MasterSearchModal from '../modals/MasterSearchModal.jsx'
import LogoutConfirmationModal from '../modals/LogoutConfirmationModal.jsx'
import ProfileModal from '../modals/ProfileModal.jsx'

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

const AdminDashboard = ({ navigation }) => {
  const { navigate, state } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [showMasterSearchModal, setShowMasterSearchModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [chartSize, setChartSize] = useState({ width: '120px', height: '120px', fontSize: 12 })

  // Get user data from localStorage or navigation state
  const getUserData = () => {
    const sessionData = localStorageManager.getUserData()
    if (sessionData) {
      return sessionData
    }
    // Fallback to navigation state or default data
    return state || {
      corporation: { name: 'ठाणे महानगरपालिका' },
      panel: { name: 'Panel 2', voters: 45132 }
    }
  }

  const userData = getUserData()
  const [panelVoterCount, setPanelVoterCount] = useState(() => getPanelVoterValue(userData?.panel))

  useEffect(() => {
    // Check if user is logged in via localStorage
    if (!localStorageManager.isLoggedIn()) {
      console.log('No valid session found, redirecting to login')
      navigate('/corporation')
      return
    }
    
    // Set sidebar open by default on desktop only, keep closed on mobile
    const checkDesktop = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      } else {
        // Ensure sidebar is closed on mobile
        setIsSidebarOpen(false)
      }
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    
    // Animate in when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkDesktop)
    }
  }, [navigate])

  useEffect(() => {
    if (panelVoterCount > 0) return

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
          setPanelVoterCount(voters)
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
        console.error('Failed to refresh panel voters:', error)
      }
    }

    fetchPanelDetails()

    return () => {
      isMounted = false
    }
  }, [panelVoterCount, userData])

  // Handle responsive chart sizing - compact version
  useEffect(() => {
    const updateChartSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setChartSize({ width: '100px', height: '100px', fontSize: 10 })
      } else if (width >= 640 && width < 768) {
        setChartSize({ width: '110px', height: '110px', fontSize: 11 })
      } else if (width >= 768 && width < 1024) {
        setChartSize({ width: '130px', height: '130px', fontSize: 12 })
      } else if (width >= 1024 && width < 1280) {
        setChartSize({ width: '140px', height: '140px', fontSize: 13 })
      } else if (width >= 1280 && width < 1536) {
        setChartSize({ width: '150px', height: '150px', fontSize: 14 })
      } else {
        setChartSize({ width: '160px', height: '160px', fontSize: 15 })
      }
    }

    updateChartSize()
    window.addEventListener('resize', updateChartSize)
    return () => window.removeEventListener('resize', updateChartSize)
  }, [])


  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/')
    }, 300)
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleLogout = () => {
    // Clear session from localStorage
    localStorageManager.clearSession()
    
    console.log('User logged out from admin dashboard')
    
    setIsVisible(false)
    setShowLogoutModal(false)
    setTimeout(() => {
      navigate('/corporation')
    }, 300)
  }

  const handleCancelLogout = () => {
    setShowLogoutModal(false)
  }

  const handleSidebarToggle = () => {
    // Only toggle on mobile (desktop sidebar is always open)
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(!isSidebarOpen)
    }
  }

  const handleSidebarClose = () => {
    // Only close on mobile (desktop sidebar stays open)
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }

  const handleProfileClick = () => {
    handleSidebarClose()
    setShowProfileModal(true)
  }

  const handleAllUsersClick = () => {
    handleSidebarClose()
    navigate('/all-users')
  }

  const handleChangeCorporation = () => {
    handleSidebarClose()
    // Clear navigation state to prevent redirect to login screen
    localStorageManager.clearNavigationState()
    // Don't clear session - user is still logged in, just changing corporation
    // Navigate to corporation selection
    navigate('/corporation')
  }

  const handleChangePanel = () => {
    handleSidebarClose()
    // Clear navigation state to prevent redirect to login screen
    localStorageManager.clearNavigationState()
    // Navigate to panel selection for current corporation
    const corporationId = userData?.corporation?.id
    if (corporationId) {
      navigate(`/panel/${corporationId}`)
    } else {
      navigate('/corporation')
    }
  }

  const handleMasterSearch = () => {
    console.log('Master Search button clicked!')
    setShowMasterSearchModal(true)
  }

  const handleCloseMasterSearchModal = () => {
    setShowMasterSearchModal(false)
  }

  const handleMasterSearchSubmit = (searchData) => {
    // Handle master search logic here
    console.log('Master search data:', searchData)
    // You can add navigation or API call here based on search results
  }

  const handleAddressClick = () => {
    console.log('Address clicked - showing loading slide')
    navigate('/address-detail')
  }

  const handlePollingStationClick = () => {
    console.log('Polling Station clicked - showing loading slide')
    navigate('/polling-station')
  }

  const handleSurnameClick = () => {
    console.log('Surname clicked - showing loading slide')
    navigate('/surname')
  }

  const handleAgeClick = () => {
    console.log('Age clicked - navigating to age route')
    navigate('/age')
  }

  const handleRoleClick = (role) => {
    console.log('Role clicked:', role)
    
    // Navigate to AdminList when Admin card is clicked
    if (role.id === 'admin') {
      navigate('/admin-list')
    }
    // Navigate to SubAdmin when Sub Admin card is clicked
    else if (role.id === 'sub-admin') {
      navigate('/sub-admin')
    }
    // Navigate to ShaktiKendraPramukh when Shakti Kendra Pramukh card is clicked
    else if (role.id === 'shakti-kendra') {
      navigate('/shakti-kendra-pramukh')
    }
    // Navigate to Karyakarta when Karyakarta card is clicked
    else if (role.id === 'karyakarta') {
      navigate('/karyakarta')
    }
    // Navigate to Booth Pramukh when Booth Pramukh card is clicked
    else if (role.id === 'booth-pramukh') {
      navigate('/booth-pramukh')
    }
    // Navigate to Call Survey User when Call Center card is clicked
    else if (role.id === 'call-center') {
      navigate('/call-survey-user')
    }
    // Navigate to Building Pramukh when Building Pramukh card is clicked
    else if (role.id === 'building-pramukh') {
      navigate('/building-pramukh')
    }
    // Navigate to BoothList when Booth card is clicked
    else if (role.id === 'booth') {
      navigate('/booth-list')
    }
    // You can add navigation logic here for other roles
  }

  const roleCards = [
    {
      id: 'admin',
      name: 'ऐडमिन',
      icon: 'admin',
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
      iconColor: 'text-amber-600',
      hoverColor: 'hover:from-amber-600 hover:to-orange-600',
      shadowColor: 'shadow-amber-200'
    },
    {
      id: 'sub-admin',
      name: 'सब ऐडमिन',
      icon: 'sub-admin',
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      iconColor: 'text-emerald-600',
      hoverColor: 'hover:from-emerald-600 hover:to-teal-600',
      shadowColor: 'shadow-emerald-200'
    },
    {
      id: 'shakti-kendra',
      name: 'शक्ति केन्द्र प्रमुख',
      icon: 'shakti-kendra',
      gradient: 'from-rose-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
      iconColor: 'text-rose-600',
      hoverColor: 'hover:from-rose-600 hover:to-pink-600',
      shadowColor: 'shadow-rose-200'
    },
    {
      id: 'building-pramukh',
      name: 'बिल्डिंग प्रमुख',
      icon: 'building-pramukh',
      gradient: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50',
      iconColor: 'text-teal-600',
      hoverColor: 'hover:from-teal-600 hover:to-cyan-600',
      shadowColor: 'shadow-teal-200'
    },
    {
      id: 'booth-pramukh',
      name: 'बूथ प्रमुख',
      icon: 'booth-pramukh',
      gradient: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-600',
      shadowColor: 'shadow-blue-200'
    },
    {
      id: 'karyakarta',
      name: 'कार्यकर्ता',
      icon: 'karyakarta',
      gradient: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      iconColor: 'text-amber-600',
      hoverColor: 'hover:from-amber-600 hover:to-yellow-600',
      shadowColor: 'shadow-amber-200'
    },
    /* {
      id: 'call-center',
      name: 'कॉल सर्वे यूज़र',
      icon: 'call-center',
      gradient: 'from-slate-500 to-gray-500',
      bgColor: 'bg-gradient-to-br from-slate-50 to-gray-50',
      iconColor: 'text-slate-600',
      hoverColor: 'hover:from-slate-600 hover:to-gray-600',
      shadowColor: 'shadow-slate-200'
    } */
   
  ]

  const renderIcon = (iconType, colorClass) => {
    switch (iconType) {
      case 'admin':
        return (
          <div className="relative">
            <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        )
      case 'sub-admin':
        return (
          <div className="relative">
            <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-600 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        )
      case 'shakti-kendra':
        return (
          <div className="relative">
            <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14l5-5 5 5z"/>
              </svg>
            </div>
          </div>
        )
      case 'karyakarta':
        return (
          <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z"/>
          </svg>
        )
      case 'booth-pramukh':
        return (
          <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            <path d="M3 5h2v2H3V5zm0 4h2v2H3V9zm0 4h2v2H3v-2zm0 4h2v2H3v-2z" fill="red"/>
          </svg>
        )
      case 'call-center':
        return (
          <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        )
      case 'building-pramukh':
        return (
          <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
            <path d="M5 5h2v2H5V5zm0 4h2v2H5V9zm0 4h2v2H5v-2zm0 4h2v2H5v-2zm4-12h2v2H9V5zm0 4h2v2H9V9zm0 4h2v2H9v-2zm0 4h2v2H9v-2z" fill="currentColor" opacity="0.6"/>
          </svg>
        )
      default:
        return (
          <svg className={`w-8 h-8 ${colorClass}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )
    }
  }

  const voterSearchButtons = [
    {
      id: 'master-search',
      label: 'मास्टर सर्च',
      overlayClass: 'from-blue-50 to-indigo-50',
      iconWrapperClass: 'from-blue-50 to-indigo-50',
      iconOverlayClass: 'from-blue-500 to-indigo-500',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6" style={{ color: '#102463' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      onClick: handleMasterSearch,
    },
    {
      id: 'booth-search',
      label: 'बूथ के अनुसार',
      overlayClass: 'from-blue-50 to-indigo-50',
      iconWrapperClass: 'from-blue-50 to-indigo-50',
      iconOverlayClass: 'from-blue-500 to-indigo-500',
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 2xl:w-6 2xl:h-6" style={{ color: '#102463' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          <path d="M3 5h2v2H3V5zm0 4h2v2H3V9zm0 4h2v2H3v-2zm0 4h2v2H3v-2z" fill="red" />
        </svg>
      ),
      onClick: () => handleRoleClick({ id: 'booth' }),
    },
    {
      id: 'address-search',
      label: 'पते के अनुसार',
      overlayClass: 'from-orange-50 to-amber-50',
      iconWrapperClass: 'from-orange-50 to-amber-50',
      iconOverlayClass: 'from-orange-500 to-amber-500',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      ),
      onClick: handleAddressClick,
    },
    {
      id: 'polling-search',
      label: 'मतदान केंद्र के अनुसार',
      overlayClass: 'from-gray-50 to-slate-50',
      iconWrapperClass: 'from-gray-50 to-slate-50',
      iconOverlayClass: 'from-gray-500 to-slate-500',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          <circle cx="12" cy="8" r="2" fill="red" />
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="orange" />
        </svg>
      ),
      onClick: handlePollingStationClick,
    },
    {
      id: 'surname-search',
      label: 'सरनेम के अनुसार',
      overlayClass: 'from-green-50 to-emerald-50',
      iconWrapperClass: 'from-green-50 to-emerald-50',
      iconOverlayClass: 'from-green-500 to-emerald-500',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5v11.5h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z" />
          <circle cx="8" cy="6" r="2" fill="blue" />
          <circle cx="16" cy="6" r="2" fill="red" />
          <circle cx="12" cy="4" r="1" fill="orange" />
        </svg>
      ),
      onClick: handleSurnameClick,
    },
    {
      id: 'age-search',
      label: 'उम्र के अनुसार',
      overlayClass: 'from-amber-50 to-yellow-50',
      iconWrapperClass: 'from-amber-50 to-yellow-50',
      iconOverlayClass: 'from-amber-500 to-yellow-500',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          <circle cx="8" cy="8" r="2" fill="green" />
          <circle cx="16" cy="8" r="2" fill="red" />
          <circle cx="12" cy="16" r="2" fill="blue" />
          <path d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="orange" />
        </svg>
      ),
      onClick: handleAgeClick,
    },
  ]

  const reportCards = [
    {
      id: 'karyakarta-slip-prachar',
      label: 'कार्यकर्ता का स्लिप प्रचार',
      overlayClass: 'from-orange-50 to-amber-50',
      borderHoverClass: 'hover:border-orange-300',
      iconBgColor: 'bg-orange-500',
      iconGradientClass: 'from-orange-600 to-amber-600',
      textHoverClass: 'group-hover:text-orange-600',
      indicatorGradient: 'from-orange-400 to-amber-400',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="white"/>
        </svg>
      ),
      onClick: () => navigate('/volunteer-slip-prachar'),
    },
    {
      id: 'slip-prachar-report',
      label: 'स्लिप प्रचार रिपोर्ट',
      overlayClass: 'from-green-50 to-emerald-50',
      borderHoverClass: 'hover:border-green-300',
      iconBgColor: 'bg-green-500',
      iconGradientClass: 'from-green-600 to-emerald-600',
      textHoverClass: 'group-hover:text-green-600',
      indicatorGradient: 'from-green-400 to-emerald-400',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          <path d="M8 4h8v2H8V4zm0 4h8v2H8V8zm0 4h5v2H8v-2z" fill="white"/>
        </svg>
      ),
      onClick: () => navigate('/slip-prachar-report'),
    },
    {
      id: 'cadre-survey-report',
      label: 'केडर सर्वे रिपोर्ट',
      overlayClass: 'from-blue-50 to-indigo-50',
      borderHoverClass: 'hover:border-blue-300',
      iconBgColor: '#102463',
      iconGradientClass: '#102463',
      textHoverClass: 'group-hover:opacity-80',
      indicatorColor: '#102463',
      textColor: '#102463',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z"/>
          <circle cx="8" cy="6" r="2" fill="white"/>
          <circle cx="16" cy="6" r="2" fill="white"/>
          <circle cx="12" cy="4" r="1" fill="white"/>
        </svg>
      ),
      onClick: () => navigate('/cadre-survey-report'),
    },
    {
      id: 'call-center-survey-report',
      label: 'कॉल सेंटर सर्वे रिपोर्ट',
      overlayClass: 'from-purple-50 to-pink-50',
      borderHoverClass: 'hover:border-purple-300',
      iconBgColor: 'bg-purple-500',
      iconGradientClass: 'from-purple-600 to-pink-600',
      textHoverClass: 'group-hover:text-purple-600',
      indicatorGradient: 'from-purple-400 to-pink-400',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      ),
      onClick: null,
    },
  ]

  const karyakartaCards = [
    {
      id: 'karyakarta-phonebook',
      label: 'कार्यकर्ता की फोनबुक',
      overlayClass: 'from-blue-50 to-indigo-50',
      borderHoverClass: 'hover:border-blue-300',
      iconWrapperClass: 'from-blue-50 to-indigo-50',
      iconGradientClass: 'from-blue-500 to-indigo-500',
      textHoverClass: 'group-hover:opacity-80',
      textColor: '#102463',
      indicatorColor: '#102463',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6" style={{ color: '#102463' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          <path d="M6 8h2v2H6V8zm4 0h2v2h-2V8zm4 0h2v2h-2V8z" fill="currentColor"/>
        </svg>
      ),
      onClick: () => navigate('/karyakarta-phonebook'),
      isButton: true,
    },
    {
      id: 'surname-group-phonebook',
      label: 'कार्यकर्ता के सरनेम ग्रुप',
      overlayClass: 'from-red-50 to-pink-50',
      borderHoverClass: 'hover:border-red-300',
      iconWrapperClass: 'from-red-50 to-pink-50',
      iconGradientClass: 'from-red-500 to-pink-500',
      textHoverClass: 'group-hover:text-red-600',
      indicatorGradient: 'from-red-400 to-pink-400',
      icon: (
        <svg className="w-5 h-5 2xl:w-6 2xl:h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z"/>
          <circle cx="8" cy="6" r="2" fill="currentColor"/>
          <circle cx="16" cy="6" r="2" fill="currentColor"/>
          <circle cx="12" cy="4" r="1" fill="currentColor"/>
        </svg>
      ),
      onClick: () => navigate('/surname-group-phonebook'),
      isButton: false,
    },
  ]

  return (
    <div className={`relative w-full h-screen overflow-y-auto scroll-smooth transition-all duration-700 lg:pl-[280px] ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`} style={{ backgroundColor: '#e5e8ff' }}>
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={{ backgroundColor: '#e5e8ff' }}></div>
      
      {/* Responsive Header */}
      <div className="relative z-20 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-lg lg:ml-0" style={{ backgroundColor: '#102463' }}>
        {/* Left: BJP Logo (mobile only, desktop logo is in sidebar) */}
        <div className="flex items-center lg:hidden">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center mr-2 sm:mr-3">
            <img 
              src={logoImage} 
              alt="BJP Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
          </div>
        </div>

        {/* Center: Admin Title */}
        <div className="flex-1 text-center">
          <h1 className="text-white text-lg sm:text-2xl font-bold">
            ऐडमिन
            </h1>
            </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button 
            onClick={handleSidebarToggle}
            className="lg:hidden w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Responsive Information Panel */}
      <div className="relative z-10 px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6">
          {/* Panel 1 - Information */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex-1">
            <div className="flex flex-col items-center justify-evenly gap-3 sm:gap-4 w-full h-full">
              <div className="bg-blue-100 rounded-lg px-3 py-1 inline-block">
                <h2 className="text-xs sm:text-sm font-bold" style={{ color: '#102463' }}>
                  {userData?.panel?.name || 'प्रभाग 2'}
                </h2>
              </div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-xl 2xl:text-2xl font-medium text-center" style={{ color: '#102463' }}>
                {userData?.corporation?.name || 'ठाणे महानगरपालिका'}
              </h2>
              <p className="text-base sm:text-lg md:text-lg lg:text-lg xl:text-3xl 2xl:text-3xl font-bold text-center" style={{ color: '#102463' }}>
                टोटल मतदाता : {panelVoterCount > 0 ? panelVoterCount.toLocaleString('en-IN') : '45,132'}
              </p>
            </div>
          </div>

          {/* Panel 2 - Slip Progress Chart */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex-1">
            <div className="flex sm:flex-row items-center justify-center gap-2 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4 2xl:gap-4">
              {/* Pie Chart */}
              <div className="flex items-center justify-center">
                <Chart
                  width={chartSize.width}
                  height={chartSize.height}
                  chartType="PieChart"
                  loader={<div className="text-center py-4 text-xs sm:text-sm">लोड हो रहा है...</div>}
                  data={[
                    ['Status', 'Value'],
                    ['सेंड', 12125],
                    ['बाकि', 14458],
                    ['अन्य', 18549],
                  ]}
                  options={{
                    title: 'स्लिप प्रोग्रेश',
                    titleTextStyle: {
                      color: '#102463',
                      fontSize: chartSize.fontSize,
                      bold: true,
                    },
                    colors: ['#ef4444', '#86efac', '#fbbf24'],
                    backgroundColor: 'transparent',
                    legend: {
                      position: 'none',
                    },
                    pieSliceText: 'none',
                    pieHole: 0,
                    is3D: true,
                    chartArea: {
                      width: '85%',
                      height: '75%',
                      left: '7.5%',
                      top: '15%',
                    },
                  }}
                />
            </div>
            
              {/* Data Labels */}
              <div className="flex flex-col gap-1.5 sm:gap-2 text-left">
                <p className="text-base sm:text-sm md:text-md lg:text-sm xl:text-base 2xl:text-2xl font-semibold" style={{ color: '#102463' }}>
                  टोटल : {panelVoterCount > 0 ? panelVoterCount.toLocaleString('en-IN') : '45,132'}
                </p>
                <p className="text-base sm:text-sm md:text-md lg:text-sm xl:text-base 2xl:text-2xl font-semibold" style={{ color: '#102463' }}>
                  सेंड : 12,125
                </p>
                <p className="text-base sm:text-sm md:text-md lg:text-sm xl:text-base 2xl:text-2xl font-semibold" style={{ color: '#102463' }}>
                  बाकि : 14,458
                </p>
                </div>
            </div>
          </div>

          {/* Panel 3 - Survey Progress Chart */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex-1">
            <div className="w-full flex justify-center">
              <Chart
                width={'160px'}
                height={'160px'}
                chartType="ColumnChart"
                loader={<div className="text-center py-8 text-sm">लोड हो रहा है...</div>}
                data={[
                  ['Category', 'Value'],
                  ['1', 12000],
                  ['2', 8500],
                  ['3', 6000],
                  ['4', 4000],
                  ['5', 2500],
                ]}
                options={{
                  title: 'सर्वे प्रोग्रेश',
                  titleTextStyle: {
                    color: '#102463',
                    fontSize: 16,
                    bold: true,
                  },
                  colors: ['#f97316', '#ec4899', '#d946ef', '#a855f7', '#7c3aed'],
                  backgroundColor: 'transparent',
                  legend: {
                    position: 'none',
                  },
                  hAxis: {
                    title: '',
                    textStyle: { color: '#102463', fontSize: 11 },
                  },
                  vAxis: {
                    title: '',
                    textStyle: { color: '#102463', fontSize: 11 },
                    gridlines: { color: 'transparent' },
                  },
                  is3D: true,
                  chartArea: {
                    width: '70%',
                    height: '70%',
                  },
                  bar: {
                    groupWidth: '60%',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
            
      {/* Responsive Role Management Section */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-4">
        <div className=" bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-left">
              <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
              संगठन
              </h3>
          </div>
        </div>
      </div>

          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {roleCards.map((role, index) => (
            <button
              key={role.id}
              onClick={() => handleRoleClick(role)}
              onMouseEnter={() => setHoveredCard(role.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[90px] sm:min-h-[100px] md:min-h-[110px] lg:min-h-[120px] xl:min-h-[130px] 2xl:min-h-[140px] w-full overflow-hidden ${
                hoveredCard === role.id ? 'ring-2 ring-orange-200' : ''
              }`}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Background Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Icon Container */}
              <div className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 ${role.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-30 rounded-lg sm:rounded-xl transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  {renderIcon(role.icon, role.iconColor)}
                </div>
              </div>
              
              {/* Role Name */}
              <span className="text-gray-700 text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-base 2xl:text-lg font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10 px-1 break-words">
                {role.name}
              </span>
              
              {/* Hover Indicator */}
              <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          ))}
            </div>
        </div>
        </div>
      </div>

      {/* Responsive Voter List Section - Heading */}
      <div className="relative z-10 px-2 sm:px-4">
        <div className="w-full rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-left">
              <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
                मतदाता सूची
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Voter List Search Cards */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {voterSearchButtons.map((button) => (
          <button
              key={button.id}
              onClick={button.onClick}
              className="group relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-gray-300 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[90px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] 2xl:min-h-[150px] w-full overflow-hidden"
          >
            {/* Background Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${button.overlayClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            {/* Icon Container */}
              <div className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${button.iconWrapperClass} rounded-lg sm:rounded-xl flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${button.iconOverlayClass} opacity-0 group-hover:opacity-30 rounded-lg sm:rounded-xl transition-opacity duration-300`}></div>
              <div className="relative z-10">
                  {button.icon}
              </div>
            </div>
            
            {/* Role Name */}
              <span className="text-gray-700 text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10 px-1 break-words">
                {button.label}
            </span>
            
            {/* Hover Indicator */}
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          ))}
              </div>
            </div>
            
      {/* Combined Section: कार्यकर्ता के पहचानवाले and रिपोर्ट */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-4">
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          <div className="flex-1 lg:flex-[0.33]">
            <div className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200">
              {/* Heading inside card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="text-left">
                    <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
                      कार्यकर्ता के पहचानवाले
                    </h3>
                  </div>
              </div>
            </div>
            
              {/* कार्यकर्ता के पहचानवाले Cards */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                  {karyakartaCards.map((card) => {
                    const commonClassName = `group relative bg-white rounded-xl sm:rounded-2xl p-3 border border-gray-200 ${card.borderHoverClass} transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] 2xl:min-h-[150px] w-full overflow-hidden ${!card.isButton ? 'cursor-pointer' : ''}`
                    
                    const cardContent = (
                      <>
            {/* Background Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.overlayClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            {/* Icon Container */}
                        <div className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 bg-gradient-to-br ${card.iconWrapperClass} rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-3 lg:mb-4 xl:mb-4 2xl:mb-4 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${card.iconGradientClass} opacity-0 group-hover:opacity-30 rounded-xl transition-opacity duration-300`}></div>
              <div className="relative z-10">
                            {card.icon}
              </div>
            </div>
            
                        {/* Title */}
                        <span 
                          className={`text-gray-700 text-[10px] sm:text-xs md:text-sm lg:text-sm xl:text-base 2xl:text-lg font-semibold text-center leading-tight ${card.textHoverClass} transition-colors duration-300 relative z-10 px-1 break-words`}
                          style={card.textColor ? { color: card.textColor } : {}}
                        >
                          {card.label}
            </span>
            
            {/* Hover Indicator */}
                        {card.indicatorGradient ? (
                          <div className={`absolute bottom-2 sm:bottom-2 md:bottom-2.5 lg:bottom-2.5 xl:bottom-3 2xl:bottom-3 right-2 sm:right-2 md:right-2.5 lg:right-2.5 xl:right-3 2xl:right-3 w-2 h-2 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 2xl:w-3 2xl:h-3 bg-gradient-to-r ${card.indicatorGradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        ) : (
                          <div 
                            className="absolute bottom-2 sm:bottom-2 md:bottom-2.5 lg:bottom-2.5 xl:bottom-3 2xl:bottom-3 right-2 sm:right-2 md:right-2.5 lg:right-2.5 xl:right-3 2xl:right-3 w-2 h-2 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 2xl:w-3 2xl:h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ backgroundColor: card.indicatorColor }}
                          ></div>
                        )}
                      </>
                    )
                    
                    return card.isButton ? (
          <button
                        key={card.id}
                        type="button"
                        onClick={card.onClick}
                        className={commonClassName}
                      >
                        {cardContent}
          </button>
                    ) : (
                      <div
                        key={card.id}
                        onClick={card.onClick}
                        className={commonClassName}
                      >
                        {cardContent}
              </div>
                    )
                  })}
            </div>
              </div>
        </div>
      </div>

          <div className="flex-1 lg:flex-[0.67]">
            <div className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200">
              {/* रिपोर्ट Section - Heading */}
              <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-left">
              <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
                      रिपोर्ट
              </h3>
          </div>
        </div>
      </div>

              {/* रिपोर्ट Cards */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {reportCards.map((card) => {
                    const isCustomColor = typeof card.iconBgColor === 'string' && card.iconBgColor.startsWith('#')
                    
                    return (
                      <div
                        key={card.id}
                        onClick={card.onClick || undefined}
                        className={`group relative bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-gray-200 ${card.borderHoverClass} transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[95px] sm:min-h-[110px] md:min-h-[120px] lg:min-h-[130px] xl:min-h-[140px] 2xl:min-h-[150px] w-full overflow-hidden ${card.onClick ? 'cursor-pointer' : ''}`}
          >
            {/* Background Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.overlayClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            {/* Icon Container */}
                        <div 
                          className={`relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 ${isCustomColor ? '' : card.iconBgColor} rounded-full flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg`}
                          style={isCustomColor ? { backgroundColor: card.iconBgColor } : {}}
                        >
                          <div 
                            className={`absolute inset-0 opacity-0 group-hover:opacity-30 rounded-full transition-opacity duration-300 ${isCustomColor ? '' : `bg-gradient-to-br ${card.iconGradientClass}`}`}
                            style={isCustomColor ? { backgroundColor: card.iconGradientClass } : {}}
                          ></div>
              <div className="relative z-10">
                            {card.icon}
              </div>
            </div>
            
                        {/* Label */}
                        <span 
                          className={`text-gray-700 text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-center leading-tight ${card.textHoverClass} transition-colors duration-300 relative z-10 px-1 break-words`}
                          style={card.textColor ? { color: card.textColor } : {}}
                          dangerouslySetInnerHTML={{ __html: card.label }}
                        ></span>
            
            {/* Hover Indicator */}
                        {card.indicatorGradient ? (
                          <div className={`absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r ${card.indicatorGradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        ) : (
                          <div 
                            className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ backgroundColor: card.indicatorColor }}
                          ></div>
                        )}
          </div>
                    )
                  })}
        </div>
      </div>
            </div>
            </div>
          </div>
          </div>
      {/* Bottom Spacing for Scroll */}
      <div className="h-24 pb-4"></div>

      {/* Simple Bottom Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-100/20 via-white/10 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-blue-100/15 via-indigo-100/10 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-orange-100/10 via-amber-100/5 to-transparent pointer-events-none"></div>

      <MasterSearchModal
        isOpen={showMasterSearchModal}
        onClose={handleCloseMasterSearchModal}
        onSearch={handleMasterSearchSubmit}
      />

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={handleCancelLogout}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Sidebar Overlay - Only on mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
          onClick={handleSidebarClose}
        ></div>
      )}
            
      {/* Sidebar */}
      <div className={`fixed top-0 h-full z-50 transition-transform duration-300 ease-in-out ${
        // Desktop: always visible on left, Mobile: toggleable on right
        'lg:left-0 lg:translate-x-0 lg:right-auto right-0'
      } ${
        // Mobile behavior: hidden by default, visible when isSidebarOpen is true
        // Desktop: always visible (lg:translate-x-0)
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`} style={{ width: '280px', maxWidth: '85vw' }}>
        {/* Dark Blue Sidebar Background - Only for Logo */}
        <div className="absolute top-0 left-0 w-full h-20 bg-[#102463]"></div>
        
        {/* Sidebar Content */}
        <div className="flex flex-col h-full bg-gray-100 relative">
          {/* BJP Logo at Top - On Dark Blue Background */}
          <div className="relative p-1 flex items-center justify-between border-b border-gray-300 bg-[#102463]">
            {/* Logo and Text Container */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center shadow-lg bg-white/10">
                <img 
                  src={logoImage} 
                  alt="BJP Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-sm sm:text-base font-bold uppercase tracking-wide truncate">
                  BJP WINGS
                </h2>
              </div>
            </div>
            
            {/* Close Button - Mobile Only */}
            <button
              onClick={handleSidebarClose}
              className="lg:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors duration-200 ml-2"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
            
          {/* User Profile Section */}
          <div className="p-6 bg-gray-100">
            {/* Profile Picture Placeholder */}
            <div className="w-20 h-20 bg-yellow-200 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md">
              {userData?.admin?.photoPath ? (
                <img 
                  src={userData.admin.photoPath} 
                  alt={userData.admin.name || 'User'} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-yellow-700">
                  {(userData?.admin?.name || 'User').charAt(0).toUpperCase()}
            </span>
              )}
            </div>
            
            {/* User Name */}
            <h3 className="text-center text-lg font-semibold mb-1" style={{ color: '#102463' }}>
              {userData?.admin?.name || 'User Name'}
            </h3>
            
            {/* User Role */}
            <p className="text-center text-sm text-green-600 font-medium">
              एडमिन
            </p>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto py-2 bg-white">
            {/* Profile */}
            <button
              onClick={handleProfileClick}
              className="w-full px-6 py-4 flex items-center space-x-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-base font-medium">प्रोफ़ाइल</span>
            </button>
            
            {/* All Users */}
            <button
              onClick={handleAllUsersClick}
              className="w-full px-6 py-4 flex items-center space-x-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
          </div>
              <span className="text-base font-medium">सभी यूजर</span>
            </button>

            {/* Change Corporation */}
            <button
              onClick={handleChangeCorporation}
              className="w-full px-6 py-4 flex items-center space-x-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-base font-medium">कॉर्पोरेशन बदलें</span>
            </button>
            
            {/* Change Panel */}
            <button
              onClick={handleChangePanel}
              className="w-full px-6 py-4 flex items-center space-x-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
          </div>
              <span className="text-base font-medium">पैनल बदलें</span>
            </button>

            {/* Logout */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={handleLogoutClick}
                className="w-full px-6 py-4 flex items-center space-x-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="w-6 h-6 flex items-center justify-center text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
                <span className="text-base font-medium">लॉग आउट</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default AdminDashboard


