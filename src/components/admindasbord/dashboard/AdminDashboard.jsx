import React, { useState, useEffect } from 'react'
import logoImage from '../../../assets/image/ic_app_logo.png'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import MasterSearchModal from '../modals/MasterSearchModal.jsx'
import LogoutConfirmationModal from '../modals/LogoutConfirmationModal.jsx'

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
    
    // Animate in when component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
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
    {
      id: 'call-center',
      name: 'कॉल सर्वे यूज़र',
      icon: 'call-center',
      gradient: 'from-slate-500 to-gray-500',
      bgColor: 'bg-gradient-to-br from-slate-50 to-gray-50',
      iconColor: 'text-slate-600',
      hoverColor: 'hover:from-slate-600 hover:to-gray-600',
      shadowColor: 'shadow-slate-200'
    }
   
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

  return (
    <div className={`relative w-full h-screen overflow-y-auto scroll-smooth transition-all duration-700 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`} style={{ backgroundColor: '#e5e8ff' }}>
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={{ backgroundColor: '#e5e8ff' }}></div>
      
      {/* Responsive Header */}
      <div className="relative z-20 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-lg" style={{ backgroundColor: '#102463' }}>
        {/* Left: BJP Logo */}
        <div className="flex items-center">
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
          <h1 className="text-white text-lg sm:text-xl font-bold">
            ऐडमिन
            </h1>
            </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button 
            onClick={handleLogoutClick}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          {/* <button className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors duration-200">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button> */}
        </div>
      </div>

      {/* Responsive Information Panel */}
      <div className="relative z-10 px-2 sm:px-4 py-2 sm:py-3">
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200">
          <div className="text-center">
            <h2 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#102463' }}>
                  {userData?.corporation?.name || 'ठाणे महानगरपालिका'}
                </h2>
            <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: '#102463' }}>
              {userData?.panel?.name || 'Panel 14'}
            </h3>
            <p className="text-lg sm:text-2xl font-bold" style={{ color: '#102463' }}>
              टोटल मतदाता : {panelVoterCount > 0 ? panelVoterCount.toLocaleString('en-IN') : '0'}
            </p>
              </div>
              </div>
            </div>
            
      {/* Responsive Role Management Section - Heading */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-3">
        <div className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-200 shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#102463' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
            <div className="text-left">
              <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
              संगठन
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full opacity-60" style={{ backgroundColor: '#102463' }}></div>
          </div>
        </div>
      </div>

      {/* Responsive Role Cards Grid */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {roleCards.map((role, index) => (
            <button
              key={role.id}
              onClick={() => handleRoleClick(role)}
              onMouseEnter={() => setHoveredCard(role.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden ${
                hoveredCard === role.id ? 'ring-2 ring-orange-200' : ''
              }`}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Background Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${role.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Icon Container */}
              <div className={`relative w-10 h-10 sm:w-12 sm:h-12 ${role.bgColor} rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-30 rounded-lg sm:rounded-xl transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  {renderIcon(role.icon, role.iconColor)}
                </div>
              </div>
              
              {/* Role Name */}
              <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
                {role.name}
              </span>
              
              {/* Hover Indicator */}
              <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Voter List Section - Heading */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-3">
        <div className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-orange-200 shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
                मतदाता सूची
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full opacity-60"></div>
          </div>
        </div>
      </div>

      {/* Responsive Voter List Search Cards */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {/* Master Search */}
          <button
            onClick={handleMasterSearch}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-30 rounded-lg sm:rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5" style={{ color: '#102463' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Role Name */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
              मास्टर सर्च
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* By Booth */}
          <button
            onClick={() => handleRoleClick({ id: 'booth' })}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-30 rounded-lg sm:rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#102463' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  <path d="M3 5h2v2H3V5zm0 4h2v2H3V9zm0 4h2v2H3v-2zm0 4h2v2H3v-2z" fill="red"/>
                </svg>
              </div>
            </div>
            
            {/* Role Name */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
              बूथ के अनुसार
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* By Address */}
          <button
            onClick={handleAddressClick}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-0 group-hover:opacity-30 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            </div>
            
            {/* Role Name */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
              पते के अनुसार
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* By Polling Station */}
          <button
            onClick={handlePollingStationClick}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-slate-500 opacity-0 group-hover:opacity-30 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  <circle cx="12" cy="8" r="2" fill="red"/>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="orange"/>
                </svg>
              </div>
            </div>
            
            {/* Role Name */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
              मतदान केंद्र के अनुसार
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* By Surname */}
          <button
            onClick={handleSurnameClick}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-30 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z"/>
                  <circle cx="8" cy="6" r="2" fill="blue"/>
                  <circle cx="16" cy="6" r="2" fill="red"/>
                  <circle cx="12" cy="4" r="1" fill="orange"/>
                </svg>
              </div>
            </div>
            
            {/* Role Name */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
              सरनेम के अनुसार
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* By Age */}
          <button
            onClick={handleAgeClick}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-yellow-500 opacity-0 group-hover:opacity-30 rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  <circle cx="8" cy="8" r="2" fill="green"/>
                  <circle cx="16" cy="8" r="2" fill="red"/>
                  <circle cx="12" cy="16" r="2" fill="blue"/>
                  <path d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="orange"/>
                </svg>
              </div>
            </div>
            
            {/* Role Name */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
              उम्र के अनुसार
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      {/* कार्यकर्ता के पहचानवाले Section - Heading */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-3">
        <div className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-200 shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
                कार्यकर्ता के पहचानवाले
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60"></div>
          </div>
        </div>
      </div>

      {/* कार्यकर्ता के पहचानवाले Cards */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {/* कार्यकर्ता की फोनबुक Card */}
          <button
            type="button"
            onClick={() => navigate('/karyakarta-phonebook')}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-30 rounded-lg sm:rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#102463' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  <path d="M6 8h2v2H6V8zm4 0h2v2h-2V8zm4 0h2v2h-2V8z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight transition-colors duration-300 relative z-10 group-hover:opacity-80" style={{ color: '#102463' }}>
              कार्यकर्ता की फोनबुक
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: '#102463' }}></div>
          </button>

          {/* कार्यकर्ता के सरनेम ग्रुप Card */}
          <div 
            onClick={() => navigate('/surname-group-phonebook')}
            className="group relative bg-white rounded-2xl p-4 shadow-lg border border-gray-200 hover:border-red-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[120px] w-auto min-w-[140px] max-w-[160px] overflow-hidden cursor-pointer"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-10 h-10 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-500 opacity-0 group-hover:opacity-30 rounded-lg sm:rounded-xl transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z"/>
                  <circle cx="8" cy="6" r="2" fill="currentColor"/>
                  <circle cx="16" cy="6" r="2" fill="currentColor"/>
                  <circle cx="12" cy="4" r="1" fill="currentColor"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-red-600 transition-colors duration-300 relative z-10">
              कार्यकर्ता के सरनेम ग्रुप
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-r from-red-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
      </div>

      {/* रिपोर्ट Section - Heading */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-3">
        <div className="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-purple-200 shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-gray-800 text-base sm:text-lg font-semibold">
                रिपोर्ट
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full opacity-60"></div>
          </div>
        </div>
      </div>

      {/* रिपोर्ट Cards */}
      <div className="relative z-10 px-2 sm:px-4 pb-2 sm:pb-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
           {/* वोटर सूची रिपोर्ट Card */}
           <div className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-amber-600 opacity-0 group-hover:opacity-30 rounded-full transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="white"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight group-hover:text-orange-600 transition-colors duration-300 relative z-10">
            कार्यकर्ता का स्लिप प्रचार
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          {/* स्लिप प्रचार रिपोर्ट Card */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600 opacity-0 group-hover:opacity-30 rounded-full transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  <path d="M8 4h8v2H8V4zm0 4h8v2H8V8zm0 4h5v2H8v-2z" fill="white"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <span className="text-gray-700 text-sm font-semibold text-center leading-tight group-hover:text-green-600 transition-colors duration-300 relative z-10">
              स्लिप प्रचार<br/>रिपोर्ट
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* केडर सर्वे रिपोर्ट Card */}
          <div 
            onClick={() => navigate('/cadre-survey-report')}
            className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden cursor-pointer"
          >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg" style={{ backgroundColor: '#102463' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-full transition-opacity duration-300" style={{ backgroundColor: '#102463' }}></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z"/>
                  <circle cx="8" cy="6" r="2" fill="white"/>
                  <circle cx="16" cy="6" r="2" fill="white"/>
                  <circle cx="12" cy="4" r="1" fill="white"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <span className="text-gray-700 text-xs sm:text-sm font-semibold text-center leading-tight transition-colors duration-300 relative z-10 group-hover:opacity-80" style={{ color: '#102463' }}>
              केडर सर्वे<br/>रिपोर्ट
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: '#102463' }}></div>
          </div>

          {/* कॉल सेंटर सर्वे रिपोर्ट Card */}
          <div className="group relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] w-auto min-w-[120px] sm:min-w-[140px] max-w-[140px] sm:max-w-[160px] overflow-hidden">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Container */}
            <div className="relative w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 shadow-md group-hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-0 group-hover:opacity-30 rounded-full transition-opacity duration-300"></div>
              <div className="relative z-10">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <span className="text-gray-700 text-sm font-semibold text-center leading-tight group-hover:text-purple-600 transition-colors duration-300 relative z-10">
              कॉल सेंटर सर्वे<br/>रिपोर्ट
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
      
    </div>
  )
}

export default AdminDashboard


