import React, { useState, useEffect, useMemo, useCallback } from 'react'
import * as XLSX from 'xlsx-js-style'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import PageHeader from '../common/PageHeader.jsx'
import ContactActionModal from '../modals/ContactActionModal.jsx'
import LastLoginModal from '../modals/LastLoginModal.jsx'

const FALLBACK_PANEL_URL = 'http://ntmc2.mhbjplok.com/webservice.asmx'

const parseBooleanValue = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }
  return false
}

const determineActiveByLastLogin = (lastLogin) => {
  if (!lastLogin) return false
  const normalized = lastLogin.toString().trim().toLowerCase()
  if (!normalized) return false
  const inactiveTokens = ['0', 'null', 'na', 'nil', 'not login', 'never']
  return !inactiveTokens.includes(normalized)
}

  const getInitials = (name = '') => {
    if (!name) return 'यू'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
  }

const AllUsers = ({ navigation }) => {
  const navigateTo = navigation?.navigate || (() => {})

  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [organizationFilter, setOrganizationFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'list', 'grid'
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionContact, setActionContact] = useState(null)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const userData = localStorageManager.getUserData()
      const panelApiUrl =
        userData?.panel?.apiUrl ||
        userData?.apiUrl ||
        FALLBACK_PANEL_URL

      const apiUsers = await apiService.disAllAdmin(panelApiUrl)

      const normalizedUsers = (Array.isArray(apiUsers) ? apiUsers : []).map((user, index) => {
        const lastLogin = user.lastLogin || ''
        return {
          id: user.adminId || `user-${index}`,
          name: user.name || '—',
          designation: user.designation || '-',
          mobileNo: user.mobileNo ? String(user.mobileNo) : '',
          type: user.type || '',
          subType: user.subType || '',
          boothJavabdari: user.boothJavabdari ?? '0',
          tempStatus: parseBooleanValue(user.tempStatus),
          lastLogin,
          photoPath: user.photoPath || '',
          isActive: determineActiveByLastLogin(lastLogin)
        }
      })

      setUsers(normalizedUsers)
    } catch (err) {
      console.error('Error fetching all users:', err)
      setError(err.message || 'Failed to fetch user list')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllUsers()
  }, [fetchAllUsers])

  const organizationOptions = useMemo(() => {
    const unique = new Set()
    users.forEach((user) => {
      if (user.designation && user.designation.trim()) {
        unique.add(user.designation.trim())
      }
    })
    return Array.from(unique)
  }, [users])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const numericQuery = searchQuery.trim()

    return users
      .filter((user) => {
        const nameMatch = !query || user.name.toLowerCase().includes(query)
        const mobileMatch = !numericQuery || user.mobileNo.includes(numericQuery)
        const orgMatch = organizationFilter === 'all' || user.designation === organizationFilter
        const statusMatch =
          statusFilter === 'all' ||
          (statusFilter === 'active' ? user.isActive : !user.isActive)

        return (nameMatch || mobileMatch) && orgMatch && statusMatch
      })
      .map((user, index) => ({
        ...user,
        srNo: index + 1
      }))
  }, [users, searchQuery, organizationFilter, statusFilter])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigateTo('/admin')
    }, 300)
  }

  const handleCall = (mobileNo) => {
    if (!mobileNo) return
    window.open(`tel:${mobileNo}`, '_self')
  }

  const handleOpenActions = (user, event) => {
    event.stopPropagation()
    if (!user?.mobileNo || user.mobileNo === '' || user.mobileNo === 'N/A') return
    setActionContact({
      mobile: user.mobileNo,
      name: user.name
    })
    setShowActionModal(true)
  }

  const handleActionSelect = (actionType) => {
    if (!actionContact?.mobile) return
    const mobile = actionContact.mobile
    if (actionType === 'call') {
      window.open(`tel:${mobile}`, '_self')
    } else if (actionType === 'whatsapp') {
      const phone = mobile.startsWith('+') ? mobile : `+91${mobile}`
      window.open(`https://wa.me/${phone.replace(/[^0-9+]/g, '')}`, '_blank')
    } else if (actionType === 'sms') {
      window.open(`sms:${mobile}`, '_self')
    }
    setShowActionModal(false)
  }

  const handleCloseActionModal = () => {
    setShowActionModal(false)
    setActionContact(null)
  }

  const handleStatusClick = (user, event) => {
    event.stopPropagation()
    if (user.isActive && user.lastLogin) {
      setSelectedUserForLastLogin({
        name: user.name,
        lastLogin: user.lastLogin
      })
      setShowLastLoginModal(true)
    }
  }

  const handleToggleTempStatus = (userId, event) => {
    if (event) {
      event.stopPropagation()
    }
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId
          ? { ...user, tempStatus: !user.tempStatus }
          : user
      )
    )
  }

  const ProfileImage = ({ user, size = 'w-12 h-12' }) => {
    const [imageError, setImageError] = useState(false)

    if (user.photoPath && !imageError) {
      return (
        <img
          src={user.photoPath}
          alt={user.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
          onError={() => setImageError(true)}
        />
      )
    }

    const initials = getInitials(user.name)

    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}
      >
        <span className="text-white text-sm font-bold">{initials || 'यू'}</span>
      </div>
    )
  }

  const handleExport = () => {
    const dataset = filteredUsers.length ? filteredUsers : users
    if (!dataset.length) {
      alert('No data available to export')
      return
    }

    const excelRows = dataset.map((user, index) => ({
      'Sr. No.': index + 1,
      Name: user.name,
      Designation: user.designation || '',
      'Mobile No': user.mobileNo,
      Status: user.isActive ? 'Active' : 'Not Active',
      'Booth No.': user.boothJavabdari || '0',
      'Last Login': user.lastLogin || ''
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([])

    const title = 'All Users'
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
    ws['!merges'] = ws['!merges'] || []
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } })
    ws['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center', vertical: 'center' }
    }

    const headers = [['Sr. No.', 'Name', 'Designation', 'Mobile No', 'Status', 'Booth No.', 'Last Login']]
    XLSX.utils.sheet_add_aoa(ws, headers, { origin: 'A2' })
    headers[0].forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIndex })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '102463' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        }
      }
    })

    XLSX.utils.sheet_add_json(ws, excelRows, { origin: 'A3', skipHeader: true })
    ws['!cols'] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
      { wch: 22 }
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'AllUsers')
    const fileName = `All_Users_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // List View Render
  const renderListView = () => (
    <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
      {filteredUsers.map((user, index) => {
        return (
          <div
            key={`${user.id}-${index}`}
            className="bg-white rounded-lg p-2 sm:p-3 md:p-4 border transition-all cursor-pointer"
            style={{ borderColor: '#e6f0ff' }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#103a94'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e6f0ff'
            }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <div className="flex-shrink-0">
                <ProfileImage user={user} size="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-gray-500 text-[10px] sm:text-xs md:text-sm font-medium flex-shrink-0">{index + 1}.</span>
                  <h3 className="text-gray-900 font-semibold text-xs sm:text-sm md:text-base truncate">
                    {user.name}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCall(user.mobileNo)
                    }}
                    className="text-[#0a66c2] font-semibold hover:underline"
                  >
                    {user.mobileNo || 'N/A'}
                  </button>
                  <span className="text-gray-300">•</span>
                  <span className="font-semibold text-[#6f7edb] truncate">{user.designation}</span>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-0.5 sm:space-y-1 md:space-y-2 flex-shrink-0">
                {/* Call and Toggle buttons in same row */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
                  <button
                    onClick={(e) => {
                      handleOpenActions(user, e)
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                    style={{ backgroundColor: '#103a94' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                 {/*  <button
                    type="button"
                    onClick={(e) => handleToggleTempStatus(user.id, e)}
                    className="relative w-[40px] sm:w-[50px] h-5 sm:h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#102463] cursor-pointer"
                    style={{
                      backgroundColor: user.tempStatus ? '#c7d4ff' : '#d1d5db'
                    }}
                  >
                    <span
                      className={`absolute top-[2px] left-[2px] w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md transition-all duration-200 ease-in-out ${
                        user.tempStatus ? 'translate-x-[20px] sm:translate-x-[26px]' : 'translate-x-0'
                      }`}
                      style={{
                        backgroundColor: user.tempStatus ? '#0f1d63' : '#f5f5f5'
                      }}
                    ></span>
                  </button> */}
                </div>
                {/* Active/Inactive button below */}
                <button
                  onClick={(e) => {
                    handleStatusClick(user, e)
                  }}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                    user.isActive
                      ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                      : 'bg-red-500 text-white hover:bg-red-600 cursor-default'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Grid View Render
  const renderGridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {filteredUsers.map((user, index) => {
        return (
          <div
            key={`${user.id}-${index}`}
            className="bg-white rounded-xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer group"
            style={{ borderColor: '#e6f0ff' }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#103a94'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e6f0ff'
            }}
          >
            <div className="flex flex-col items-center space-y-2 sm:space-y-3">
              {/* Profile Image */}
              <div className="relative">
                <ProfileImage user={user} size="w-12 h-12 sm:w-16 sm:h-16" />
              </div>
              
              {/* User Info */}
              <div className="text-center w-full">
                <h3 className="font-bold text-xs sm:text-sm truncate transition-colors mb-1" style={{ color: '#1a1a1a' }} onMouseEnter={(e) => e.target.style.color = '#103a94'} onMouseLeave={(e) => e.target.style.color = '#1a1a1a'}>
                  {user.name}
                </h3>
                <p className="text-xs mb-1 flex items-center justify-center" style={{ color: '#4a5568' }}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#718096' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate">{user.mobileNo || 'N/A'}</span>
                </p>
                <p className="text-xs mb-2 sm:mb-3 font-semibold truncate" style={{ color: '#6f7edb' }}>
                  {user.designation}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-full">
                {/* Call and Toggle buttons in same row */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                  <button
                    onClick={(e) => {
                      handleOpenActions(user, e)
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                    style={{ backgroundColor: '#103a94' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  {/* <button
                    type="button"
                    onClick={(e) => handleToggleTempStatus(user.id, e)}
                    className="relative flex-1 max-w-[40px] sm:max-w-[50px] h-5 sm:h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#102463] cursor-pointer"
                    style={{
                      backgroundColor: user.tempStatus ? '#c7d4ff' : '#d1d5db'
                    }}
                  >
                    <span
                      className={`absolute top-[2px] left-[2px] w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md transition-all duration-200 ease-in-out ${
                        user.tempStatus ? 'translate-x-[20px] sm:translate-x-[26px]' : 'translate-x-0'
                      }`}
                      style={{
                        backgroundColor: user.tempStatus ? '#0f1d63' : '#f5f5f5'
                      }}
                    ></span>
                  </button> */}
                </div>
                <button
                  onClick={(e) => {
                    handleStatusClick(user, e)
                  }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-white cursor-pointer"
                  style={{
                    backgroundColor: user.isActive ? '#059669' : '#dc2626'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = user.isActive ? '#047857' : '#b91c1c'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = user.isActive ? '#059669' : '#dc2626'
                  }}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1c4d] via-[#0f2d7a] to-[#1c3d92]"></div>

      <div className="relative z-10 h-full flex flex-col">
        <PageHeader
          title="सभी यूजर"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

        {/* Filter Section */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#dfe5ff' }}>
          {/* Mobile View: Stacked layout */}
          <div className="flex flex-col md:hidden gap-2 sm:gap-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {/* Total Count - Left side */}
              <div className="px-2 py-1 rounded-lg inline-block">
                <span className="text-sm font-bold" style={{ color: '#102463' }}>
                  टोटल : {filteredUsers.length}
                </span>
              </div>
              {/* View Mode Toggle - Right side */}
              <div className="rounded-lg p-1 flex" style={{ backgroundColor: '#102463' }}>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-amber-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-amber-600' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#102463] mb-1 block">संगठन</label>
                <select
                  value={organizationFilter}
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                  className="w-full bg-white border border-[#cdd4ff] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102463] text-gray-700"
                >
                  <option value="all">सभी</option>
                  {organizationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#102463] mb-1 block">STATUS</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-[#cdd4ff] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102463] text-gray-700"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Not Active</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop View: All in one row - Total | Filters | Toggle */}
          <div className="hidden md:flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
            {/* Total Count - Left side */}
            <div className="px-2 py-1 rounded-lg inline-block flex-shrink-0">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {filteredUsers.length}
              </span>
            </div>
            
            {/* Filters - Middle */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center max-w-2xl">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#102463] mb-1 block">संगठन</label>
                <select
                  value={organizationFilter}
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                  className="w-full bg-white border border-[#cdd4ff] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102463] text-gray-700"
                >
                  <option value="all">सभी</option>
                  {organizationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="w-px h-8 bg-gray-300"></div>

              <div className="flex-1">
                <label className="text-xs font-semibold text-[#102463] mb-1 block">STATUS</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-[#cdd4ff] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102463] text-gray-700"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Not Active</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle - Right side */}
            <div className="rounded-lg p-1 flex flex-shrink-0" style={{ backgroundColor: '#102463' }}>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white text-amber-600' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-amber-600' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 sm:px-4 pb-20 space-y-3 sm:space-y-4" style={{ backgroundColor: '#dfe5ff' }}>
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 text-sm">डेटा लोड हो रहा है...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-white rounded-2xl p-6 text-center shadow border border-red-100">
              <div className="text-red-500 text-3xl mb-2">⚠️</div>
              <p className="text-red-600 text-sm font-semibold mb-3">{error}</p>
              <button
                type="button"
                onClick={fetchAllUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                पुनः प्रयास करें
              </button>
            </div>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
              <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
            </div>
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <>
              {viewMode === 'list' && renderListView()}
              {viewMode === 'grid' && renderGridView()}
            </>
          )}
        </div>

        <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-row items-center justify-end flex-shrink-0 shadow-lg" style={{ backgroundColor: '#102463' }}>
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            <button 
              onClick={handleExport}
              className="w-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md"
              style={{ backgroundColor: 'rgba(220, 38, 38, 0.87)' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(185, 28, 28, 0.85)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.87)'}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 18H6.2v-1.4h9.6V20zm0-2.8H6.2v-1.4h9.6v1.4zm0-2.8H6.2v-1.4h9.6v1.4zM13 9V3.5L18.5 9H13z"/>
                <path d="M9 12h6v1.5H9V12zm0 2.5h6V16H9v-1.5zm0 2.5h6V18.5H9V17z"/>
              </svg>
              <span className="text-white text-xs sm:text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      <ContactActionModal
        isOpen={showActionModal}
        onClose={handleCloseActionModal}
        onSelect={handleActionSelect}
      />

      {showLastLoginModal && (
        <LastLoginModal
          userName={selectedUserForLastLogin?.name}
          lastLogin={selectedUserForLastLogin?.lastLogin}
          onClose={() => {
            setShowLastLoginModal(false)
            setSelectedUserForLastLogin(null)
          }}
        />
      )}
    </div>
  )
}

export default AllUsers

