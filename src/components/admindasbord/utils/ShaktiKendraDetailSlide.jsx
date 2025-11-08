import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import CreateOrganizationMemberModal from '../modals/CreateOrganizationMemberModal'
import ShaktiKendraPramukhDetailModal from '../modals/ShaktiKendraPramukhDetailModal'
import CreateShaktiKendraPramukhModal from '../modals/CreateShaktiKendraPramukhModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import AddBoothHeadModal from '../modals/AddBoothHeadModal'
import BoothPramukhListModal from '../modals/BoothPramukhListModal'

const ShaktiKendraDetailSlide = ({ 
  isVisible, 
  onClose, 
  selectedPramukh,
  mainAdminId,
  panelApiUrl = null,
  pramukhData = []
}) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('organization') // 'organization', 'booth', 'voter'
  const [cadreData, setCadreData] = useState([])
  const [mainPramukhData, setMainPramukhData] = useState(null)
  const [coPramukhData, setCoPramukhData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'list', 'grid' - default is grid
  const [searchQuery, setSearchQuery] = useState('')

  // API call function to fetch Shakti Kendra Pramukh data
  const fetchShaktiKendraData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Use apiService method which handles endpoint and authentication correctly
      const userData = localStorageManager.getUserData()
      const apiUrl = panelApiUrl || userData?.panel?.apiUrl || null
      
      const apiData = await apiService.displaySaktiPramukhCadre(mainAdminId, apiUrl)
      
      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        // Transform API data to match component structure
        const transformedData = apiData.map(item => ({
          adminId: (item.adminId || item.admin_id || item.id || '').toString(),
          name: item.name || '',
          mobileNo: item.mobileNo || item.mobile_no || '',
          designation: item.designation || '',
          designation_sort: item.designation_sort || item.designationSort || '',
          photoPath: item.photoPath || item.photo_path || null,
          lastLogin: item.lastLogin || item.last_login || '',
          type: item.type || '',
          subType: item.subType || item.sub_type || '',
          idcardNo: item.idcardNo || item.idcard_no || '',
          idcard_no: item.idcardNo || item.idcard_no || ''
        }))
        
        setCadreData(transformedData)
        
        // Separate main pramukh and co-pramukh based on sub_type
        // Main Pramukh: type="SP", sub_type="SP" (or main_admin_id matches)
        // Co-Pramukh: type="SP", sub_type="SS"
        const mainPramukh = transformedData.find(item => {
          const subType = (item.subType || '').toUpperCase()
          const type = (item.type || '').toUpperCase()
          // Main pramukh is SP/SP or matches selectedPramukh
          return (type === 'SP' && subType === 'SP') || 
                 (selectedPramukh && (item.adminId === selectedPramukh.id?.toString() || item.adminId === selectedPramukh.adminId?.toString()))
        }) || null
        
        const coPramukhs = transformedData.filter(item => {
          const subType = (item.subType || '').toUpperCase()
          const type = (item.type || '').toUpperCase()
          // Co-pramukh is SP/SS
          return type === 'SP' && subType === 'SS'
        })
        
        setMainPramukhData(mainPramukh)
        setCoPramukhData(coPramukhs)
      } else {
        // Empty response - set empty arrays
        setCadreData([])
        setMainPramukhData(null)
        setCoPramukhData([])
      }
    } catch (err) {
      console.error('Error fetching Shakti Kendra data:', err)
      setError(err.message || 'Failed to fetch Shakti Kendra data')
      // Clear data on error
      setCadreData([])
      setMainPramukhData(null)
      setCoPramukhData([])
    } finally {
      setLoading(false)
    }
  }

  // API call function to fetch Booth Pramukh data
  const fetchBoothData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const apiData = await apiService.displayBoothPramukhBySaktiPramukh(mainAdminId, panelApiUrl)
      
      // Handle empty array response (no booths assigned)
      if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
        setBoothData([])
        setVoterData([])
        return
      }
      
      // Transform API data to match component structure
      const transformedData = apiData.map(booth => ({
        id: booth.id,
        number: booth.number,
        voters: booth.voters,
        assigned: booth.assigned,
        totalBoothPramukh: booth.totalBoothPramukh,
        photoPath: booth.photoPath || null
      }))
      
      setBoothData(transformedData)
      
      // Also set voter data based on booth data
      const voterTransformedData = apiData.map(booth => ({
        id: booth.id,
        boothNumber: booth.number,
        totalVoters: booth.voters
      }))
      
      setVoterData(voterTransformedData)
    } catch (err) {
      console.error('Error fetching booth data:', err)
      // If error is about no data, set empty arrays instead of showing error
      if (err.message && err.message.includes('Success":"0"')) {
        setBoothData([])
        setVoterData([])
        setError(null) // Don't show error for no data
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when component mounts or when isVisible changes
  useEffect(() => {
    if (isVisible && activeTab === 'organization') {
      fetchShaktiKendraData()
    } else if (isVisible && activeTab === 'booth') {
      fetchBoothData()
    } else if (isVisible && activeTab === 'voter') {
      fetchBoothData() // Same API provides voter data
    }
  }, [isVisible, activeTab, mainAdminId])

  // Set grid view as default when booth tab is active
  useEffect(() => {
    if (activeTab === 'booth') {
      setViewMode('grid')
    }
  }, [activeTab])
  
  const [boothData, setBoothData] = useState([])
  
  const [voterData, setVoterData] = useState([])
  const [showCreateMember, setShowCreateMember] = useState(false)
  const [showEditMemberModal, setShowEditMemberModal] = useState(false)
  const [memberToEdit, setMemberToEdit] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPramukhForModal, setSelectedPramukhForModal] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [pramukhToEdit, setPramukhToEdit] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pramukhToDelete, setPramukhToDelete] = useState(null)
  const [showAddBoothHeadModal, setShowAddBoothHeadModal] = useState(false)
  const [selectedBoothForHead, setSelectedBoothForHead] = useState(null)
  const [showBoothPramukhListModal, setShowBoothPramukhListModal] = useState(false)
  const [selectedBoothForList, setSelectedBoothForList] = useState(null)

  const handleCall = (pramukh) => {
    window.open(`tel:${pramukh.mobileNo || pramukh.phoneNumber}`, '_self')
  }

  // Transform cadre data to modal format
  const transformCadreToModalFormat = (cadre) => {
    // Check if this cadre is the main selected pramukh
    const isMainPramukh = selectedPramukh && (
      cadre.adminId === selectedPramukh.id || 
      cadre.adminId === selectedPramukh.adminId ||
      cadre.adminId?.toString() === selectedPramukh.id?.toString() ||
      cadre.adminId?.toString() === selectedPramukh.adminId?.toString()
    )
    
    return {
      id: cadre.adminId,
      adminId: cadre.adminId,
      name: cadre.name,
      phoneNumber: cadre.mobileNo,
      mobileNo: cadre.mobileNo,
      status: (cadre.lastLogin && cadre.lastLogin.trim() !== '') ? 'active' : 'inactive',
      photoPath: cadre.photoPath,
      photo: cadre.photoPath || '',
      responsibility: cadre.designation || 'शक्ति केन्द्र प्रमुख',
      designation: cadre.designation,
      designation_sort: cadre.designation_sort || cadre.designationSort || '',
      isPhoto: !!cadre.photoPath,
      profileImage: null,
      boothNumbers: isMainPramukh && selectedPramukh.boothNumbers ? selectedPramukh.boothNumbers : [],
      type: cadre.type || 'SP',
      subType: cadre.subType || '',
      sub_type: cadre.subType || '',
      lastLogin: cadre.lastLogin || null,
      idcardNo: cadre.idcardNo || cadre.idcard_no || '',
      idcard_no: cadre.idcardNo || cadre.idcard_no || ''
    }
  }

  // Refresh cadre data after edit/delete
  const refreshCadreData = async () => {
    await fetchShaktiKendraData()
  }

  const handleToggleStatus = (pramukhId) => {
    // Toggle status logic - can be implemented based on API requirements
    console.log('Toggle status for Shakti Kendra Pramukh:', pramukhId)
  }

  const handleEditPramukh = () => {
    // Transform the selected pramukh for edit modal
    const phoneNumber = selectedPramukhForModal?.phoneNumber || selectedPramukhForModal?.mobileNo || ''
    
    // Check if this is a Co-Shakti Kendra Pramukh (organization member)
    // Co-Pramukh has subType === 'SS'
    const isCoPramukh = selectedPramukhForModal?.subType === 'SS' || 
                       (selectedPramukhForModal?.subType || '').toUpperCase() === 'SS'
    
    // Check if this is the main selected pramukh
    const isMainPramukh = selectedPramukh && selectedPramukhForModal && (
      selectedPramukhForModal.id === selectedPramukh.id || 
      selectedPramukhForModal.id === selectedPramukh.adminId ||
      selectedPramukhForModal.adminId === selectedPramukh.id ||
      selectedPramukhForModal.adminId === selectedPramukh.adminId ||
      selectedPramukhForModal.id?.toString() === selectedPramukh.id?.toString() ||
      selectedPramukhForModal.adminId?.toString() === selectedPramukh.adminId?.toString()
    )
    
    // If it's a Co-Pramukh (organization member), open CreateOrganizationMemberModal
    if (isCoPramukh) {
      const editData = selectedPramukhForModal ? {
        id: selectedPramukhForModal.id || selectedPramukhForModal.adminId,
        adminId: selectedPramukhForModal.id || selectedPramukhForModal.adminId,
        admin_id: selectedPramukhForModal.id || selectedPramukhForModal.adminId,
        name: selectedPramukhForModal.name,
        phoneNumber: phoneNumber,
        mobile: phoneNumber,
        mobileNo: phoneNumber,
        photo: selectedPramukhForModal.photo || selectedPramukhForModal.photoPath || '',
        photoPath: selectedPramukhForModal.photoPath,
        profileImage: selectedPramukhForModal.photoPath || selectedPramukhForModal.photo,
        designation: selectedPramukhForModal.designation || selectedPramukhForModal.responsibility,
        designation_sort: selectedPramukhForModal.designation_sort || '',
        role: selectedPramukhForModal.designation_sort || '',
        roleId: selectedPramukhForModal.designation_sort || '',
        type: selectedPramukhForModal.type || 'SP',
        subType: selectedPramukhForModal.subType || 'SS',
        sub_type: selectedPramukhForModal.subType || 'SS',
        idcardNo: selectedPramukhForModal.idcardNo || '',
        idcard_no: selectedPramukhForModal.idcardNo || ''
      } : null
      
      setMemberToEdit(editData)
      setShowEditMemberModal(true)
      setShowDetailModal(false)
      setSelectedPramukhForModal(null)
      return
    }
    
    // Otherwise, it's the main pramukh - open CreateShaktiKendraPramukhModal
    // Get booth numbers - prefer from selectedPramukh if it's the main pramukh, otherwise from modal data
    const boothNumbers = isMainPramukh && selectedPramukh?.boothNumbers 
      ? selectedPramukh.boothNumbers 
      : (selectedPramukhForModal?.boothNumbers || [])
    
    const editData = selectedPramukhForModal ? {
      id: selectedPramukhForModal.id || selectedPramukhForModal.adminId,
      adminId: selectedPramukhForModal.id || selectedPramukhForModal.adminId,
      name: selectedPramukhForModal.name,
      phoneNumber: phoneNumber, // Modal expects phoneNumber
      mobile: phoneNumber, // Also include mobile as fallback
      mobileNo: phoneNumber,
      photo: selectedPramukhForModal.photo || selectedPramukhForModal.photoPath || '',
      photoPath: selectedPramukhForModal.photoPath,
      designation: selectedPramukhForModal.designation || selectedPramukhForModal.responsibility,
      type: selectedPramukhForModal.type || 'SP',
      subType: selectedPramukhForModal.subType || '',
      boothNumbers: boothNumbers
    } : null
    
    setPramukhToEdit(editData)
    setShowEditModal(true)
    setShowDetailModal(false)
    setSelectedPramukhForModal(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setPramukhToEdit(null)
  }

  const handleDeletePramukh = () => {
    setPramukhToDelete(selectedPramukhForModal)
    setShowDeleteConfirm(true)
    setShowDetailModal(false)
    setSelectedPramukhForModal(null)
  }

  const handleDeleteConfirm = async () => {
    if (!pramukhToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage or use prop
      const userData = localStorageManager.getUserData()
      const apiUrl = panelApiUrl || userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: pramukhToDelete.id || pramukhToDelete.adminId,
        type: 'D',
        sub_type: 'D',
        name: pramukhToDelete.name || '',
        mobile_no: pramukhToDelete.phoneNumber || pramukhToDelete.mobileNo || '',
        photo: pramukhToDelete.photo || '',
        base64: '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, apiUrl)
      
      // Refresh cadre data after successful deletion
      await refreshCadreData()
      
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

  const handleBoothCall = (booth) => {
    // Phone functionality - could be implemented if phone number is available
    console.log('Call booth:', booth)
  }

  const handleBoothWhatsApp = async (booth) => {
    // If there are more than 1 booth heads, show the list modal
    if (booth.totalBoothPramukh > 1) {
      setSelectedBoothForList(booth)
      setShowBoothPramukhListModal(true)
      return
    }

    // If only 1 booth head or no booth heads, fetch phone number from booth pramukh cadre
    let phoneNumber = booth.phoneNumber || booth.mobileNo || booth.mobile || booth.mobile_no || booth.phone
    
    // If not found and booth is assigned, fetch booth pramukh cadre to get phone number
    if (booth.assigned && !phoneNumber) {
      try {
        const userData = localStorageManager.getUserData()
        const apiUrl = panelApiUrl || userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        const boothNumber = booth.number || booth.id
        
        // Fetch booth pramukh cadre for this booth
        const boothCadre = await apiService.displayBoothPramukhCadre(boothNumber, apiUrl)
        
        if (boothCadre && Array.isArray(boothCadre) && boothCadre.length > 0) {
          // Get phone number from first booth head
          const firstHead = boothCadre[0]
          phoneNumber = firstHead.mobile_no || firstHead.mobileNo || firstHead.phoneNumber || firstHead.phone || firstHead.mobile || ''
        }
      } catch (err) {
        console.error('Error fetching booth cadre:', err)
      }
    }

    // If only 1 booth head, open WhatsApp directly
    if (!phoneNumber) {
      alert('Phone number not available')
      return
    }

    // Remove all non-digit characters (spaces, dashes, +, etc.)
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    
    // Remove leading zeros
    formattedPhone = formattedPhone.replace(/^0+/, '')
    
    // If number already starts with country code 91, use it as is
    if (formattedPhone.startsWith('91')) {
      // Remove the 91 prefix temporarily to check the actual number length
      const actualNumber = formattedPhone.substring(2)
      if (actualNumber.length === 10) {
        // Valid format: 91XXXXXXXXXX
        window.open(`https://wa.me/${formattedPhone}`, '_blank')
        return
      }
    }
    
    // If number is exactly 10 digits, add country code 91
    if (formattedPhone.length === 10) {
      const formattedNumber = '91' + formattedPhone
      window.open(`https://wa.me/${formattedNumber}`, '_blank')
      return
    }
    
    // If number is 12 digits and starts with 91, use as is
    if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
      window.open(`https://wa.me/${formattedPhone}`, '_blank')
      return
    }
    
    // Invalid format
    alert('Invalid phone number format. Please ensure it is a valid 10-digit Indian number.')
  }

  const handleBoothClick = (booth) => {
    // Original function - only works for assigned booths (for booth section)
    if (booth.assigned) {
      // Prepare booth data in the format expected by BoothDetailSlide
      const boothNumber = booth.number || booth.id
      const boothDataForNavigation = {
        id: booth.id,
        boothNumber: boothNumber,
        voters: booth.voters || 0,
        heads: booth.totalBoothPramukh || 0,
        assigned: booth.assigned,
        profileImage: booth.photoPath || null,
        photoPath: booth.photoPath || null,
        isPhoto: Boolean(booth.photoPath && booth.photoPath.trim() !== ''),
        name: booth.assigned ? `Booth Head ${boothNumber}` : 'Unassigned',
        phoneNumber: '',
        status: booth.assigned ? 'active' : 'inactive'
      }
      
      // Navigate to booth detail page with return path
      navigate(`/booth-detail?boothId=${boothNumber}`, {
        state: {
          boothData: boothDataForNavigation,
          returnPath: '/shakti-kendra-pramukh',
          from: 'shakti-kendra-detail',
          originState: {
            reopenShaktiKendraDetail: true,
            selectedPramukh
          }
        }
      })
    }
  }

  // Separate function for voter section - works for both assigned and unassigned booths
  const handleVoterBoothClick = (booth) => {
    // Prepare booth data in the format expected by BoothDetailSlide
    // This function works for both assigned and unassigned booths
    const boothNumber = booth.number || booth.id
    const boothDataForNavigation = {
      id: booth.id,
      boothNumber: boothNumber,
      voters: booth.voters || 0,
      heads: booth.totalBoothPramukh || 0,
      assigned: booth.assigned || false,
      profileImage: booth.photoPath || null,
      photoPath: booth.photoPath || null,
      isPhoto: Boolean(booth.photoPath && booth.photoPath.trim() !== ''),
      name: booth.assigned ? `Booth Head ${boothNumber}` : 'Unassigned',
      phoneNumber: '',
      status: booth.assigned ? 'active' : 'inactive'
    }
    
    // Navigate to booth detail page with return path
    navigate(`/booth-detail?boothId=${boothNumber}`, {
      state: {
        boothData: boothDataForNavigation,
        returnPath: '/shakti-kendra-pramukh',
        from: 'shakti-kendra-detail',
        originState: {
          reopenShaktiKendraDetail: true,
          selectedPramukh
        }
      }
    })
  }

  // Handle opening Add Booth Head Modal
  const handleOpenAddBoothHeadModal = (booth) => {
    const boothNumber = booth.number || booth.id
    setSelectedBoothForHead(boothNumber)
    setShowAddBoothHeadModal(true)
  }

  // Handle closing Add Booth Head Modal
  const handleCloseAddBoothHeadModal = () => {
    setShowAddBoothHeadModal(false)
    setSelectedBoothForHead(null)
  }

  // Handle successful booth head creation/update
  const handleBoothHeadSave = async () => {
    // Refresh booth data after successful save
    await fetchBoothData()
    handleCloseAddBoothHeadModal()
  }

  // Filter booths based on search query
  const filteredBooths = boothData.filter(booth => {
    const boothNumber = booth.number || booth.id
    return boothNumber.toString().includes(searchQuery) ||
           (booth.voters || 0).toString().includes(searchQuery)
  })

  // Filter organization data (main pramukh and co-pramukh) based on search query
  const shouldShowMainPramukh = mainPramukhData && (
    !searchQuery.trim() ||
    mainPramukhData.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mainPramukhData.mobileNo?.includes(searchQuery) ||
    mainPramukhData.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCoPramukhs = coPramukhData.filter(coPramukh => {
    if (!searchQuery.trim()) return true
    return (
      coPramukh.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coPramukh.mobileNo?.includes(searchQuery) ||
      coPramukh.designation?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Filter voter data based on search query
  const filteredVoterData = voterData.filter(voter => {
    if (!searchQuery.trim()) return true
    return (
      voter.boothNumber?.toString().includes(searchQuery) ||
      voter.totalVoters?.toString().includes(searchQuery)
    )
  })

  // Grid View Render
  const renderGridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pb-6">
      {filteredBooths.map((booth) => {
        const boothNumber = booth.number || booth.id
        const isPhoto = Boolean(booth.photoPath && booth.photoPath.trim() !== '')
        
        return (
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
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 ${booth.assigned ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mr-3`}>
                    {isPhoto && booth.photoPath ? (
                      <img 
                        src={booth.photoPath} 
                        alt="Profile" 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${isPhoto && booth.photoPath ? 'hidden' : 'flex'}`}>
                      <span className="text-sm sm:text-base font-bold text-gray-600">
                        {boothNumber ? boothNumber.toString().slice(-2) : 'B'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-800 font-semibold text-sm sm:text-base">बूथ नं. {boothNumber}</h3>
                    <p className={`font-medium text-sm sm:text-base ${booth.assigned ? 'text-green-600' : 'text-gray-800'}`}>
                      मतदाता : {booth.voters || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Section - Booth Head Information */}
              <div className="bg-white p-3 sm:p-4">
                {booth.assigned ? (
                  <div className="w-full text-blue-600 font-medium text-center py-2 sm:py-3 text-sm sm:text-base">
                    {booth.totalBoothPramukh || 0} बूथ प्रमुख
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
                        handleBoothCall(booth)
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
                        handleBoothWhatsApp(booth)
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </button>
                   {/*  <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Profile functionality
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </button> */}
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenAddBoothHeadModal(booth)
                    }}
                    className="w-full bg-red-500 text-white font-medium py-2 sm:py-3 rounded text-sm sm:text-base hover:bg-red-600 transition-colors duration-200"
                  >
                    प्रमुख बनाए
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // List View Render (compact version)
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3">
      {filteredBooths.map((booth) => {
        const boothNumber = booth.number || booth.id
        const isPhoto = Boolean(booth.photoPath && booth.photoPath.trim() !== '')
        
        return (
          <div
            key={booth.id}
            className={`bg-white rounded-xl p-3 sm:p-4 border transition-all shadow-sm ${
              booth.assigned ? 'cursor-pointer hover:shadow-md hover:scale-102' : ''
            }`}
            style={{borderColor: '#e6f0ff'}}
            onClick={() => handleBoothClick(booth)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Profile Image */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden"
                     style={{backgroundColor: booth.assigned ? '#e6f7ff' : '#f5f5f5'}}>
                  {isPhoto && booth.photoPath ? (
                    <img 
                      src={booth.photoPath} 
                      alt="Profile" 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${isPhoto && booth.photoPath ? 'hidden' : 'flex'}`}>
                    <span className="text-xs sm:text-sm font-bold text-gray-600">
                      {boothNumber ? boothNumber.toString().slice(-2) : 'B'}
                    </span>
                  </div>
                </div>
                
                {/* Booth Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                    <h3 className="text-gray-900 font-semibold text-sm sm:text-base">
                      बूथ नं. {boothNumber}
                    </h3>
                    {booth.assigned && (
                      <span className="px-2 py-1 bg-green-100 text-black text-xs rounded-full font-medium">
                        Assigned
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <p className="text-blue-600 font-medium">
                      मतदाता: {booth.voters || 0}
                    </p>
                    <p className="text-gray-600">
                      {booth.assigned ? `${booth.totalBoothPramukh || 0} प्रमुख` : 'जिम्मेदारी सोपी नहीं हैं'}
                    </p>
                    {booth.assigned && (
                      <p className="text-gray-700 font-medium">
                        Booth Head {boothNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {booth.assigned ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBoothCall(booth)
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
                    <span className="px-2 sm:px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                      Active
                    </span>
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenAddBoothHeadModal(booth)
                    }}
                    className="px-3 sm:px-4 py-1 sm:py-2 bg-red-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                  >
                    प्रमुख बनाए
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Booth View Component - matches the booth image
  const renderBoothView = () => {
      return (
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4" style={{ backgroundColor: '#e5e8ff' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-sm">Loading booth data...</p>
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
              onClick={fetchBoothData}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        ) : boothData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-gray-800 font-semibold mb-2">No Booths Found</h3>
              <p className="text-gray-600 text-sm">कोई बूथ डेटा नहीं मिला</p>
                </div>
              </div>
            ) : filteredBooths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-gray-800 font-semibold mb-2">No Booths Found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your search term</p>
                </div>
              </div>
            ) : (
          <>
            {viewMode === 'list' && renderListView()}
            {viewMode === 'grid' && renderGridView()}
          </>
            )}
      </div>
    )
  }

  // Voter View Component - matches the voter image
  const renderVoterView = () => {
    if (loading) {
      return (
        <div className="flex-1 px-4 py-4 flex items-center justify-center" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
            <p className="text-gray-600">डेटा लोड हो रहा है...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex-1 px-4 py-4 flex items-center justify-center" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">त्रुटि: {error}</p>
            <button 
              onClick={fetchBoothData}
              className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        </div>
      )
    }

    return (
    <div className="flex-1 px-4 py-4 space-y-4" style={{ backgroundColor: '#e5e8ff' }}>
      {voterData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">कोई मतदाता डेटा नहीं मिला</p>
        </div>
      ) : filteredVoterData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-gray-800 font-semibold mb-2">No Results Found</h3>
            <p className="text-gray-600 text-sm">Try adjusting your search term</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredVoterData.map((voter) => {
            // Find corresponding booth data from boothData array
            const boothInfo = boothData.find(booth => 
              (booth.number || booth.id) === voter.boothNumber || 
              booth.id === voter.id
            )
            
            // Create booth object for handleBoothClick
            const boothForClick = {
              id: boothInfo?.id || voter.id,
              number: voter.boothNumber,
              voters: voter.totalVoters,
              assigned: boothInfo?.assigned || false,
              totalBoothPramukh: boothInfo?.totalBoothPramukh || 0,
              photoPath: boothInfo?.photoPath || null
            }
            
            return (
              <div 
                key={voter.id} 
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200"
                onClick={() => handleVoterBoothClick(boothForClick)}
              >
                <div className="text-center">
                  <h3 className="font-bold text-gray-800 text-lg mb-2">बूथ नं. {voter.boothNumber}</h3>
                  <p className="text-gray-600 text-sm">टोटल मतदाता {voter.totalVoters}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    )
  }

  // Organization View Component - matches the organization image
  const renderOrganizationView = () => {
    if (loading) {
      return (
        <div className="flex-1 px-4 py-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
            <p className="text-gray-600">डेटा लोड हो रहा है...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex-1 px-4 py-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">त्रुटि: {error}</p>
            <button 
              onClick={fetchShaktiKendraData}
              className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 px-4 py-4 space-y-4" style={{ backgroundColor: '#e5e8ff' }}>
        {/* Main Shakti Kendra Pramukh Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="text-white px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between" style={{ backgroundColor: '#102463' }}>
            <h2 className="font-semibold text-sm sm:text-lg">शक्ति केन्द्र प्रमुख</h2>
            <div className="w-8"></div>
          </div>
          {shouldShowMainPramukh && mainPramukhData ? (
            <div className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {mainPramukhData.photoPath ? (
                      <img 
                        src={mainPramukhData.photoPath} 
                        alt={mainPramukhData.name}
                        className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-base truncate">{mainPramukhData.name}</h3>
                    <p className="text-blue-600 text-[10px] sm:text-sm truncate">{mainPramukhData.mobileNo}</p>
                    <p className="text-gray-600 text-[10px] sm:text-sm truncate">{mainPramukhData.designation || 'शक्ति केन्द्र प्रमुख'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => handleCall(mainPramukhData)}
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
                      onClick={() => {
                        const modalData = transformCadreToModalFormat(mainPramukhData)
                        setSelectedPramukhForModal(modalData)
                        setShowDetailModal(true)
                      }}
                      className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                  <button className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-medium ${
                    (mainPramukhData.lastLogin && mainPramukhData.lastLogin.trim() !== '') 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {(mainPramukhData.lastLogin && mainPramukhData.lastLogin.trim() !== '') ? 'Active' : 'inactive'}
                  </button>
                </div>
              </div>
            </div>
          ) : !mainPramukhData ? (
            <div className="p-2 sm:p-4 text-center text-gray-500">
              <p className="text-xs sm:text-sm">कोई शक्ति केन्द्र प्रमुख नहीं मिला</p>
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-2 sm:p-4 text-center text-gray-500">
              <p className="text-xs sm:text-sm">कोई परिणाम नहीं मिला</p>
            </div>
          ) : null}
        </div>

        {/* Co-Shakti Kendra Pramukh Section */}
        <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-red-500">
            <h2 className="font-semibold text-gray-700 text-sm sm:text-lg">सह शक्ति केन्द्र प्रमुख</h2>
            <button 
              onClick={() => setShowCreateMember(true)} 
              className="bg-blue-800 text-white px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              जोड़ें
            </button>
          </div>
          {filteredCoPramukhs.length === 0 ? (
            <div className="p-2 sm:p-4 text-center text-gray-500">
              <p className="text-xs sm:text-sm">{searchQuery.trim() ? 'कोई परिणाम नहीं मिला' : 'कोई सह शक्ति केन्द्र प्रमुख नहीं मिला'}</p>
            </div>
          ) : (
            <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
              {filteredCoPramukhs.map((coPramukh, index) => (
                <div key={coPramukh.adminId || index} className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {coPramukh.photoPath ? (
                        <img 
                          src={coPramukh.photoPath} 
                          alt={coPramukh.name}
                          className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800 text-xs sm:text-base truncate">{coPramukh.name}</h3>
                      <p className="text-blue-600 text-[10px] sm:text-sm truncate">{coPramukh.mobileNo}</p>
                      <p className="text-gray-600 text-[10px] sm:text-sm truncate">{coPramukh.designation || 'सह शक्ति केन्द्र प्रमुख'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleCall(coPramukh)}
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
                        onClick={() => {
                          const modalData = transformCadreToModalFormat(coPramukh)
                          setSelectedPramukhForModal(modalData)
                          setShowDetailModal(true)
                        }}
                        className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                    <button className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-medium ${
                      (coPramukh.lastLogin && coPramukh.lastLogin.trim() !== '') 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {(coPramukh.lastLogin && coPramukh.lastLogin.trim() !== '') ? 'Active' : 'inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-100"></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">
      {/* Header */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
        {/* First Row: Arrow + Title (left) | Search icon (right) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
            <h1 className="text-white text-base sm:text-lg font-semibold">शक्ति केन्द्र प्रमुख</h1>
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

      {/* Navigation Tabs and Search Bar Section */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
        {/* Desktop: Row layout (unchanged) | Mobile: Column layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Mobile: Navigation Tabs First | Desktop: Left side - Total Count */}
          <div className="flex-1 sm:flex-1 w-full sm:w-auto">
            {/* Mobile: Show navigation tabs */}
            <div className="flex justify-center sm:hidden mb-2">
              <div className="flex space-x-2 bg-white rounded-lg p-1">
                <button 
                  onClick={() => setActiveTab('organization')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === 'organization' 
                      ? 'text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={activeTab === 'organization' ? {backgroundColor: '#102463'} : {}}
                >
                  संगठन
              </button>
              <button
                  onClick={() => setActiveTab('booth')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === 'booth' 
                      ? 'text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={activeTab === 'booth' ? {backgroundColor: '#102463'} : {}}
                >
                  बूथ
              </button>
                <button 
                  onClick={() => setActiveTab('voter')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === 'voter' 
                      ? 'text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={activeTab === 'voter' ? {backgroundColor: '#102463'} : {}}
                >
                  मतदाता
            </button>
              </div>
        </div>

            {/* Desktop: Total Count (only for booth tab) */}
        {activeTab === 'booth' && (
              <div className="hidden sm:block">
                <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg inline-block">
                  <span className="text-sm sm:text-base font-bold" style={{color: '#102463'}}>
                    टोटल : {filteredBooths.length}
                  </span>
            </div>
          </div>
        )}
      </div>

          {/* Desktop: Center - Navigation Tabs */}
          <div className="hidden sm:flex space-x-2 sm:space-x-4 bg-white rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('organization')}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${
              activeTab === 'organization' 
                  ? 'text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
              style={activeTab === 'organization' ? {backgroundColor: '#102463'} : {}}
          >
            संगठन
          </button>
          <button 
            onClick={() => setActiveTab('booth')}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${
              activeTab === 'booth' 
                  ? 'text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
              style={activeTab === 'booth' ? {backgroundColor: '#102463'} : {}}
          >
            बूथ
          </button>
          <button 
            onClick={() => setActiveTab('voter')}
              className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${
              activeTab === 'voter' 
                  ? 'text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
              style={activeTab === 'voter' ? {backgroundColor: '#102463'} : {}}
          >
            मतदाता
          </button>
          </div>

          {/* Desktop: Right side - View Mode Toggle | Mobile: Below navigation tabs */}
          <div className="flex-1 sm:flex-1 flex justify-end w-full sm:w-auto">
            {activeTab === 'booth' && (
              <>
                {/* Mobile: Total Count + View Toggle Row */}
                <div className="flex sm:hidden items-center justify-between gap-2 w-full">
                  <div className="px-2 py-1 rounded-lg inline-block">
                    <span className="text-sm font-bold" style={{color: '#102463'}}>
                      टोटल : {filteredBooths.length}
                    </span>
                  </div>
                  <div className="rounded-lg p-1 flex" style={{backgroundColor: '#102463'}}>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'list' 
                          ? 'bg-white text-amber-600' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'grid' 
                          ? 'bg-white text-amber-600' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="hidden sm:inline">Grid</span>
                    </button>
                  </div>
                </div>
                
                {/* Desktop: View Mode Toggle */}
                <div className="hidden sm:flex">
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Dynamic based on active tab */}
      {activeTab === 'organization' && renderOrganizationView()}
      {activeTab === 'booth' && renderBoothView()}
      {activeTab === 'voter' && renderVoterView()}

      {/* Footer with dynamic counts */}
      <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 shadow-lg space-y-2 sm:space-y-0" style={{backgroundColor: '#102463'}}>
        <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg" style={{backgroundColor: '#ffffff'}}>
          <div className="flex items-center space-x-4 sm:space-x-6" style={{color: '#102463'}}>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold">
              {activeTab === 'organization' && (mainPramukhData ? 1 : 0)}
              {activeTab === 'booth' && boothData.length}
              {activeTab === 'voter' && voterData.length}
            </div>
            <div className="text-xs">
              {activeTab === 'organization' && 'शक्ति केन्द्र प्रमुख'}
              {activeTab === 'booth' && 'बूथ'}
              {activeTab === 'voter' && 'बूथ'}
            </div>
          </div>
          {activeTab === 'organization' && (
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold">{coPramukhData.length}</div>
              <div className="text-xs">सह शक्ति केन्द्र प्रमुख</div>
            </div>
          )}
          {activeTab === 'booth' && (
            <>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold">{boothData.filter(booth => booth.assigned).length}</div>
                <div className="text-xs">प्रमुख</div>
              </div>
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold">{boothData.filter(booth => !booth.assigned).length}</div>
                <div className="text-xs">खाली बूथ</div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
      </div>
      <CreateOrganizationMemberModal
        isOpen={showCreateMember}
        onClose={() => setShowCreateMember(false)}
        onSubmit={() => {
          setShowCreateMember(false)
          // Refresh cadre data after creating new member
          fetchShaktiKendraData()
        }}
        mainAdminId={mainAdminId}
      />
      
      {/* Edit Organization Member Modal */}
      <CreateOrganizationMemberModal
        isOpen={showEditMemberModal}
        onClose={() => {
          setShowEditMemberModal(false)
          setMemberToEdit(null)
        }}
        onSubmit={() => {
          setShowEditMemberModal(false)
          setMemberToEdit(null)
          // Refresh cadre data after updating member
          fetchShaktiKendraData()
        }}
        mainAdminId={mainAdminId}
        editData={memberToEdit}
        mode="edit"
      />
      
      <ShaktiKendraPramukhDetailModal
        pramukh={selectedPramukhForModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedPramukhForModal(null)
        }}
        onCall={handleCall}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEditPramukh}
        onDelete={handleDeletePramukh}
      />
      
      {/* Edit Modal */}
      <CreateShaktiKendraPramukhModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSuccess={refreshCadreData}
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
      
      {/* Add Booth Head Modal */}
      <AddBoothHeadModal
        isOpen={showAddBoothHeadModal}
        onClose={handleCloseAddBoothHeadModal}
        boothNumber={selectedBoothForHead}
        onSave={handleBoothHeadSave}
        mode="create"
      />
      
      {/* Booth Pramukh List Modal for WhatsApp */}
      <BoothPramukhListModal
        isOpen={showBoothPramukhListModal}
        onClose={() => {
          setShowBoothPramukhListModal(false)
          setSelectedBoothForList(null)
        }}
        boothNumber={selectedBoothForList?.number || selectedBoothForList?.id}
        onShowCadre={() => {
          // Navigate to booth detail if needed
          if (selectedBoothForList) {
            handleBoothClick(selectedBoothForList)
          }
        }}
      />
      
      {/* Custom CSS for Scrollbar */}
      <style>{`
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

export default ShaktiKendraDetailSlide
