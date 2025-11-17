import React, { useState, useEffect, useMemo } from 'react'
import { displayBuildingPramukh, apiService } from '../../../apidata.jsx'
import AddBuildingPramukhModal from '../modals/AddBuildingPramukhModal.jsx'
import ContactDetailModal from '../modals/ContactDetailModal.jsx'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal.jsx'
import LastLoginModal from '../modals/LastLoginModal.jsx'
import PageHeader from '../common/PageHeader.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import * as XLSX from 'xlsx-js-style'

const BuildingPramukh = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'list', 'grid'
  const [buildingData, setBuildingData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [buildingToEdit, setBuildingToEdit] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [buildingToDelete, setBuildingToDelete] = useState(null)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)

  const [summary, setSummary] = useState({ total_address: 0, matched_address: 0 })

  const buildingPramukhExistingMobiles = useMemo(() => {
    if (!Array.isArray(buildingData)) return []
    const numbers = buildingData
      .map(item => item?.phoneNumber || item?.mobileNo || item?.mobile || item?.phone)
      .filter(Boolean)
      .map(num => num.toString().trim())
    return Array.from(new Set(numbers))
  }, [buildingData])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Function to fetch building pramukh data
  const fetchBuildingPramukh = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'

      const resp = await displayBuildingPramukh(panelApiUrl)
      console.log("data fetched successfully", resp)
      setBuildingData(resp.list || [])
      setSummary(resp.summary || { total_address: 0, matched_address: 0 })
      setLoading(false)
    } catch (err) {
      console.error('Error loading building data:', err)
      setError(err.message || 'Failed to load building data')
      setLoading(false)
    }
  }

  // Load building data
  useEffect(() => {
    fetchBuildingPramukh()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (building) => {
    if (building.phoneNumber) {
      window.open(`tel:${building.phoneNumber}`, '_self')
    }
  }

  const handleMoreOptions = (building) => {
    setSelectedBuilding(building)
    setShowDetailModal(true)
  }

  const handleEdit = (building) => {
    setBuildingToEdit(building)
    setShowEditModal(true)
    setShowDetailModal(false)
  }

  const handleDelete = (building) => {
    setBuildingToDelete(building)
    setShowDeleteConfirm(true)
    setShowDetailModal(false)
  }

  const handleDeleteConfirm = async () => {
    if (!buildingToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: buildingToDelete.id || buildingToDelete.adminId,
        type: 'D',
        sub_type: 'D',
        name: buildingToDelete.name || '',
        mobile_no: buildingToDelete.phoneNumber || buildingToDelete.mobileNo || '',
        photo: buildingToDelete.profileImage || buildingToDelete.photoPath || '',
        base64: '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: buildingToDelete.addresses && buildingToDelete.addresses.length > 0
          ? buildingToDelete.addresses.join('%') + '%'
          : '',
        modify_by: userData?.admin?.adminId || userData?.admin?.id || '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh the list
      await fetchBuildingPramukh()
      
      setShowDeleteConfirm(false)
      setBuildingToDelete(null)
    } catch (err) {
      console.error('Failed to delete building pramukh:', err)
      alert(err.message || 'Failed to delete building pramukh')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setBuildingToDelete(null)
  }

  const handleEditSuccess = async () => {
    await fetchBuildingPramukh()
    setShowEditModal(false)
    setBuildingToEdit(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setBuildingToEdit(null)
  }

  const handleToggleStatus = (buildingId) => {
    // TODO: Implement toggle status functionality
    console.log('Toggle status for building:', buildingId)
    // Refresh the list after status change
    fetchBuildingPramukh()
    setShowDetailModal(false)
  }

  const handleCardClick = (building) => {
    navigate(`/building-detail?buildingId=${building.id}`, { buildingData: building })
  }

  const toggleAddressExpansion = (buildingId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(buildingId)) {
        newSet.delete(buildingId)
      } else {
        newSet.add(buildingId)
      }
      return newSet
    })
  }

  const filteredBuildings = buildingData.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.addresses.some(addr => addr.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalAddresses = summary.total_address
  const totalPramukhs = buildingData.length
  const remainingAddresses = Math.max(0, summary.total_address - summary.matched_address)
  
  const handleExport = () => {
    try {
      // Filter buildings based on search query (same logic as filteredBuildings)
      const filteredData = buildingData.filter(building =>
        building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        building.addresses.some(addr => addr.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      
      if (filteredData.length === 0) {
        alert('No data to export')
        return
      }

      const excelRows = []

      filteredData.forEach((building, index) => {
        const addresses = Array.isArray(building.addresses) && building.addresses.length
          ? building.addresses
          : ['']

        addresses.forEach((address, addrIdx) => {
          excelRows.push({
            'Sr. No.': addrIdx === 0 ? index + 1 : '',
            'Name': addrIdx === 0 ? (building.name || '') : '',
            'Phone Number': addrIdx === 0 ? (building.phoneNumber || building.mobileNo || building.mobile || '') : '',
            'No of Building': addrIdx === 0 ? (building.addressCount || 0) : '',
            'Total Voters': addrIdx === 0 ? (building.voters || 0) : '',
            'Building List': address || ''
          })
        })
      })

      const wb = XLSX.utils.book_new()
      
      const ws = XLSX.utils.aoa_to_sheet([])
      const title = 'Building Pramukh'

      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
      ws['!merges'] = ws['!merges'] || []
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } })
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      }

      const headers = [['Sr. No.', 'Name', 'Phone Number', 'No of Building', 'Total Voters', 'Building List']]
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

      XLSX.utils.sheet_add_json(ws, excelRows, { origin: 'A3', skipHeader: true })

      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 25 },  // Name
        { wch: 15 },  // Phone Number
        { wch: 15 },  // No of Building
        { wch: 12 },  // Total Voters
        { wch: 120 }   // Building List
      ]
      ws['!cols'] = colWidths
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Building Pramukh')
      
      // Generate Excel file and download
      const fileName = `Building_Pramukh_List_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      console.log('Export successful:', fileName)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleSaveNew = async (data) => {
    console.log('New Building Pramukh saved:', data)
    // Refresh the building pramukh list
    await fetchBuildingPramukh()
    setShowAddModal(false)
  }

  const renderProfileImage = (building, size = 'w-12 h-12') => {
    const resolvedPhoto = (() => {
      if (building.photoPath) return building.photoPath
      if (building.photoPath) {
        const trimmed = building.photo.toString().trim()
        if (trimmed.startsWith('data:image')) return trimmed
        if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
          return `data:image/jpeg;base64,${trimmed}`
        }
      }
      if (building.photoPath && building.photo) {
        return `${building.photoPath}${building.photo}`
      }
      return null
    })()

    if (resolvedPhoto) {
      const src = resolvedPhoto.startsWith('http') || resolvedPhoto.startsWith('data:') || resolvedPhoto.startsWith('blob:')
        ? resolvedPhoto
        : resolvedPhoto.startsWith('/')
          ? resolvedPhoto
          : `/${resolvedPhoto}`
      return (
        <div className="relative">
          <img
            src={src}
            alt={building.name}
            className={`${size} rounded-full object-cover border-2 border-gray-200`}
            onError={(e) => {
              e.target.style.display = 'none'
              const fallback = e.target.nextElementSibling
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <div
            className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}
            style={{ display: 'none' }}
          >
            <span className="text-white text-sm font-bold">
              {building.name ? building.name.charAt(0).toUpperCase() : 'B'}
            </span>
          </div>
        </div>
      )
    } else {
      // Generate initials from name
      const initials = building.name ? building.name.charAt(0).toUpperCase() : 'B'
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-sm font-bold">
            {initials}
          </span>
        </div>
      )
    }
  }

  // List View Render
  const renderListView = () => (
    <div className="space-y-1.5 sm:space-y-3">
      {filteredBuildings.map((building, index) => (
        <div key={building.id} className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-sm border border-gray-100 cursor-pointer" onClick={() => handleCardClick(building)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              {/* Profile Image */}
              {renderProfileImage(building, 'w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0')}
              
              {/* Building Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-bold text-xs sm:text-base truncate">
                  {index + 1}. {building.name}
                </h3>
                
                {/* Address Count */}
                <div className="flex items-center space-x-1 sm:space-x-2 mb-0.5 sm:mb-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAddressExpansion(building.id) }}
                    className="text-blue-600 font-medium text-[10px] sm:text-sm hover:text-blue-800 transition-colors"
                  >
                    पता : {building.addressCount}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAddressExpansion(building.id) }}
                    className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                  >
                    {expandedCards.has(building.id) ? (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 14l5-5 5 5z"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Voter Count */}
                <p className="text-gray-800 text-[10px] sm:text-sm">
                  मतदाता : {building.voters}
                </p>
                
                {/* Expanded Address Details */}
                {expandedCards.has(building.id) && (
                  <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                    {building.addresses.map((address, addrIndex) => (
                      <p key={addrIndex} className="text-gray-600 text-[10px] sm:text-xs leading-relaxed">
                        {address}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-1 sm:space-y-2 flex-shrink-0 ml-1.5 sm:ml-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleCall(building) }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{backgroundColor: '#103a94'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoreOptions(building) }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{backgroundColor: '#ea580c'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c2410c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ea580c'}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const lastLogin = building.last_login || building.lastLogin || ''
                  if (lastLogin && lastLogin.toString().trim() !== '') {
                    setSelectedUserForLastLogin({
                      name: building.name,
                      lastLogin: lastLogin
                    })
                    setShowLastLoginModal(true)
                  }
                }}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium text-white w-full ${
                  (building.last_login && building.last_login.toString().trim() !== '') || 
                  (building.lastLogin && building.lastLogin.toString().trim() !== '')
                    ? 'bg-green-500 hover:bg-green-600 cursor-pointer'
                    : 'bg-red-500 hover:bg-red-600'
                } transition-colors`}
              >
                {(building.last_login && building.last_login.toString().trim() !== '') || 
                 (building.lastLogin && building.lastLogin.toString().trim() !== '')
                  ? 'Active' : 'inactive'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Grid View Render
  const renderGridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {filteredBuildings.map((building, index) => (
        <div
          key={building.id}
          onClick={() => handleCardClick(building)}
          className="bg-white rounded-xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer group"
          style={{borderColor: '#e6f0ff'}}
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
              {renderProfileImage(building, 'w-12 h-12 sm:w-16 sm:h-16')}
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center" style={{backgroundColor: '#0d2f7a'}}>
                {index + 1}
              </div>
            </div>
            
            {/* Building Info */}
            <div className="text-center w-full">
              <h3 className="font-bold text-xs sm:text-sm truncate transition-colors mb-1" style={{color: '#1a1a1a'}} onMouseEnter={(e) => e.target.style.color = '#103a94'} onMouseLeave={(e) => e.target.style.color = '#1a1a1a'}>
                {building.name}
              </h3>
              <div className="text-xs mb-2 sm:mb-3 space-y-1">
                <p className="text-gray-600">
                  पता : {building.addressCount}
                </p>
                <p className="text-gray-600">
                  मतदाता : {building.voters}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-full">
              <div className="flex items-center justify-center space-x-2 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCall(building)
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{backgroundColor: '#103a94'}}
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
                    handleMoreOptions(building)
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{backgroundColor: '#ea580c'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c2410c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ea580c'}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const lastLogin = building.last_login || building.lastLogin || ''
                  if (lastLogin && lastLogin.toString().trim() !== '') {
                    setSelectedUserForLastLogin({
                      name: building.name,
                      lastLogin: lastLogin
                    })
                    setShowLastLoginModal(true)
                  }
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-white"
                style={{
                  backgroundColor: ((building.last_login && building.last_login.toString().trim() !== '') || 
                                   (building.lastLogin && building.lastLogin.toString().trim() !== ''))
                    ? '#059669' : '#dc2626'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = ((building.last_login && building.last_login.toString().trim() !== '') || 
                                                   (building.lastLogin && building.lastLogin.toString().trim() !== ''))
                    ? '#047857' : '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = ((building.last_login && building.last_login.toString().trim() !== '') || 
                                                   (building.lastLogin && building.lastLogin.toString().trim() !== ''))
                    ? '#059669' : '#dc2626'
                }}
              >
                {(building.last_login && building.last_login.toString().trim() !== '') || 
                 (building.lastLogin && building.lastLogin.toString().trim() !== '')
                  ? 'Active' : 'inactive'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-700 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50"></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <PageHeader
          title="बिल्डिंग प्रमुख"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

        {/* Search Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Total Count - Left side */}
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{color: '#102463'}}>
                टोटल : {filteredBuildings.length}
              </span>
            </div>
            {/* View Mode Toggle - Right side */}
            <div className="rounded-lg p-1 flex" style={{backgroundColor: '#102463'}}>
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


        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          backgroundColor: '#e5e8ff'
        }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading building pramukhs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium mb-2">Error loading data</p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
              </div>
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">🏢</div>
                <p className="text-gray-600 font-medium">No building pramukhs found</p>
                <p className="text-gray-500 text-sm">Try adjusting your search term</p>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            renderListView()
          ) : (
            renderGridView()
          )}
        </div>

        {/* Footer */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex flex-row items-center justify-between flex-shrink-0 shadow-lg" style={{backgroundColor: '#102463'}}>
          {/* Summary Statistics - Left side */}
          <div className="px-1.5 sm:px-3 py-0.5 sm:py-2 rounded-lg" style={{backgroundColor: '#ffffff'}}>
            <div className="flex items-center space-x-2 sm:space-x-6" style={{color: '#102463'}}>
              <div className="text-center">
                <div className="text-xs sm:text-lg font-bold">{totalAddresses}</div>
                <div className="text-[10px] sm:text-xs">पता</div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-lg font-bold">{totalPramukhs}</div>
                <div className="text-[10px] sm:text-xs">प्रमुख</div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-lg font-bold">{remainingAddresses}</div>
                <div className="text-[10px] sm:text-xs leading-tight">बाकी पता</div>
              </div>
            </div>
          </div>
          
          {/* Buttons - Right side */}
          <div className="flex flex-row items-center gap-1.5 sm:gap-3">
              {/* Export Button */}
              <button 
                onClick={handleExport}
                className="w-auto px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-all shadow-sm hover:shadow-md"
                style={{backgroundColor: 'rgba(220, 38, 38, 0.87)'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(185, 28, 28, 0.85)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.87)'}
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 18H6.2v-1.4h9.6V20zm0-2.8H6.2v-1.4h9.6v1.4zm0-2.8H6.2v-1.4h9.6v1.4zM13 9V3.5L18.5 9H13z"/>
                  <path d="M9 12h6v1.5H9V12zm0 2.5h6V16H9v-1.5zm0 2.5h6V18.5H9V17z"/>
                </svg>
                <span className="text-white text-[10px] sm:text-sm font-medium">Export</span>
              </button>

              {/* Create Building Pramukh Button */}
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-auto px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-all shadow-sm hover:shadow-md"
                style={{backgroundColor: '#ffffff'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" style={{color: '#102463'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-[10px] sm:text-sm font-medium leading-tight" style={{color: '#102463'}}>बिल्डिंग प्रमुख बनाए</span>
              </button>
          </div>
        </div>

      </div>
      
      {/* Custom CSS for Scrollbar */}
      <style>{`
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
      
      {/* Add Building Pramukh Modal */}
      <AddBuildingPramukhModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNew}
        existingMobiles={buildingPramukhExistingMobiles}
        duplicateContextLabel="बिल्डिंग प्रमुख"
      />
    </div>

    {/* Building Pramukh Detail Modal */}
    {showDetailModal && (
      <ContactDetailModal
        person={selectedBuilding}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedBuilding(null)
        }}
        onCall={(person) => handleCall(person)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        title="Building Pramukh"
        roleLabel="Building Pramukh"
        phoneKeys={['phoneNumber', 'mobileNo', 'mobile', 'phone']}
      />
    )}

    {/* Edit Building Pramukh Modal */}
    <AddBuildingPramukhModal
      isOpen={showEditModal}
      onClose={handleCloseEditModal}
      onSuccess={handleEditSuccess}
      building={buildingToEdit}
      existingMobiles={buildingPramukhExistingMobiles}
      duplicateContextLabel="बिल्डिंग प्रमुख"
    />

    {/* Delete Confirmation Modal */}
    <DeleteConfirmationModal
      isOpen={showDeleteConfirm}
      onClose={handleDeleteCancel}
      onConfirm={handleDeleteConfirm}
      admin={buildingToDelete}
    />

    {/* Last Login Modal */}
    {showLastLoginModal && selectedUserForLastLogin && (
      <LastLoginModal
        userName={selectedUserForLastLogin.name}
        lastLogin={selectedUserForLastLogin.lastLogin}
        onClose={() => {
          setShowLastLoginModal(false)
          setSelectedUserForLastLogin(null)
        }}
      />
    )}
    </>
  )
}

export default BuildingPramukh
