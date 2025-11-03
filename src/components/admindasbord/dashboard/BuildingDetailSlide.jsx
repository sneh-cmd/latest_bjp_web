import React, { useEffect, useState } from 'react'
import { displayBuildingPramukhCadreWithVoter, apiService } from '../../../apidata'
import AddBuildingPramukhModal from '../modals/AddBuildingPramukhModal'
import AddBuildingCoInchargeModal from '../modals/AddBuildingCoInchargeModal'
import EditBuildingCoInchargeModal from '../modals/EditBuildingCoInchargeModal'
import BuildingCoInchargeDetailModal from '../modals/BuildingCoInchargeDetailModal'
import BuildingPramukhDetailModal from '../modals/BuildingPramukhDetailModal'
import EditBuildingPramukhModal from '../modals/EditBuildingPramukhModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import LastLoginModal from '../modals/LastLoginModal'
import localStorageManager from '../../../utils/localStorage'

const BuildingDetailSlide = ({ navigation, buildingData, buildingId }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('organization')
  const [buildingPramukh, setBuildingPramukh] = useState(null)
  const [coInchargeData, setCoInchargeData] = useState([])
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [addresses, setAddresses] = useState([])
  const [reDevelopmentAddresses, setReDevelopmentAddresses] = useState([]) // Addresses with redevelopment notes
  const [selectedFilter, setSelectedFilter] = useState('total') // 'total', 'visited', 'unavailable', 'remaining'
  const [showAddBuildingHeadModal, setShowAddBuildingHeadModal] = useState(false)
  const [showAddCoInchargeModal, setShowAddCoInchargeModal] = useState(false)
  const [showEditCoInchargeModal, setShowEditCoInchargeModal] = useState(false)
  const [showCoInchargeDetailModal, setShowCoInchargeDetailModal] = useState(false)
  const [showBuildingHeadDetailModal, setShowBuildingHeadDetailModal] = useState(false)
  const [showEditBuildingHeadModal, setShowEditBuildingHeadModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [selectedCoIncharge, setSelectedCoIncharge] = useState(null)
  const [selectedBuildingHead, setSelectedBuildingHead] = useState(null)
  const [coInchargeToDelete, setCoInchargeToDelete] = useState(null)
  const [coInchargeToEdit, setCoInchargeToEdit] = useState(null)
  const [buildingHeadToEdit, setBuildingHeadToEdit] = useState(null)
  const [buildingHeadToDelete, setBuildingHeadToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Load building pramukh and voter data
  useEffect(() => {
    const loadBuildingData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use buildingData.id or buildingId as main_admin_id
        const mainAdminId = buildingData?.id || buildingId
        if (!mainAdminId) {
          throw new Error('No building ID provided')
        }
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId)

        console.log('📦 Building data response:', response)
        setBuildingPramukh(response.buildingPramukh)
        setVoters(response.voters || [])
        
        // Extract unique addresses from voters and separate regular and redevelopment
        const allAddresses = (response.voters || []).map(voter => ({
          address: voter.eng_localityid || '',
          voters: [voter],
          note: voter.re_development_note || voter.note || voter.add_add || ''
        })).filter(item => item.address)
        
        // Group by address
        const addressMap = new Map()
        allAddresses.forEach(item => {
          if (addressMap.has(item.address)) {
            addressMap.get(item.address).voters.push(item.voters[0])
            // Keep note if exists
            if (item.note && !addressMap.get(item.address).note) {
              addressMap.get(item.address).note = item.note
            }
          } else {
            addressMap.set(item.address, { address: item.address, voters: item.voters, note: item.note })
          }
        })
        
        // Separate regular addresses and redevelopment addresses
        const regularAddrs = []
        const reDevAddrs = []
        
        addressMap.forEach((value, key) => {
          const addressData = {
            address: key,
            voterCount: value.voters.length,
            note: value.note || ''
          }
          
          // Only add to redevelopment if explicitly marked (note contains "re development" keywords)
          const addressLower = key.toLowerCase()
          const noteLower = (value.note || '').toLowerCase()
          const isReDevelopment = addressLower.includes('re development') || 
                                 addressLower.includes('redevelopment') || 
                                 noteLower.includes('re development') || 
                                 noteLower.includes('redevelopment') ||
                                 (value.note && value.note.trim() !== '')
          
          if (isReDevelopment) {
            reDevAddrs.push(addressData)
          } else {
            regularAddrs.push(key)
          }
        })
        
        setAddresses(regularAddrs)
        setReDevelopmentAddresses(reDevAddrs)
        if (regularAddrs.length > 0) {
          setSelectedAddress(regularAddrs[0])
        } else if (reDevAddrs.length > 0) {
          setSelectedAddress(reDevAddrs[0].address)
        }
        
        // Use co-incharge data directly from API response (already extracted in apidata.jsx)
        if (response.coIncharge && Array.isArray(response.coIncharge) && response.coIncharge.length > 0) {
          console.log('✅ Setting co-incharge data from API:', response.coIncharge.length, 'items')
          setCoInchargeData(response.coIncharge.map(item => {
            const lastLogin = item.lastLogin || item.last_login || ''
            const isLastLoginNotEmpty = lastLogin && lastLogin.toString().trim() !== ''
            return {
              id: item.id || item.admin_id,
              name: item.name,
              phone: item.phone || item.mobile || item.mobile_no || item.mobileNo || item.phoneNumber,
              role: item.role || item.designation || 'बिल्डिंग सह इनचार्ज',
              status: item.status || (isLastLoginNotEmpty ? 'active' : 'inactive'),
              profileImage: item.profileImage || item.photo_path || item.photoPath || item.photo,
              lastLogin: lastLogin,
              last_login: lastLogin
            }
          }))
        } else {
          console.log('ℹ️ No co-incharge data in response')
          // Preserve existing in-memory list if present to avoid wiping after save
          setCoInchargeData(prev => (prev && prev.length > 0 ? prev : []))
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading building data:', err)
        setError(err.message || 'Failed to load building data')
        setLoading(false)
      }
    }

    loadBuildingData()
  }, [buildingData, buildingId])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => navigate('/building-pramukh'), 300)
  }

  // Helper function to check if voter_status1 is not empty
  const isVoterStatus1NotEmpty = (voter) => {
    return voter.voter_status1 && voter.voter_status1.toString().trim() !== ''
  }

  // Helper function to check if voter is unavailable
  // Unavailable voters are those who were visited (voter_status1 is set) but marked as unavailable
  const isVoterUnavailable = (voter) => {
    // Check if voter was visited (has voter_status1)
    const hasStatus = isVoterStatus1NotEmpty(voter)
    if (!hasStatus) return false
    
    // Check if status indicates unavailable
    const status = (voter.voter_status || voter.voter_status1 || '').toString().toLowerCase().trim()
    // Status 'u' means unavailable
    return status === 'u'
  }

  // Calculate voter statistics
  const totalVoters = voters.length
  const visitedVoters = voters.filter(voter => {
    const hasStatus = isVoterStatus1NotEmpty(voter)
    return hasStatus && !isVoterUnavailable(voter)
  }).length
  const unavailableVoters = voters.filter(voter => isVoterUnavailable(voter)).length
  const remainingVisits = voters.filter(voter => !isVoterStatus1NotEmpty(voter)).length

  // Filter voters by selected address and summary card filter
  let filteredVoters = voters

  // Apply summary card filter
  if (selectedFilter === 'visited') {
    filteredVoters = filteredVoters.filter(voter => {
      const hasStatus = isVoterStatus1NotEmpty(voter)
      return hasStatus && !isVoterUnavailable(voter)
    })
  } else if (selectedFilter === 'unavailable') {
    filteredVoters = filteredVoters.filter(voter => isVoterUnavailable(voter))
  } else if (selectedFilter === 'remaining') {
    filteredVoters = filteredVoters.filter(voter => !isVoterStatus1NotEmpty(voter))
  }

  // Apply address filter
  if (selectedAddress) {
    filteredVoters = filteredVoters.filter(voter => voter.eng_localityid === selectedAddress)
  }

  const handleCall = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== '-') {
      window.open(`tel:${phoneNumber}`, '_self')
    }
  }

  const handleCheck = (voter) => {
    console.log('Check voter:', voter)
    // Implement check functionality
  }

  const handleFamily = (voter) => {
    console.log('Family for voter:', voter)
    // Implement family functionality
  }

  const handleAddBuildingHead = () => {
    setShowAddBuildingHeadModal(true)
  }

  const handleSaveBuildingHead = async (data) => {
    console.log('Building head saved:', data)
    // Refresh data from API after successful save
    const mainAdminId = buildingData?.id || buildingId
    if (mainAdminId) {
      try {
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId)
        setBuildingPramukh(response.buildingPramukh)
      } catch (err) {
        console.error('Error refreshing building head:', err)
      }
    }
  }

  const handleAddCoIncharge = () => {
    // Get the building ID - use buildingPramukh.id first (it's the actual main_admin_id from API)
    const currentBuildingId = buildingPramukh?.id || buildingData?.id || buildingId
    console.log('➕ Opening Add Co-incharge Modal with buildingId:', currentBuildingId)
    
    if (!currentBuildingId || currentBuildingId === 0 || currentBuildingId === '0' || currentBuildingId === '1') {
      alert('बिल्डिंग ID उपलब्ध नहीं है. कृपया पहले बिल्डिंग डेटा लोड होने तक प्रतीक्षा करें.')
      return
    }
    
    setShowAddCoInchargeModal(true)
  }

  const handleSaveCoIncharge = async (data) => {
    console.log('💾 Co-incharge saved:', data)
    console.log('📊 Current buildingPramukh:', buildingPramukh)
    
    // Get the main_admin_id - prefer API-used id to ensure persistence
    const savedBuildingId = data.main_admin_id || data.buildingId || buildingPramukh?.id || buildingData?.id || buildingId
    console.log('🔄 Will refresh using building main_admin_id:', savedBuildingId)
    
    // Optimistically add the newly created co-incharge to the list immediately
    if (data && data.name) {
      const newCoIncharge = {
        id: data.apiResponse?.id || `temp-${Date.now()}`,
        name: data.name,
        phone: data.phone || data.mobile_no || '',
        role: 'बिल्डिंग सह इनचार्ज',
        status: 'active',
        profileImage: null
      }
      
      // Add to existing co-incharge list immediately
      setCoInchargeData(prev => {
        // Check if already exists to avoid duplicates
        const exists = prev.find(item => item.name === newCoIncharge.name && item.phone === newCoIncharge.phone)
        if (exists) {
          console.log('⚠️ Co-incharge already exists, not adding duplicate')
          return prev
        }
        console.log('✅ Optimistically added co-incharge:', newCoIncharge)
        return [...prev, newCoIncharge]
      })
    }
    
    // Refresh data from API after successful save
    // Use the same ID that was used when saving
    if (savedBuildingId && savedBuildingId !== 0 && savedBuildingId !== '0') {
      try {
        // Refresh multiple times to ensure data is loaded
        const refreshData = async () => {
          try {
            setLoading(true)
            const response = await displayBuildingPramukhCadreWithVoter(savedBuildingId)
            console.log('🔄 Refresh response for building:', savedBuildingId, {
              buildingPramukhCadreCount: response.buildingPramukhCadre?.length || 0,
              coInchargeCount: response.coIncharge?.length || 0,
              hasCoIncharge: !!response.coIncharge
            })
            
            // Use co-incharge data directly from API response (already extracted in apidata.jsx)
            if (response.coIncharge && Array.isArray(response.coIncharge) && response.coIncharge.length > 0) {
              console.log('✅ Co-incharge data updated from API:', response.coIncharge.length, 'items')
              setCoInchargeData(response.coIncharge.map(item => {
                const lastLogin = item.lastLogin || item.last_login || ''
                const isLastLoginNotEmpty = lastLogin && lastLogin.toString().trim() !== ''
                return {
                  id: item.id || item.admin_id,
                  name: item.name,
                  phone: item.phone || item.mobile || item.mobile_no || item.mobileNo || item.phoneNumber,
                  role: item.role || item.designation || 'बिल्डिंग सह इनचार्ज',
                  status: item.status || (isLastLoginNotEmpty ? 'active' : 'inactive'),
                  profileImage: item.profileImage || item.photo_path || item.photoPath || item.photo
                }
              }))
            } else {
              console.log('ℹ️ No co-incharge in refresh response')
              // Only clear if we're sure there are none (not just empty array)
              setCoInchargeData([])
            }
            
            // Also update building pramukh data
            if (response.buildingPramukh) {
              setBuildingPramukh(response.buildingPramukh)
            }
            setLoading(false)
          } catch (err) {
            console.error('❌ Error refreshing co-incharge:', err)
            setLoading(false)
          }
        }
        // Immediate refresh
        refreshData()
        // Refresh after 2 seconds
        setTimeout(refreshData, 2000)
        
        // Refresh again after 5 seconds (in case backend takes longer)
        setTimeout(refreshData, 5000)
      } catch (err) {
        console.error('❌ Error setting up refresh:', err)
      }
    } else {
      console.error('❌ Cannot refresh - invalid building ID:', savedBuildingId)
    }
  }

  const handleEditCoInchargeSuccess = async () => {
    // Refresh building data after successful edit
    const mainAdminId = buildingPramukh?.id || buildingData?.id || buildingId
    if (mainAdminId) {
      try {
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId)
        if (response.coIncharge && Array.isArray(response.coIncharge) && response.coIncharge.length > 0) {
          setCoInchargeData(response.coIncharge.map(item => {
            const lastLogin = item.lastLogin || item.last_login || ''
            const isLastLoginNotEmpty = lastLogin && lastLogin.toString().trim() !== ''
            return {
              id: item.id || item.admin_id,
              name: item.name,
              phone: item.phone || item.mobile || item.mobile_no || item.mobileNo || item.phoneNumber,
              role: item.role || item.designation || 'बिल्डिंग सह इनचार्ज',
              status: item.status || (isLastLoginNotEmpty ? 'active' : 'inactive'),
              profileImage: item.profileImage || item.photo_path || item.photoPath || item.photo,
              lastLogin: lastLogin,
              last_login: lastLogin
            }
          }))
        } else {
          setCoInchargeData([])
        }
      } catch (err) {
        console.error('Error refreshing co-incharge:', err)
      }
    }
    setShowEditCoInchargeModal(false)
    setCoInchargeToEdit(null)
  }

  const handleCloseEditCoInchargeModal = () => {
    setShowEditCoInchargeModal(false)
    setCoInchargeToEdit(null)
  }

  const handleViewDetails = (person) => {
    console.log('View details for:', person)
    // Check if it's a co-incharge based on role
    const isCoIncharge = person.role && (
      person.role.includes('सह इनचार्ज') || 
      person.role.includes('Co Incharge') ||
      person.role === 'बिल्डिंग सह इनचार्ज'
    )
    
    if (isCoIncharge) {
      setSelectedCoIncharge(person)
      setShowCoInchargeDetailModal(true)
    } else {
      // It's a building head
      setSelectedBuildingHead(person)
      setShowBuildingHeadDetailModal(true)
    }
  }

  const handleCloseCoInchargeDetailModal = () => {
    setShowCoInchargeDetailModal(false)
    setSelectedCoIncharge(null)
  }

  const handleCloseBuildingHeadDetailModal = () => {
    setShowBuildingHeadDetailModal(false)
    setSelectedBuildingHead(null)
  }

  const handleEditCoIncharge = (person) => {
    console.log('Edit co-incharge:', person)
    
    if (!person || !person.id) {
      console.error('Invalid person data for edit:', person)
      return
    }
    
    console.log('📝 Setting co-incharge to edit:', person)
    
    // Close detail modal and set edit data, then open edit modal
    setShowCoInchargeDetailModal(false)
    setSelectedCoIncharge(null)
    setCoInchargeToEdit(person)
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      console.log('🚀 Opening edit co-incharge modal')
      setShowEditCoInchargeModal(true)
    }, 100)
  }

  const handleDeleteCoIncharge = (person) => {
    console.log('Delete co-incharge:', person)
    
    if (!person || !person.id) {
      console.error('Invalid person data for delete:', person)
      return
    }
    
    // Close detail modal and set delete data, then open delete confirmation modal
    setShowCoInchargeDetailModal(false)
    setSelectedCoIncharge(null)
    setCoInchargeToDelete(person)
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      console.log('🚀 Opening delete confirmation modal')
      setShowDeleteConfirmModal(true)
    }, 100)
  }

  const handleDeleteConfirm = async () => {
    if (!coInchargeToDelete) return
    
    try {
      setIsDeleting(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: coInchargeToDelete.id,
        type: 'D',
        sub_type: 'D',
        name: coInchargeToDelete.name || '',
        mobile_no: coInchargeToDelete.phone || '',
        photo: '',
        base64: '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: userData?.admin?.adminId || userData?.admin?.id || '1'
      }
      
      console.log('🗑️ Deleting building co-incharge:', payload)
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh data from API after successful deletion
      const mainAdminId = buildingPramukh?.id || buildingData?.id || buildingId
      if (mainAdminId) {
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId)
        if (response.coIncharge && Array.isArray(response.coIncharge) && response.coIncharge.length > 0) {
          setCoInchargeData(response.coIncharge.map(item => {
            const lastLogin = item.lastLogin || item.last_login || ''
            const isLastLoginNotEmpty = lastLogin && lastLogin.toString().trim() !== ''
            return {
              id: item.id || item.admin_id,
              name: item.name,
              phone: item.phone || item.mobile || item.mobile_no || item.mobileNo || item.phoneNumber,
              role: item.role || item.designation || 'बिल्डिंग सह इनचार्ज',
              status: item.status || (isLastLoginNotEmpty ? 'active' : 'inactive'),
              profileImage: item.profileImage || item.photo_path || item.photoPath || item.photo,
              lastLogin: lastLogin,
              last_login: lastLogin
            }
          }))
        } else {
          setCoInchargeData([])
        }
      }
      
      setShowDeleteConfirmModal(false)
      setCoInchargeToDelete(null)
    } catch (error) {
      console.error('Error deleting co-incharge:', error)
      alert('सह इनचार्ज हटाने में विफल. कृपया पुन: प्रयास करें.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirmModal(false)
    setCoInchargeToDelete(null)
  }

  const handleEditBuildingHead = (building) => {
    console.log('Edit building head:', building)
    
    if (!building || !building.id) {
      console.error('Invalid building data for edit:', building)
      return
    }
    
    // Prepare building data with addresses for edit modal
    // Use addresses from buildingPramukh, buildingData, or fallback to addresses state (voter addresses)
    const buildingAddresses = buildingPramukh?.addresses || 
                              buildingData?.addresses || 
                              building.addresses || 
                              []
    
    const buildingToEdit = {
      ...building,
      id: building.id || buildingPramukh?.id || buildingData?.id,
      name: building.name || buildingPramukh?.name || buildingData?.name,
      phoneNumber: building.phoneNumber || buildingPramukh?.phoneNumber || buildingData?.phoneNumber,
      photoPath: building.photoPath || buildingPramukh?.photoPath || buildingData?.photoPath,
      profileImage: building.profileImage || buildingPramukh?.profileImage || buildingData?.profileImage,
      addresses: buildingAddresses
    }
    
    console.log('📝 Setting building to edit:', buildingToEdit)
    
    // Close detail modal and set edit data, then open edit modal
    setShowBuildingHeadDetailModal(false)
    setSelectedBuildingHead(null)
    setBuildingHeadToEdit(buildingToEdit)
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      console.log('🚀 Opening edit building head modal')
      setShowEditBuildingHeadModal(true)
    }, 100)
  }

  const handleDeleteBuildingHead = (building) => {
    console.log('Delete building head:', building)
    
    if (!building || !building.id) {
      console.error('Invalid building data for delete:', building)
      return
    }
    
    // Close detail modal and set delete data, then open delete confirmation modal
    setShowBuildingHeadDetailModal(false)
    setSelectedBuildingHead(null)
    setBuildingHeadToDelete(building)
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      console.log('🚀 Opening delete confirmation modal')
      setShowDeleteConfirmModal(true)
    }, 100)
  }

  const handleDeleteBuildingHeadConfirm = async () => {
    if (!buildingHeadToDelete) return
    
    try {
      setIsDeleting(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: buildingHeadToDelete.id || buildingHeadToDelete.adminId,
        type: 'D',
        sub_type: 'D',
        name: buildingHeadToDelete.name || '',
        mobile_no: buildingHeadToDelete.phoneNumber || buildingHeadToDelete.mobileNo || '',
        photo: buildingHeadToDelete.profileImage || buildingHeadToDelete.photoPath || '',
        base64: '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: buildingHeadToDelete.addresses && buildingHeadToDelete.addresses.length > 0
          ? buildingHeadToDelete.addresses.join('%') + '%'
          : '',
        modify_by: userData?.admin?.adminId || userData?.admin?.id || '1'
      }
      
      console.log('🗑️ Deleting building head:', payload)
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Navigate back to building pramukh list after successful deletion
      setIsVisible(false)
      setTimeout(() => {
        navigate('/building-pramukh')
      }, 300)
      
      setShowDeleteConfirmModal(false)
      setBuildingHeadToDelete(null)
    } catch (error) {
      console.error('Error deleting building head:', error)
      alert('बिल्डिंग प्रमुख हटाने में विफल. कृपया पुन: प्रयास करें.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteBuildingHeadCancel = () => {
    setShowDeleteConfirmModal(false)
    setBuildingHeadToDelete(null)
  }

  const handleEditBuildingHeadSuccess = async () => {
    // Refresh building data after successful edit
    const mainAdminId = buildingPramukh?.id || buildingData?.id || buildingId
    if (mainAdminId) {
      try {
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId)
        setBuildingPramukh(response.buildingPramukh)
        setVoters(response.voters || [])
      } catch (err) {
        console.error('Error refreshing building head:', err)
      }
    }
    setShowEditBuildingHeadModal(false)
    setBuildingHeadToEdit(null)
  }

  const handleCloseEditBuildingHeadModal = () => {
    setShowEditBuildingHeadModal(false)
    setBuildingHeadToEdit(null)
  }

  const current = buildingPramukh || buildingData || {
    id: buildingId || 0,
    name: '—',
    phoneNumber: '',
    status: 'active',
    designation: 'बिल्डिंग प्रमुख',
    lastLogin: buildingPramukh?.last_login || buildingPramukh?.lastLogin || buildingData?.last_login || buildingData?.lastLogin || '',
    last_login: buildingPramukh?.last_login || buildingPramukh?.lastLogin || buildingData?.last_login || buildingData?.lastLogin || ''
  }

  if (!isVisible) return null

  return (
    <>
      <AddBuildingPramukhModal
        isOpen={showAddBuildingHeadModal}
        onClose={() => setShowAddBuildingHeadModal(false)}
        onSave={handleSaveBuildingHead}
      />
      
      <AddBuildingCoInchargeModal
        isOpen={showAddCoInchargeModal}
        onClose={() => setShowAddCoInchargeModal(false)}
        buildingId={buildingPramukh?.id || buildingData?.id || buildingId}
        onSave={handleSaveCoIncharge}
      />
      
      <EditBuildingCoInchargeModal
        isOpen={showEditCoInchargeModal}
        onClose={handleCloseEditCoInchargeModal}
        onSuccess={handleEditCoInchargeSuccess}
        person={coInchargeToEdit}
      />
      
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmModal && !!coInchargeToDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        admin={coInchargeToDelete}
      />
      
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmModal && !!buildingHeadToDelete}
        onClose={handleDeleteBuildingHeadCancel}
        onConfirm={handleDeleteBuildingHeadConfirm}
        admin={buildingHeadToDelete}
      />
      
      <EditBuildingPramukhModal
        isOpen={showEditBuildingHeadModal}
        onClose={handleCloseEditBuildingHeadModal}
        onSuccess={handleEditBuildingHeadSuccess}
        building={buildingHeadToEdit}
      />
      
      <BuildingCoInchargeDetailModal
        person={selectedCoIncharge}
        onClose={handleCloseCoInchargeDetailModal}
        onCall={handleCall}
        onEdit={handleEditCoIncharge}
        onDelete={handleDeleteCoIncharge}
      />
      
      <BuildingPramukhDetailModal
        building={selectedBuildingHead}
        onClose={handleCloseBuildingHeadDetailModal}
        onCall={(building) => handleCall(building.phoneNumber)}
        onEdit={handleEditBuildingHead}
        onDelete={handleDeleteBuildingHead}
      />
      
      <div className={`fixed inset-0 z-50 flex flex-col transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-100"></div>
        
        {/* Main Container */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="px-2 sm:px-4 py-3 sm:py-4 flex-shrink-0 shadow-md" style={{backgroundColor: '#102463'}}>
            <div className="flex items-center justify-between">
              <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-white text-base sm:text-lg font-semibold">बिल्डिंग - {current.name || buildingData?.name || buildingId || '—'}</h1>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 py-2 flex-shrink-0" style={{backgroundColor: '#102463'}}>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setActiveTab('organization')} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'organization' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                संगठन
              </button>
              <button 
                onClick={() => setActiveTab('address')} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'address' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                पता
              </button>
              <button 
                onClick={() => setActiveTab('voter')} 
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'voter' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                मतदाता
              </button>
            </div>
          </div>

          {/* Main Content - Dynamic based on active tab */}
          {activeTab === 'organization' ? (
            <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto" style={{ backgroundColor: '#e5e8ff' }}>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
                    <p className="text-gray-600">डेटा लोड हो रहा है...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-red-500 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600 mb-4">त्रुटि: {error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                      पुनः प्रयास करें
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Building Head Section */}
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="text-white px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#102463' }}>
                      <h2 className="font-semibold text-lg">बिल्डिंग प्रमुख</h2>
                      <button
                        onClick={handleAddBuildingHead}
                        className="bg-white text-blue-800 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        जोड़ें
                      </button>
                    </div>
                
                    <div className="p-4">
                      {current && current.name && current.name !== '—' ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {current.profileImage || current.photo ? (
                                <img
                                  src={current.profileImage || current.photo}
                                  alt={current.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{current.name}</h3>
                              {current.phoneNumber && (
                                <p className="text-blue-600 text-sm">{current.phoneNumber}</p>
                              )}
                              <p className="text-gray-600 text-sm">{current.designation || 'बिल्डिंग प्रमुख'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {current.phoneNumber && (
                              <button
                                onClick={() => handleCall(current.phoneNumber)}
                                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                              >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetails(current)}
                              className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors"
                            >
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => {
                                if (current.status === 'active' && (current.last_login || current.lastLogin)) {
                                  setSelectedUserForLastLogin({
                                    name: current.name,
                                    lastLogin: current.last_login || current.lastLogin
                                  })
                                  setShowLastLoginModal(true)
                                }
                              }}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                current.status === 'active' ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' : 'bg-red-500 text-white'
                              }`}
                            >
                              {current.status === 'active' ? 'Active' : 'inactive'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p>कोई बिल्डिंग प्रमुख नहीं मिला</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Co-incharge Section */}
                  <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-200 px-4 py-3 flex items-center justify-between border-b border-red-500">
                      <h2 className="font-semibold text-gray-700 text-lg">बिल्डिंग सह इनचार्ज</h2>
                      <button
                        onClick={handleAddCoIncharge}
                        className="bg-blue-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-900 transition-colors"
                      >
                        जोड़ें
                      </button>
                    </div>
                
                    <div className="p-4">
                      {coInchargeData && coInchargeData.length > 0 ? (
                        <div className="space-y-3">
                          {coInchargeData.map((person, index) => (
                            <div key={person.id || person.admin_id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                  {person.profileImage || person.photo ? (
                                    <img
                                      src={person.profileImage || person.photo}
                                      alt={person.name}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-800">{person.name}</h3>
                                  {person.phone && (
                                    <p className="text-blue-600 text-sm">{person.phone}</p>
                                  )}
                                  <p className="text-gray-600 text-sm">{person.role || person.designation || 'बिल्डिंग सह इनचार्ज'}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {person.phone && (
                                  <button
                                    onClick={() => handleCall(person.phone)}
                                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                                  >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedCoIncharge(person)
                                    setShowCoInchargeDetailModal(true)
                                  }}
                                  className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-600 transition-colors"
                                >
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => {
                                    if (person.status === 'active' && (person.last_login || person.lastLogin)) {
                                      setSelectedUserForLastLogin({
                                        name: person.name,
                                        lastLogin: person.last_login || person.lastLogin
                                      })
                                      setShowLastLoginModal(true)
                                    }
                                  }}
                                  className={`px-3 py-1 rounded text-sm font-medium ${
                                    person.status === 'active' ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' : 'bg-red-500 text-white'
                                  }`}
                                >
                                  {person.status === 'active' ? 'Active' : 'inactive'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p>कोई बिल्डिंग सह इनचार्ज नहीं मिला</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : activeTab === 'address' ? (
            <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto" style={{ backgroundColor: '#e5e8ff' }}>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
                    <p className="text-gray-600">डेटा लोड हो रहा है...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-red-500 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600 mb-4">त्रुटि: {error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                      पुनः प्रयास करें
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {/* Regular Addresses Section */}
                    {addresses && addresses.length > 0 && (
                      <div className="space-y-2">
                        {addresses.map((address, index) => {
                          const voterCount = voters.filter(v => v.eng_localityid === address).length
                          return (
                            <div 
                              key={index}
                              className="bg-white rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => setSelectedAddress(address)}
                            >
                              <div className="flex items-start">
                                <span className="text-gray-900 font-bold text-sm mr-2">{index + 1}.</span>
                                <div className="flex-1">
                                  <p className="text-gray-900 font-medium text-xs leading-relaxed uppercase">
                                    {address}
                                  </p>
                                  <p className="text-gray-600 text-xs mt-1">
                                    टोटल मतदाता : {voterCount}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Re Development Section */}
                    {reDevelopmentAddresses && reDevelopmentAddresses.length > 0 && (
                      <div className="space-y-2">
                        {/* Re Development Header */}
                        <div className="bg-gray-200 px-4 py-2">
                          <h3 className="font-bold text-black text-sm">Re Development</h3>
                        </div>

                        {/* Re Development Address Items */}
                        {reDevelopmentAddresses.map((addrData, index) => {
                          const voterCount = voters.filter(v => v.eng_localityid === addrData.address).length
                          return (
                            <div key={index} className="space-y-0">
                              <div 
                                className="bg-gray-200 rounded-md p-3 cursor-pointer hover:bg-gray-250 transition-colors"
                                onClick={() => setSelectedAddress(addrData.address)}
                              >
                                <div className="flex items-start">
                                  <span className="text-gray-900 font-bold text-sm mr-2">{index + 1}.</span>
                                  <div className="flex-1">
                                    <p className="text-gray-900 font-medium text-xs leading-relaxed uppercase">
                                      {addrData.address}
                                    </p>
                                    <p className="text-gray-600 text-xs mt-1">
                                      टोटल मतदाता : {voterCount}
                                    </p>
                                    {addrData.note && (
                                      <p className="text-gray-700 text-xs mt-1">
                                        <span className="font-semibold">नोट :</span> {addrData.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Green Separator Line */}
                              {index < reDevelopmentAddresses.length - 1 && (
                                <div className="h-px bg-green-500 mx-4"></div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Empty State */}
                    {(!addresses || addresses.length === 0) && (!reDevelopmentAddresses || reDevelopmentAddresses.length === 0) && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-gray-400 text-4xl mb-4">📍</div>
                          <p className="text-gray-600 font-medium">कोई पता नहीं मिला</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
                    <p className="text-gray-600">डेटा लोड हो रहा है...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-red-500 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600 mb-4">त्रुटि: {error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
                    >
                      पुनः प्रयास करें
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Voter Statistics */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <button onClick={() => setSelectedFilter('total')} className={`bg-gray-200 rounded-lg px-2 py-1.5 text-center transition-colors ${selectedFilter === 'total' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-xs font-bold text-gray-800">टोटल</div>
                      <div className="text-lg font-bold text-gray-900">{totalVoters}</div>
                    </button>
                    <button onClick={() => setSelectedFilter('visited')} className={`bg-white rounded-lg px-2 py-1.5 text-center transition-colors ${selectedFilter === 'visited' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-xs font-bold text-gray-800">मुलाकात</div>
                      <div className="text-lg font-bold text-gray-900">{visitedVoters}</div>
                    </button>
                    <button onClick={() => setSelectedFilter('unavailable')} className={`bg-white rounded-lg px-2 py-1.5 text-center transition-colors ${selectedFilter === 'unavailable' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-xs font-bold text-gray-800">अनुपलब्ध</div>
                      <div className="text-lg font-bold text-gray-900">{unavailableVoters}</div>
                    </button>
                    <button onClick={() => setSelectedFilter('remaining')} className={`bg-white rounded-lg px-2 py-1.5 text-center transition-colors ${selectedFilter === 'remaining' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-xs font-bold text-gray-800">मुलाकात बाकी</div>
                      <div className="text-lg font-bold text-gray-900">{remainingVisits}</div>
                    </button>
                  </div>

              {/* Address Dropdown */}
              {addresses.length > 0 && (
                <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">पता</span>
                  <select 
                    value={selectedAddress} 
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="bg-transparent text-gray-700 font-medium focus:outline-none"
                  >
                    {addresses.map((address, index) => (
                      <option key={index} value={address}>
                        {address.length > 50 ? `${address.substring(0, 50)}...` : address}
                      </option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Voter List */}
              {filteredVoters.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-gray-400 text-4xl mb-2">👥</div>
                  <p>No voters found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVoters.map((voter, index) => (
                    <div key={voter.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-gray-900">
                            {index + 1}. {voter.eng_f_name} {voter.f_eng_surname}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">पिता/पति:</span>
                            <span className="text-gray-900">{voter.eng_m_name}</span>
                          </div>
                          
                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">पता:</span>
                            <div className="flex-1 flex items-center">
                              <span className="text-gray-900 flex-1">{voter.eng_localityid}</span>
                              <svg className="w-4 h-4 text-blue-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>

                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">क्रमांक:</span>
                            <span className="text-gray-900">{voter.slnoinpart}</span>
                          </div>

                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">मोबाइल:</span>
                            <div className="flex-1 flex items-center">
                              <span className="text-gray-900">{voter.contact_no || '-'}</span>
                                <button className="ml-2 w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                  </svg>
                                </button>
                             
                            </div>
                          </div>

                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">पहचान पत्र नं.:</span>
                            <span className="text-gray-900">{voter.idcard_no}</span>
                          </div>

                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">बूथ नं:</span>
                            <span className="text-gray-900">{voter.booth_no}</span>
                          </div>

                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">घर नं:</span>
                            <span className="text-gray-900">{voter.eng_house_no || '-'}</span>
                          </div>

                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">मतदान स्थान:</span>
                            <span className="text-gray-900">{voter.eng_polling_location}</span>
                          </div>

                          <div className="flex">
                            <span className="w-24 text-gray-600 font-medium">दूसरा पता:</span>
                            <span className="text-gray-900">{voter.add_add || '-'}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-8 pt-3 border-t border-gray-100">
                          <button 
                            onClick={() => handleCall(voter.contact_no)}
                            className="flex flex-col items-center space-y-1"
                          >
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                              </svg>
                            </div>
                            <span className="text-xs text-gray-600">Call</span>
                          </button>

                          <button 
                            onClick={() => handleCheck(voter)}
                            className="flex flex-col items-center space-y-1"
                          >
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            </div>
                            <span className="text-xs text-gray-600">Check</span>
                          </button>

                          <button 
                            onClick={() => handleFamily(voter)}
                            className="flex flex-col items-center space-y-1"
                          >
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2v6h2z"/>
                              </svg>
                            </div>
                            <span className="text-xs text-gray-600">Family</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </>
              )}
            </div>
          )}

          {/* Footer with dynamic counts */}
          <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 shadow-lg space-y-2 sm:space-y-0" style={{backgroundColor: '#102463'}}>
            <div className="flex items-center space-x-4 sm:space-x-6 text-white">
              {activeTab === 'address' ? (
                <div className="bg-white rounded-lg px-3 py-2">
                  <span className="text-blue-800 text-sm font-medium">
                    टोटल पता : {addresses.length + reDevelopmentAddresses.length}
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold">
                      {activeTab === 'organization' && (current && current.name && current.name !== '—' ? 1 : 0)}
                      {activeTab === 'voter' && voters.length}
                    </div>
                    <div className="text-xs">
                      {activeTab === 'organization' && 'बिल्डिंग प्रमुख'}
                      {activeTab === 'voter' && 'मतदाता'}
                    </div>
                  </div>
                  {activeTab === 'organization' && (
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-bold">{coInchargeData.length}</div>
                      <div className="text-xs">बिल्डिंग सह इनचार्ज</div>
                    </div>
                  )}
                </>
              )}
              {activeTab === 'voter' && (
                <>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold">{visitedVoters}</div>
                    <div className="text-xs">मुलाकात</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold">{remainingVisits}</div>
                    <div className="text-xs">मुलाकात बाकी</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
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

export default BuildingDetailSlide


