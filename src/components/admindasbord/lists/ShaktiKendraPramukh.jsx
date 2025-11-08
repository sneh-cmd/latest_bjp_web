import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import ShaktiKendraDetailSlide from '../utils/ShaktiKendraDetailSlide.jsx'
import CreateShaktiKendraPramukhModal from '../modals/CreateShaktiKendraPramukhModal'
import ShaktiKendraPramukhDetailModal from '../modals/ShaktiKendraPramukhDetailModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import LastLoginModal from '../modals/LastLoginModal'
import * as XLSX from 'xlsx'

const ShaktiKendraPramukh = ({ navigation }) => {
  const { navigate } = navigation
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPramukh, setSelectedPramukh] = useState(null)
  const [pramukhData, setPramukhData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDetailSlide, setShowDetailSlide] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [boothData, setBoothData] = useState([])
  const [voterData, setVoterData] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPramukhForModal, setSelectedPramukhForModal] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [pramukhToEdit, setPramukhToEdit] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pramukhToDelete, setPramukhToDelete] = useState(null)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch Shakti Kendra Pramukh data from API
  useEffect(() => {
    const fetchPramukhData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching Shakti Kendra Pramukh data from:', panelApiUrl)
        
        // Call the real API
        const apiData = await apiService.displayShaktiKendraPramukh(panelApiUrl)
        
        // Transform API data to match component structure
        const transformedData = apiData.map((pramukh, index) => ({
          id: pramukh.adminId || index + 1,
          adminId: pramukh.adminId || index + 1,
          name: pramukh.name || 'Unknown',
          phoneNumber: pramukh.mobileNo || '',
          status: (pramukh.lastLogin && pramukh.lastLogin.trim() !== '') ? 'active' : 'inactive',
          profileImage: pramukh.photo || null,
          photoPath: pramukh.photoPath || null,
          isPhoto: Boolean(pramukh.photo && pramukh.photo.trim() !== ''),
          boothNumbers: pramukh.boothNo ? pramukh.boothNo.split(',').filter(booth => booth.trim() !== '') : [],
          responsibility: 'शक्ति केन्द्र प्रमुख',
          lastLogin: pramukh.lastLogin || null,
          type: pramukh.type || 'SP',
          photo: pramukh.photo || ''
        }))
        
        console.log('Transformed Shakti Kendra Pramukh data:', transformedData)
        setPramukhData(transformedData)
      } catch (err) {
        console.error('Error fetching Shakti Kendra Pramukh data:', err)
        setError(err.message || 'Failed to fetch Shakti Kendra Pramukh data')
      } finally {
        setLoading(false)
      }
    }

    fetchPramukhData()
  }, [])

  // Function to fetch booth and voter data for selected pramukh
  const fetchBoothAndVoterData = async (pramukhId) => {
    try {
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://tmc14.mhbjplok.com/webservice.asmx'
      
      console.log('Fetching booth data for pramukh:', pramukhId)
      
      // Call the booth pramukh by sakti pramukh API
      const apiData = await apiService.displayBoothPramukhBySaktiPramukh(pramukhId, panelApiUrl)
      
      // Transform API data to match component structure
      const transformedBoothData = apiData.map(booth => ({
        id: booth.id,
        number: booth.number,
        voters: booth.voters,
        assigned: booth.assigned,
        totalBoothPramukh: booth.totalBoothPramukh
      }))
      
      setBoothData(transformedBoothData)
      
      // Also set voter data based on booth data
      const transformedVoterData = apiData.map(booth => ({
        id: booth.id,
        boothNumber: booth.number,
        totalVoters: booth.voters
      }))
      
      setVoterData(transformedVoterData)
      
      console.log('Booth and voter data fetched successfully:', { boothData: transformedBoothData, voterData: transformedVoterData })
    } catch (err) {
      console.error('Error fetching booth and voter data:', err)
      // Set empty arrays on error
      setBoothData([])
      setVoterData([])
    }
  }

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (pramukh) => {
    window.open(`tel:${pramukh.phoneNumber}`, '_self')
  }

  const handlePramukhClick = (pramukh) => {
    setIsSearching(true)
    setSelectedPramukh(pramukh)
    
    // Fetch booth and voter data for the selected pramukh
    fetchBoothAndVoterData(pramukh.id)
    
    // Simulate searching through 500000+ records
    setTimeout(() => {
      setIsSearching(false)
      setShowDetailSlide(true)
    }, 2000) // 2 second delay as requested
  }

  useEffect(() => {
    const navState = location.state
    if (navState?.reopenShaktiKendraDetail && navState.selectedPramukh) {
      handlePramukhClick(navState.selectedPramukh)
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const toggleStatus = (pramukhId) => {
    // Toggle status logic here
    console.log('Toggle status for Shakti Kendra Pramukh:', pramukhId)
  }

  const handleEditPramukh = () => {
    setPramukhToEdit(selectedPramukhForModal)
    setShowEditModal(true)
    setShowDetailModal(false) // Close detail modal
    setSelectedPramukhForModal(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setPramukhToEdit(null)
  }

  const handleDeleteClick = () => {
    setPramukhToDelete(selectedPramukhForModal)
    setShowDeleteConfirm(true)
    setShowDetailModal(false) // Close detail modal
    setSelectedPramukhForModal(null)
  }

  const handleDeleteConfirm = async () => {
    if (!pramukhToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: pramukhToDelete.id || pramukhToDelete.adminId,
        type: 'D',
        sub_type: 'D',
        name: pramukhToDelete.name || '',
        mobile_no: pramukhToDelete.phoneNumber || '',
        photo: pramukhToDelete.photo || '',
        base64: '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh pramukh list from API after successful deletion
      await refreshList()
      
      setShowDeleteConfirm(false)
      setPramukhToDelete(null)
    } catch (err) {
      console.error('Failed to delete Shakti Kendra Pramukh:', err)
      alert(err.message || 'Failed to delete Shakti Kendra Pramukh')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setPramukhToDelete(null)
  }

  const handleCreate = () => setShowCreateModal(true)

  const handleExport = () => {
    try {
      // Filter pramukhs based on search query (same logic as filteredPramukhs)
      const filteredData = pramukhData.filter(pramukh =>
        pramukh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pramukh.phoneNumber.includes(searchQuery)
      )
      
      if (filteredData.length === 0) {
        alert('No data to export')
        return
      }

      // Transform data to Excel format with headers
      const excelData = filteredData.map((pramukh, index) => ({
        'Sr. No.': index + 1,
        'Name': pramukh.name || '',
        'Phone Number': pramukh.phoneNumber || '',
        'Booth Numbers': Array.isArray(pramukh.boothNumbers) ? pramukh.boothNumbers.join(', ') : '',
        'Status': pramukh.status === 'active' ? 'Active' : 'Inactive'
      }))

      // Create a new workbook
      const wb = XLSX.utils.book_new()
      
      // Create worksheet with custom title and headers
      const ws = XLSX.utils.aoa_to_sheet([])
      const title = 'Shakti Kendra Pramukh'
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
      ws['A1'] = { t: 's', v: title, s: { alignment: { horizontal: 'center', vertical: 'center' }, font: { bold: true, sz: 14 } } }
      ws['!merges'] = ws['!merges'] || []
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })

      // Header row
      const headers = [['Sr. No.', 'Name', 'Phone Number', 'Booth Numbers', 'Status']]
      XLSX.utils.sheet_add_aoa(ws, headers, { origin: 'A2' })

      // Data rows
      XLSX.utils.sheet_add_json(ws, excelData, { origin: 'A3', skipHeader: true })
       
      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 25 },  // Name
        { wch: 15 },  // Phone Number
        { wch: 25 },  // Booth Numbers
        { wch: 12 }   // Status
      ]
      ws['!cols'] = colWidths
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Shakti Kendra Pramukh')
      
      // Generate Excel file and download
      const fileName = `Shakti_Kendra_Pramukh_List_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      console.log('Export successful:', fileName)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  // Get all booths already assigned to other pramukhs (excluding the one being edited)
  const getAlreadyAssignedBooths = (excludePramukhId = null) => {
    const assignedBooths = new Set()
    pramukhData.forEach(pramukh => {
      // Skip the pramukh being edited
      if (excludePramukhId && (pramukh.id === excludePramukhId || pramukh.adminId === excludePramukhId)) {
        return
      }
      // Add all booth numbers from this pramukh
      if (pramukh.boothNumbers && Array.isArray(pramukh.boothNumbers)) {
        pramukh.boothNumbers.forEach(booth => {
          const boothNum = typeof booth === 'string' ? parseInt(booth.trim(), 10) : booth
          if (!isNaN(boothNum)) {
            assignedBooths.add(boothNum)
          }
        })
      }
    })
    return Array.from(assignedBooths)
  }

  const refreshList = async () => {
    try {
      setLoading(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      const apiData = await apiService.displayShaktiKendraPramukh(panelApiUrl)
      const transformedData = apiData.map((pramukh, index) => ({
        id: pramukh.adminId || index + 1,
        adminId: pramukh.adminId || index + 1,
        name: pramukh.name || 'Unknown',
        phoneNumber: pramukh.mobileNo || '',
        status: (pramukh.lastLogin && pramukh.lastLogin.trim() !== '') ? 'active' : 'inactive',
        profileImage: pramukh.photo || null,
        photoPath: pramukh.photoPath || null,
        isPhoto: Boolean(pramukh.photo && pramukh.photo.trim() !== ''),
        boothNumbers: pramukh.boothNo ? pramukh.boothNo.split(',').filter(booth => booth.trim() !== '') : [],
        responsibility: 'शक्ति केन्द्र प्रमुख',
        lastLogin: pramukh.lastLogin || null,
        type: pramukh.type || 'SP',
        photo: pramukh.photo || ''
      }))
      setPramukhData(transformedData)
    } finally {
      setLoading(false)
    }
  }

  const filteredPramukhs = pramukhData.filter(pramukh =>
    pramukh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pramukh.phoneNumber.includes(searchQuery)
  )

  const renderProfileImage = (pramukh, size = 'w-12 h-12') => {
    // Check if we have a photo URL (either direct photo or photo_path)
    const photoUrl = pramukh.photoPath || pramukh.profileImage
    
    if (pramukh.isPhoto && photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={pramukh.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    } else if (pramukh.profileImage && !pramukh.isPhoto) {
      return (
        <div className={`${size} rounded-full bg-amber-600 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-xs font-bold text-center leading-tight">
            {pramukh.profileImage}
          </span>
        </div>
      )
    } else {
      // Generate initials from name
      const initials = pramukh.name ? pramukh.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'SP'
      return (
        <div className={`${size} rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-xs font-bold text-center leading-tight">
            {initials}
          </span>
        </div>
      )
    }
  }

  // Loading Screen Component - matches the first image
  const renderLoadingScreen = () => (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
      {/* Main Loading Text */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">
          SEARCHING RECORDS IN{' '}
          <span className="text-orange-500">500000+</span> DATA, PLEASE WAIT....
        </h1>
      </div>

      {/* Animated Card Visualization */}
      <div className="relative mb-8">
        {/* Hand holding card */}
        <div className="relative">
          {/* Hand */}
          <div className="w-24 h-32 bg-blue-300 rounded-full relative transform rotate-12">
            {/* Hand details */}
            <div className="absolute top-4 left-2 w-16 h-20 bg-blue-200 rounded-full"></div>
            <div className="absolute top-6 left-4 w-12 h-16 bg-blue-100 rounded-full"></div>
          </div>
          
          {/* Card */}
          <div className="absolute -top-4 -right-8 w-32 h-20 bg-blue-600 rounded-lg border-2 border-blue-400 shadow-lg">
            {/* Profile section */}
            <div className="flex items-center p-2">
              {/* Avatar */}
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center mr-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Text lines */}
              <div className="flex-1">
                <div className="h-1 bg-gray-300 rounded mb-1"></div>
                <div className="h-1 bg-gray-300 rounded mb-1"></div>
                <div className="h-1 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Labels */}
        <div className="absolute -left-16 top-4">
          <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            Name
          </div>
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            ID #
          </div>
        </div>

        <div className="absolute -right-16 top-4">
          <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            John Doe
          </div>
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            123-456
          </div>
          <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            12/08/94
          </div>
          <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-medium">
            12 Street
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  )



  // List View Render - matches the image layout
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-4">
      {filteredPramukhs.map((pramukh, index) => (
        <div
          key={pramukh.id}
          onClick={() => handlePramukhClick(pramukh)}
          className="bg-gray-50 rounded-lg p-2 sm:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex-shrink-0">
              {renderProfileImage(pramukh, 'w-10 h-10 sm:w-16 sm:h-16')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h3 className="text-gray-900 font-semibold text-xs sm:text-lg truncate">
                  {pramukh.name}
                </h3>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCall(pramukh)
                    }}
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{backgroundColor: '#103a94'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPramukhForModal(pramukh)
                      setShowDetailModal(true)
                    }}
                    className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-blue-600 text-[10px] sm:text-sm mb-1 sm:mb-3 truncate">
                {pramukh.phoneNumber}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (pramukh.status === 'active' && pramukh.lastLogin) {
                    setSelectedUserForLastLogin({
                      name: pramukh.name,
                      lastLogin: pramukh.lastLogin
                    })
                    setShowLastLoginModal(true)
                  } else {
                    toggleStatus(pramukh.id)
                  }
                }}
                className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors ${
                  pramukh.status === 'active'
                    ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {pramukh.status === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
          
          {/* Booth Numbers Section */}
          <div className="mt-2 sm:mt-4 pt-1.5 sm:pt-3 border-t border-gray-200">
            <div className="flex items-center mb-1 sm:mb-2">
              <span className="text-gray-700 text-[10px] sm:text-sm font-medium">बूथ नं. :</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {pramukh.boothNumbers.map((booth, idx) => (
                <span
                  key={idx}
                  className="px-1.5 sm:px-3 py-0.5 sm:py-1 bg-gray-200 text-gray-800 rounded-full text-[10px] sm:text-sm font-medium"
                >
                  {`${booth}`}
                </span>
              ))}
            </div>
          </div>
          
        </div>
      ))}
    </div>
  )



  return (
    <>
      {/* Loading Screen */}
      {isSearching && renderLoadingScreen()}
      
      {/* Detail Slide */}
      <ShaktiKendraDetailSlide
        isVisible={showDetailSlide}
        onClose={() => setShowDetailSlide(false)}
        selectedPramukh={selectedPramukh}
        mainAdminId={selectedPramukh?.id}
        pramukhData={pramukhData}
        boothData={boothData}
        voterData={voterData}
      />
      
      {/* Detail Modal */}
      <ShaktiKendraPramukhDetailModal
        pramukh={selectedPramukhForModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedPramukhForModal(null)
        }}
        onCall={handleCall}
        onToggleStatus={toggleStatus}
        onEdit={handleEditPramukh}
        onDelete={handleDeleteClick}
      />
      
      {/* Edit Modal */}
      <CreateShaktiKendraPramukhModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSuccess={refreshList}
        editData={pramukhToEdit}
        mode="edit"
        alreadyAssignedBooths={getAlreadyAssignedBooths(pramukhToEdit?.id || pramukhToEdit?.adminId)}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        admin={pramukhToDelete}
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
      
      {/* Main Component */}
      <div className={`relative w-screen h-screen overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gray-50"></div>
      
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
              
              <div className="flex items-center">
                <h1 className="text-white text-sm sm:text-lg font-semibold truncate">शक्ति केन्द्र प्रमुख</h1>
              </div>
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
                टोटल : {filteredPramukhs.length}
              </span>
            </div>
            {/* Placeholder for future view toggle if needed */}
          </div>
        </div>

        {/* Shakti Kendra Pramukh List */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4" style={{ backgroundColor: '#e5e8ff' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 text-sm">Loading Shakti Kendra Pramukh data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
                </div>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : pramukhData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-gray-800 font-semibold mb-2">No Shakti Kendra Pramukh Found</h3>
                <p className="text-gray-600 text-sm">No Shakti Kendra Pramukh data available at the moment.</p>
              </div>
            </div>
          ) : (
            renderListView()
          )}
        </div>

        {/* Footer - matches the image design */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-row items-center justify-end flex-shrink-0 shadow-lg" style={{ backgroundColor: '#102463' }}>
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            {/* Export Button */}
            <button 
              onClick={handleExport}
              className="w-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md"
              style={{backgroundColor: 'rgba(220, 38, 38, 0.87)'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(185, 28, 28, 0.85)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.87)'}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 18H6.2v-1.4h9.6V20zm0-2.8H6.2v-1.4h9.6v1.4zm0-2.8H6.2v-1.4h9.6v1.4zM13 9V3.5L18.5 9H13z"/>
                <path d="M9 12h6v1.5H9V12zm0 2.5h6V16H9v-1.5zm0 2.5h6V18.5H9V17z"/>
              </svg>
              <span className="text-white text-xs sm:text-sm font-medium">Export</span>
            </button>

            {/* Create Shakti Kendra Pramukh Button */}
            <button 
              onClick={handleCreate}
              className="w-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md"
              style={{backgroundColor: '#ffffff'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#102463'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs sm:text-sm font-medium" style={{color: '#102463'}}>शक्ति केन्द्र प्रमुख बनाए</span>
            </button>
          </div>
        </div>

      </div>
    </div>
    <CreateShaktiKendraPramukhModal
      isOpen={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      onSuccess={refreshList}
      alreadyAssignedBooths={getAlreadyAssignedBooths()}
    />
    </>
  )
}

export default ShaktiKendraPramukh
