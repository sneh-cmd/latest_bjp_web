import React, { useState, useEffect } from 'react'
import logoImage from '../../../assets/image/BJP-Logo.png'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import AddBoothHeadModal from '../modals/AddBoothHeadModal.jsx'
import BoothPramukhListModal from '../modals/BoothPramukhListModal.jsx'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'

// Color constants
const COLORS = {
  BACKGROUND: '#e5e8ff',
  MAIN: '#102463'
}
const BoothPramukh = ({ navigation }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'list', 'grid'
  const [boothData, setBoothData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddBoothHeadModal, setShowAddBoothHeadModal] = useState(false)
  const [selectedBoothNumber, setSelectedBoothNumber] = useState(null)
  const [showBoothPramukhListModal, setShowBoothPramukhListModal] = useState(false)
  const [selectedBoothForList, setSelectedBoothForList] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch booth data from API
  useEffect(() => {
    const fetchBoothData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching booth data from:', panelApiUrl)
        
        // Call the real API
        const apiData = await apiService.displayBoothPramukh(panelApiUrl)
        
        // Transform API data to match component structure
        const transformedData = apiData.map((booth, index) => {
          const rawHeadName = sanitizeHeadField(booth.headName)
          const normalizedHeadName = rawHeadName.toLowerCase()
          const isPlaceholderName = !rawHeadName || normalizedHeadName === 'unassigned' || normalizedHeadName === `booth head ${booth.boothNo}`.toLowerCase()
          const primaryRole = sanitizeHeadField(booth.headRole || booth.designation || booth.role, { allowFallback: true, fallback: 'बुथ प्रमुख' })
          const primaryPhone = sanitizeHeadField(booth.headPhone || booth.mobileNo)

          const initialHeadDetails = !isPlaceholderName && rawHeadName
            ? [createHeadEntry({ name: rawHeadName, phone: primaryPhone, role: primaryRole })]
            : []

          return {
          id: parseInt(booth.boothNo) || index + 1,
          boothNumber: parseInt(booth.boothNo) || 0,
          voters: booth.voterCount || 0,
          heads: booth.totalBoothPramukh || 0,
          assigned: (booth.totalBoothPramukh || 0) > 0,
          profileImage: booth.photoPath || null,
          photoPath: booth.photoPath || null,
          isPhoto: Boolean(booth.photoPath && booth.photoPath.trim() !== ''),
            name: rawHeadName || (booth.totalBoothPramukh > 0 ? `Booth Head ${booth.boothNo}` : 'Unassigned'),
            phoneNumber: primaryPhone,
            status: booth.status || (booth.last_login && booth.last_login.trim() !== '' ? 'active' : 'inactive'),
            role: primaryRole,
          headDetails: initialHeadDetails
        }
        })
        
        console.log('Transformed booth data:', transformedData)
        setBoothData(transformedData)
      } catch (err) {
        console.error('Error fetching booth data:', err)
        setError(err.message || 'Failed to fetch booth data')
      } finally {
        setLoading(false)
      }
    }

    fetchBoothData()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (booth) => {
    if (booth.phoneNumber) {
      window.open(`tel:${booth.phoneNumber}`, '_self')
    }
  }

  const handleWhatsApp = (booth) => {
    // If there are more than 1 booth heads, show the list modal
    if (booth.heads > 1) {
      setSelectedBoothForList(booth)
      setShowBoothPramukhListModal(true)
      return
    }

    // If only 1 booth head, open WhatsApp directly
    if (!booth.phoneNumber) {
      alert('Phone number not available')
      return
    }

    // Remove all non-digit characters (spaces, dashes, +, etc.)
    let phoneNumber = booth.phoneNumber.replace(/\D/g, '')
    
    // Remove leading zeros
    phoneNumber = phoneNumber.replace(/^0+/, '')
    
    // If number already starts with country code 91, use it as is
    if (phoneNumber.startsWith('91')) {
      // Remove the 91 prefix temporarily to check the actual number length
      const actualNumber = phoneNumber.substring(2)
      if (actualNumber.length === 10) {
        // Valid format: 91XXXXXXXXXX
        window.open(`https://wa.me/${phoneNumber}`, '_blank')
        return
      }
    }
    
    // If number is exactly 10 digits, add country code 91
    if (phoneNumber.length === 10) {
      const formattedNumber = '91' + phoneNumber
      window.open(`https://wa.me/${formattedNumber}`, '_blank')
      return
    }
    
    // If number is 12 digits and starts with 91, use as is
    if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
      window.open(`https://wa.me/${phoneNumber}`, '_blank')
      return
    }
    
    // Invalid format
    alert('Invalid phone number format. Please ensure it is a valid 10-digit Indian number.')
  }

  const handleShowBoothCadre = () => {
    if (selectedBoothForList) {
      navigate(`/booth-detail?boothId=${selectedBoothForList.boothNumber}`, {
        state: { boothData: selectedBoothForList }
      })
    }
  }


  const handleBoothClick = (booth) => {
    if (booth.assigned) {
      navigate(`/booth-detail?boothId=${booth.boothNumber}`, {
        state: { boothData: booth },
      });
    }
  };

  const toggleStatus = (boothId) => {
    // Toggle status logic here
    console.log('Toggle status for booth:', boothId)
  }

  const handleOpenCreateModal = (boothNumber) => {
    setSelectedBoothNumber(boothNumber)
    setShowAddBoothHeadModal(true)
  }

  const sanitizeHeadField = (value, { allowFallback = false, fallback = '' } = {}) => {
    if (value === null || value === undefined) {
      return allowFallback ? fallback : ''
    }
    const trimmed = value.toString().trim()
    if (trimmed === '' && allowFallback) {
      return fallback
    }
    return trimmed
  }

  const createHeadEntry = ({ name, phone, role }) => {
    return {
      name: sanitizeHeadField(name),
      phone: sanitizeHeadField(phone),
      role: sanitizeHeadField(role, { allowFallback: true, fallback: 'बुथ प्रमुख' })
    }
  }

  const isPlaceholderHeadName = (name = '', boothNumber) => {
    const trimmed = sanitizeHeadField(name)
    if (trimmed === '' || trimmed.toLowerCase() === 'unassigned') return true
    const generatedName = `booth head ${boothNumber}`.toLowerCase()
    return trimmed.toLowerCase() === generatedName
  }

  const extractBoothHeadsFromCadre = (cadreList = []) => {
    if (!Array.isArray(cadreList)) return []
    return cadreList
      .filter(cadre => {
        const subType = cadre.sub_type || cadre.subType || ''
        const type = cadre.type || ''
        const designation = cadre.designation || cadre.role || ''

        const isBoothHeadByType = type === 'BP' && (subType === 'BP' || !subType || subType === '')
        const isBoothHeadByRole = designation === 'बुथ प्रमुख' || designation === 'Booth Pramukh' ||
                                  designation === 'बूथ प्रमुख' || cadre.role === 'बुथ प्रमुख'
        const isNotCoIncharge = subType !== 'BS' &&
                                designation !== 'बुथ सह इनचार्ज' &&
                                designation !== 'Co Incharge' &&
                                cadre.role !== 'बुथ सह इनचार्ज'
        return (isBoothHeadByType || isBoothHeadByRole) && isNotCoIncharge
      })
      .map(cadre => createHeadEntry({
        name: cadre.name || cadre.full_name,
        phone: cadre.phone || cadre.mobile || cadre.mobile_no || cadre.mobileNo || cadre.phoneNumber,
        role: cadre.role || cadre.designation
      }))
  }

  const handleExport = async () => {
    try {
      // Filter booths based on search query (same logic as filteredBooths)
      const filteredData = boothData.filter(booth =>
        booth.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booth.boothNumber.toString().includes(searchQuery) ||
        (booth.phoneNumber || '').includes(searchQuery)
      )
      
      if (filteredData.length === 0) {
        alert('No data to export')
        return
      }

      const headDetailsMap = {}

      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'

      for (const booth of filteredData) {
        if (!booth.heads || booth.heads <= 0) {
          continue
        }

        if (headDetailsMap[booth.boothNumber]) {
          continue
        }

        let headEntries = Array.isArray(booth.headDetails) && booth.headDetails.length
          ? booth.headDetails.map(entry => createHeadEntry(entry))
          : []

        if (!headEntries.length && !isPlaceholderHeadName(booth.name, booth.boothNumber)) {
          headEntries.push(createHeadEntry({
            name: booth.name,
            phone: booth.phoneNumber,
            role: booth.role
          }))
        }

        try {
          const cadreList = await apiService.displayBoothPramukhCadre(booth.boothNumber, panelApiUrl)
          const extractedHeads = extractBoothHeadsFromCadre(cadreList)
          if (extractedHeads.length) {
            headEntries = headEntries.concat(extractedHeads)
          }
        } catch (error) {
          console.error('Error fetching booth head details for export:', error)
        }

        if (!headEntries.length) {
          headEntries.push(createHeadEntry({
            name: booth.name,
            phone: booth.phoneNumber,
            role: booth.role
          }))
        }

        const seenEntries = new Set()
        const uniqueEntries = headEntries.reduce((acc, entry) => {
          const key = `${entry.name.toLowerCase()}|${entry.phone}|${entry.role.toLowerCase()}`
          if (!seenEntries.has(key)) {
            seenEntries.add(key)
            acc.push(entry)
          }
          return acc
        }, [])

        headDetailsMap[booth.boothNumber] = uniqueEntries

        if (uniqueEntries.length) {
          const combinedName = uniqueEntries.map(h => h.name).filter(Boolean).join(', ') || sanitizeHeadField(booth.name)
          const combinedPhone = uniqueEntries.map(h => h.phone).filter(Boolean).join(', ') || sanitizeHeadField(booth.phoneNumber)
          const combinedRole = uniqueEntries.map(h => h.role).filter(Boolean).join(', ') || sanitizeHeadField(booth.role, { allowFallback: true, fallback: 'बुथ प्रमुख' })

          setBoothData(prev => prev.map(item =>
            item.boothNumber === booth.boothNumber
              ? {
                  ...item,
                  name: combinedName || item.name,
                  phoneNumber: combinedPhone || item.phoneNumber,
                  role: combinedRole || item.role,
                  headDetails: uniqueEntries
                }
              : item
          ))
        }
      }

      // Transform data to Excel format with headers
      const excelData = filteredData.map((booth, index) => {
        const headEntries = (headDetailsMap[booth.boothNumber] || []).map(createHeadEntry)
        const headNames = headEntries.map(h => h.name).filter(Boolean)
        const headPhones = headEntries.map(h => h.phone).filter(Boolean)
        const headRoles = headEntries.map(h => h.role).filter(Boolean)

        return {
          'Sr. No.': index + 1,
          'Booth Number': booth.boothNumber || '',
          'Voters': booth.voters || 0,
          'Heads': booth.heads || 0,
          'Status': booth.assigned ? 'Assigned' : 'Unassigned',
          'Head Name': headNames.length ? headNames.join(', ') : sanitizeHeadField(booth.name),
          'Head Phone': headPhones.length ? headPhones.join(', ') : sanitizeHeadField(booth.phoneNumber),
          'Head Role': headRoles.length ? headRoles.join(', ') : sanitizeHeadField(booth.role, { allowFallback: true, fallback: 'बुथ प्रमुख' })
        }
      })

      // Create a new workbook
      const wb = XLSX.utils.book_new()
      
      // Create a worksheet from the data
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 12 },  // Booth Number
        { wch: 10 },  // Voters
        { wch: 10 },  // Heads
        { wch: 12 },  // Status
        { wch: 25 },  // Head Name
        { wch: 25 },  // Head Phone
        { wch: 18 }   // Head Role
      ]
      ws['!cols'] = colWidths
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Booths')
      
      // Generate Excel file and download
      const fileName = `Booth_Pramukh_List_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      console.log('Export successful:', fileName)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleSaveBoothHead = (boothHeadData) => {
    // Update the booth data to mark it as assigned
    setBoothData(prev => prev.map(booth => 
      booth.boothNumber === boothHeadData.boothNumber 
        ? { 
            ...booth, 
            assigned: true, 
            status: boothHeadData.last_login && boothHeadData.last_login.trim() !== '' ? 'active' : 'inactive',
            name: boothHeadData.name,
            phoneNumber: boothHeadData.phone,
            heads: 1,
            role: boothHeadData.role || booth.role || 'बुथ प्रमुख',
            headDetails: [createHeadEntry({
              name: boothHeadData.name,
              phone: boothHeadData.phone,
              role: boothHeadData.role
            })]
          }
        : booth
    ))
    console.log('Booth head saved:', boothHeadData)
  }


  const filteredBooths = boothData.filter(booth =>
    booth.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booth.boothNumber.toString().includes(searchQuery) ||
    (booth.phoneNumber || '').includes(searchQuery)
  )

  const totalBooths = boothData.length
  const totalHeads = boothData.filter(booth => booth.assigned).length
  const emptyBooths = boothData.filter(booth => !booth.assigned).length

  const renderProfileImage = (booth, size = 'w-12 h-12') => {
    // Check if we have a photo URL (either direct photo or photo_path)
    const photoUrl = booth.photoPath || booth.profileImage
    
    if (booth.isPhoto && photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={booth.name}
          className={`${size} rounded-full object-cover border-2 border-blue-200`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    } else {
      // Generate initials from booth number
      const initials = booth.boothNumber ? booth.boothNumber.toString().slice(-2) : 'B'
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-200`}>
          <span className="text-white text-sm font-bold">
            {initials}
          </span>
        </div>
      )
    }
  }

  // Small Card Grid View (same as PanelSelectionSlide)
  const renderGridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pb-6">
      {filteredBooths.map((booth, index) => (
        <div key={booth.id} className="flex justify-center">
          <div 
            className={`bg-white rounded-xl overflow-hidden shadow-lg w-full ${
              booth.assigned ? 'cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105' : ''
            }`}
            onClick={() => handleBoothClick(booth)}
          >
            {/* Top Section - Light Green Background for assigned, White for unassigned */}
            <div className={`${booth.assigned ? 'bg-green-50' : 'bg-white'} p-3 sm:p-4`}>
              <div className="flex items-center">
                {booth.isPhoto && booth.photoPath ? (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden mr-3">
                    <img 
                      src={booth.photoPath} 
                      alt="Profile" 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hidden">
                      <span className="text-white text-sm sm:text-base font-bold">
                        {booth.boothNumber ? booth.boothNumber.toString().slice(-2) : 'B'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                    <span className="text-white text-sm sm:text-base font-bold">
                      {booth.boothNumber ? booth.boothNumber.toString().slice(-2) : 'B'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-gray-800 font-semibold text-sm sm:text-base">बूथ नं. {booth.boothNumber}</h3>
                  <p className={`font-medium text-sm sm:text-base ${booth.assigned ? 'text-green-600' : 'text-gray-800'}`}>
                    मतदाता : {booth.voters}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section - Booth Head Information */}
            <div className="bg-white p-3 sm:p-4">
              {booth.assigned ? (
                <div className="w-full text-blue-600 font-medium text-center py-2 sm:py-3 text-sm sm:text-base">
                  {booth.heads} बूथ प्रमुख
                </div>
              ) : (
                <div className="w-full text-blue-600 font-medium text-center py-2 sm:py-3 text-sm sm:text-base">
                  जिम्मेदारी सोपी नहीं हैं
                </div>
              )}
            </div>

            {/* Bottom Section - Contact Icons or Assign Button */}
            <div className="bg-white p-3 sm:p-4">
              {booth.assigned ? (
                <div className="flex justify-center space-x-2 sm:space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCall(booth)
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
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
                      handleWhatsApp(booth)
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Profile functionality
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenCreateModal(booth.boothNumber)
                  }}
                  className="w-full bg-red-500 text-white font-medium py-2 sm:py-3 rounded text-sm sm:text-base hover:bg-red-600 transition-colors duration-200"
                >
                  प्रमुख बनाए
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // List View Render (compact version)
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3">
      {filteredBooths.map((booth, index) => (
        <div
          key={booth.id}
          className={`${booth.assigned ? 'bg-green-50' : 'bg-white'} rounded-xl p-3 sm:p-4 border transition-all shadow-sm ${
            booth.assigned ? 'cursor-pointer hover:shadow-md hover:scale-102' : ''
          }`}
          style={{borderColor: '#e6f0ff'}}
          onClick={() => handleBoothClick(booth)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Profile Image */}
              {booth.isPhoto && booth.photoPath ? (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={booth.photoPath} 
                    alt="Profile" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hidden">
                    <span className="text-white text-xs sm:text-sm font-bold">
                      {booth.boothNumber ? booth.boothNumber.toString().slice(-2) : 'B'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-bold">
                    {booth.boothNumber ? booth.boothNumber.toString().slice(-2) : 'B'}
                  </span>
                </div>
              )}
              
              {/* Booth Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                  <h3 className="text-gray-900 font-semibold text-sm sm:text-base">
                    बूथ नं. {booth.boothNumber}
                  </h3>
                </div>
                <div className="gap-2 sm:gap-4 text-xs sm:text-sm">
                  <p className="text-blue-600 font-medium">
                    मतदाता: {booth.voters}
                  </p>
                  <p className="text-gray-600">
                    {booth.assigned ? `${booth.heads} प्रमुख` : 'जिम्मेदारी सोपी नहीं हैं'}
                  </p>
                {/*   {booth.assigned && booth.name && (
                    <p className="text-gray-700 font-medium">
                      {booth.name}
                    </p>
                  )} */}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col items-end space-y-1 sm:space-y-2">
              {booth.assigned ? (
                <>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCall(booth)
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
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
                        handleWhatsApp(booth)
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Profile functionality
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenCreateModal(booth.boothNumber)
                  }}
                  className="px-3 sm:px-4 py-1 sm:py-2 bg-red-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  प्रमुख बनाए
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <BoothPramukhListModal
        isOpen={showBoothPramukhListModal}
        onClose={() => {
          setShowBoothPramukhListModal(false)
          setSelectedBoothForList(null)
        }}
        boothNumber={selectedBoothForList?.boothNumber}
        onShowCadre={handleShowBoothCadre}
      />

      <AddBoothHeadModal
        isOpen={showAddBoothHeadModal}
        onClose={() => setShowAddBoothHeadModal(false)}
        boothNumber={selectedBoothNumber}
        onSave={handleSaveBoothHead}
      />
      
      <div className={`relative w-screen h-screen overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-100"></div>
      
      {/* Main Container with Flex Layout */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
          {/* First Row: Arrow + Title (left) | Search icon (right) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleBack}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h1 className="text-white text-sm sm:text-lg font-semibold truncate">बूथ प्रमुख</h1>
            </div>
            
            <div className="search-box">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="reset"
                onClick={() => setSearchQuery('')}
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Total Count - Left side */}
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{color: '#102463'}}>
                टोटल : {filteredBooths.length}
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

        {/* Booth Grid - Same as PanelSelectionSlide */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          backgroundColor: '#e5e8ff'
        }}>
          <div className="min-h-full">
            <div className="w-full">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading booths...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-red-600 font-medium mb-2">Error loading booths</p>
                    <p className="text-gray-600 text-sm mb-4">{error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : boothData.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <p className="text-gray-600 font-medium">No booths found</p>
                    <p className="text-gray-500 text-sm">Try adjusting your search term</p>
                  </div>
                </div>
              ) : (
                viewMode === 'grid' ? renderGridView() : renderListView()
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex flex-row items-center justify-between flex-shrink-0 shadow-lg" style={{backgroundColor: '#102463'}}>
          <div className="px-1.5 sm:px-3 py-0.5 sm:py-2 rounded-lg" style={{backgroundColor: '#ffffff'}}>
            <div className="flex items-center space-x-2 sm:space-x-6" style={{color: '#102463'}}>
              <div className="text-center">
                <div className="text-xs sm:text-lg font-bold">{totalBooths}</div>
                <div className="text-[10px] sm:text-xs">बूथ</div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-lg font-bold">{totalHeads}</div>
                <div className="text-[10px] sm:text-xs">प्रमुख</div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-lg font-bold">{emptyBooths}</div>
                <div className="text-[10px] sm:text-xs leading-tight">खाली बूथ</div>
              </div>
            </div>
          </div>
          
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
    </>
  )
}

export default BoothPramukh
