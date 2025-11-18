import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../common/PageHeader.jsx'
import { display_no_phonebook_match_user } from '../../../apidata.jsx'
import ContactActionModal from '../modals/ContactActionModal.jsx'
import LastLoginModal from '../modals/LastLoginModal.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import * as XLSX from 'xlsx-js-style'

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  return []
}

// Organization type mapping with Hindi names
const ORGANIZATION_META = {
    A: 'ऐडमिन',
    BP: 'बूथ प्रमुख',
    SP: 'शक्ति केन्द्र प्रमुख',
    BS: 'बुथ सह इनचार्ज',
    K: 'कार्यकर्ता',
    AP: 'बिल्डिंग प्रमुख',
    SA: 'सब ऐडमिन',
    cl: 'कॉल सेंटर',
    SSP: 'सह शक्ति केन्द्र प्रमुख'
}

const MatchRemaining = ({ navigation }) => {
  const { navigate } = navigation
  const [userData, setUserData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrganization, setSelectedOrganization] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [organizationOpen, setOrganizationOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionContact, setActionContact] = useState(null)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'list', 'grid'

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await display_no_phonebook_match_user(panelApiUrl)
      const records = normalizeResponse(response).map((item, index) => ({
        id: item.admin_id || index,
        adminId: item.admin_id,
        name: item.name || 'N/A',
        mobile: item.mobile_no || '-',
        photo: item.image || '',
        boothJavabdari: item.booth_javabdari || '0',
        subType: item.sub_type || 'A',
        lastLogin: item.last_login || '',
        status: item.status || null // Check if API returns status directly
      }))
      setUserData(records)
    } catch (err) {
      console.error('Error fetching match remaining data:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setUserData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const organizationOptions = useMemo(() => {
    const uniqueOrgs = new Set(userData.map((item) => item.subType).filter(Boolean))
    // Filter to only include organization types that exist in ORGANIZATION_META
    const validOrgs = Array.from(uniqueOrgs).filter(org => ORGANIZATION_META.hasOwnProperty(org))
    return ['all', ...validOrgs]
  }, [userData])

  // Determine if user is active based on status field or last_login
  const isUserActive = (user) => {
    // If API returns status field directly, use it
    if (user.status !== null && user.status !== undefined) {
      return user.status === 'active' || user.status === 1 || user.status === '1'
    }
    // Otherwise, check if lastLogin exists (users with login are considered active)
    return !!user.lastLogin
  }

  const filteredData = useMemo(() => {
    return userData.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mobile.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesOrganization = selectedOrganization === 'all' || item.subType === selectedOrganization

      let matchesStatus = true
      if (selectedStatus !== 'all') {
        const isActive = isUserActive(item)
        if (selectedStatus === 'active') {
          matchesStatus = isActive
        } else if (selectedStatus === 'not_active') {
          matchesStatus = !isActive
        }
      }

      return matchesSearch && matchesOrganization && matchesStatus
    })
  }, [userData, searchQuery, selectedOrganization, selectedStatus])

  const handleBack = () => {
    navigate(-1)
  }

  const handleOpenActions = (contact, event) => {
    event.stopPropagation()
    if (!contact?.mobile || contact.mobile === '-') return
    setActionContact(contact)
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

  const handleExport = () => {
    try {
      if (filteredData.length === 0) {
        alert('No data to export')
        return
      }

      const excelData = filteredData.map((item, index) => ({
        'Sr. No.': index + 1,
        'Name': item.name || '',
        'Mobile': item.mobile || '-',
        'Designation': ORGANIZATION_META[item.subType] || '',
        'Booth No.': item.boothJavabdari || '0',
        'Last Login': item.lastLogin || '',
        'Status': isUserActive(item) ? 'Active' : 'Inactive'
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([])
      const title = 'मेच बाकी'
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
      ws['!merges'] = ws['!merges'] || []
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } })
      ws['A1'].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      const headers = [['Sr. No.', 'Name', 'Mobile', 'Designation', 'Booth No.', 'Last Login', 'Status']]
      XLSX.utils.sheet_add_aoa(ws, headers, { origin: 'A2' })
      headers[0].forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIndex })
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4472C4' } },
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
      XLSX.utils.sheet_add_json(ws, excelData, { origin: 'A3', skipHeader: true })

      const colWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 25 },  // Name
        { wch: 15 },  // Mobile
        { wch: 15 },  // Designation
        { wch: 15 },  // Booth No.
        { wch: 20 },  // Last Login
        { wch: 12 }   // Status
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Match Remaining')
      const fileName = `Match_Remaining_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

      console.log('Export successful:', fileName)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const ProfileImage = ({ item, size = 'w-12 h-12' }) => {
    const [imageError, setImageError] = useState(false)

    if (item.photo && !imageError) {
      return (
        <img
          src={item.photo}
          alt={item.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
          onError={() => setImageError(true)}
        />
      )
    }

    const initials = (item.name || 'A')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()

    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}
      >
        <span className="text-white text-sm font-bold">{initials || 'A'}</span>
      </div>
    )
  }

  const handleStatusClick = (user, event) => {
    event.stopPropagation()
    const isActive = isUserActive(user)
    if (isActive && user.lastLogin) {
      setSelectedUserForLastLogin({
        name: user.name,
        lastLogin: user.lastLogin
      })
      setShowLastLoginModal(true)
    }
  }

  const handleCall = (user) => {
    if (!user?.mobile || user.mobile === '-') return
    window.open(`tel:${user.mobile}`, '_self')
  }

  // List View Render
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3">
      {filteredData.map((item, index) => {
        const isActive = isUserActive(item)
        return (
          <div
            key={`${item.id}-${index}`}
            className="bg-white rounded-lg p-3 sm:p-4 border transition-all cursor-pointer"
            style={{ borderColor: '#e6f0ff' }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#103a94'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e6f0ff'
            }}
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <ProfileImage item={item} size="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {/* <span className="text-gray-500 text-xs sm:text-sm font-medium">{index + 1}.</span> */}
                  <h3 className="text-gray-900 font-semibold text-sm sm:text-base truncate">
                    {item.name}
                  </h3>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate">
                  {item.mobile}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenActions(item, e)
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: '#103a94' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusClick(item, e)
                  }}
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
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
      {filteredData.map((item, index) => {
        const isActive = isUserActive(item)
        return (
          <div
            key={`${item.id}-${index}`}
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
              {/* Profile Image with Number Badge */}
              <div className="relative">
                <ProfileImage item={item} size="w-12 h-12 sm:w-16 sm:h-16" />
            {/*     <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center" style={{ backgroundColor: '#0d2f7a' }}>
                  {index + 1}
                </div> */}
              </div>
              
              {/* User Info */}
              <div className="text-center w-full">
                <h3 className="font-bold text-xs sm:text-sm truncate transition-colors mb-1" style={{ color: '#1a1a1a' }} onMouseEnter={(e) => e.target.style.color = '#103a94'} onMouseLeave={(e) => e.target.style.color = '#1a1a1a'}>
                  {item.name}
                </h3>
                <p className="text-xs mb-2 sm:mb-3 flex items-center justify-center" style={{ color: '#4a5568' }}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#718096' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate">{item.mobile}</span>
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenActions(item, e)
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: '#103a94' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusClick(item, e)
                  }}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-white"
                  style={{
                    backgroundColor: isActive ? '#059669' : '#dc2626'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isActive ? '#047857' : '#b91c1c'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isActive ? '#059669' : '#dc2626'
                  }}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title="मेच बाकी"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Filter Section */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        {/* Mobile View: Stacked layout */}
        <div className="flex flex-col md:hidden gap-2 sm:gap-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Total Count - Left side */}
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {filteredData.length}
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
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => {
                setOrganizationOpen(!organizationOpen)
                setStatusOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-left"
            >
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {selectedOrganization === 'all' ? 'संगठन' : ORGANIZATION_META[selectedOrganization] || selectedOrganization}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${organizationOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {organizationOpen && (
              <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {organizationOptions.map((org) => (
                  <button
                    key={org}
                    type="button"
                    onClick={() => {
                      setSelectedOrganization(org)
                      setOrganizationOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 ${
                      selectedOrganization === org ? 'text-blue-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {org === 'all' ? 'सभी' : ORGANIZATION_META[org] || org}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-gray-300"></div>

          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => {
                setStatusOpen(!statusOpen)
                setOrganizationOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-left"
            >
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {selectedStatus === 'all' ? 'STATUS' : selectedStatus === 'active' ? 'Active' : 'Inactive'}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {['all', 'active', 'not_active'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(status)
                      setStatusOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                      selectedStatus === status ? 'text-blue-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {status === 'all' ? 'सभी' : status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Desktop View: All in one row - Total | Filters | Toggle */}
        <div className="hidden md:flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          {/* Total Count - Left side */}
          <div className="px-2 py-1 rounded-lg inline-block flex-shrink-0">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {filteredData.length}
            </span>
          </div>
          
          {/* Filters - Middle */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center max-w-2xl">
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => {
                  setOrganizationOpen(!organizationOpen)
                  setStatusOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-left"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {selectedOrganization === 'all' ? 'संगठन' : ORGANIZATION_META[selectedOrganization] || selectedOrganization}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${organizationOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {organizationOpen && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {organizationOptions.map((org) => (
                    <button
                      key={org}
                      type="button"
                      onClick={() => {
                        setSelectedOrganization(org)
                        setOrganizationOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 ${
                        selectedOrganization === org ? 'text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {org === 'all' ? 'सभी' : ORGANIZATION_META[org] || org}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-gray-300"></div>

            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => {
                  setStatusOpen(!statusOpen)
                  setOrganizationOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-left"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {selectedStatus === 'all' ? 'STATUS' : selectedStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {['all', 'active', 'not_active'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(status)
                        setStatusOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                        selectedStatus === status ? 'text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {status === 'all' ? 'सभी' : status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  ))}
                </div>
              )}
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 sm:px-4 pb-20 space-y-3 sm:space-y-4">
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
              onClick={fetchUserData}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {!loading && !error && filteredData.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
            <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredData.length > 0 && (
          <>
            {viewMode === 'list' && renderListView()}
            {viewMode === 'grid' && renderGridView()}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-row items-center justify-end flex-shrink-0 shadow-lg" style={{ backgroundColor: '#102463' }}>
        <div className="flex flex-row items-center gap-2 sm:gap-3">
          {/* Export Button */}
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

export default MatchRemaining

