import React, { useEffect, useMemo, useState } from 'react'
import { displayBuildingPramukhCadreWithVoter, apiService, displayBuildingPramukh } from '../../../apidata.jsx'
import AddBuildingPramukhModal from '../modals/AddBuildingPramukhModal.jsx'
import AddBuildingCoInchargeModal from '../modals/AddBuildingCoInchargeModal.jsx'
import ContactDetailModal from '../modals/ContactDetailModal.jsx'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal.jsx'
import LastLoginModal from '../modals/LastLoginModal.jsx'
import CheckButton from '../common/CheckButton.jsx'
import ValidationModal from '../modals/ValidationModal.jsx'
import PageHeader from '../common/PageHeader.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const normalizeMobileNumber = (value) => {
  if (!value) return ''
  const digits = value.toString().replace(/\D/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

const collectMobilesFromBuildingList = (buildingList = []) => {
  if (!Array.isArray(buildingList)) return []
  const numbers = new Set()
  buildingList.forEach(item => {
    ;[
      item?.phoneNumber,
      item?.mobileNo,
      item?.mobile,
      item?.phone
    ].forEach(candidate => {
      const normalized = normalizeMobileNumber(candidate)
      if (normalized) numbers.add(normalized)
    })
  })
  return Array.from(numbers)
}

// Avatar helpers: validate URLs, compute initials, render image with onError fallback
const isLikelyValidUrl = (v) => {
  if (!v) return false
  const s = String(v).trim()
  if (!s) return false
  const lower = s.toLowerCase()
  if (lower === 'null' || lower === 'n/a' || lower === '-') return false
  return /^(https?:\/\/|data:|\/)\S+/i.test(s)
}

const getInitials = (name) => {
  if (!name) return ''
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 3) return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase()
  if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return String(name).slice(0, 2).toUpperCase()
}

const renderProfileImage = (person = {}, sizeClass = 'w-8 h-8') => {
  const candidates = [person.profileImage, person.photoPath, person.photo, person.image]
  const src = candidates.find(isLikelyValidUrl)
  const initials = getInitials(person.name || person.fullName || person.title || '')

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden`}>
      {src ? (
        <>
          <img
            src={src}
            alt={person.name || 'profile'}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const sib = e.currentTarget.nextSibling
              if (sib) sib.style.display = 'flex'
            }}
          />
          <div style={{ display: 'none' }} className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center rounded-full">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
      )}
    </div>
  )
}

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
  const [searchQuery, setSearchQuery] = useState('')
  const [globalBuildingMobiles, setGlobalBuildingMobiles] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Check sessionStorage for activeTab when coming back from family screen
  useEffect(() => {
    const showVoterTab = sessionStorage.getItem('showVoterTab')
    if (showVoterTab === 'true') {
      setActiveTab('voter')
      // Clear the flag after using it
      sessionStorage.removeItem('showVoterTab')
    }
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
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        const buildingListPromise = displayBuildingPramukh(panelApiUrl)
          .then(resp => {
            if (resp && Array.isArray(resp.list)) {
              return resp.list
            }
            if (Array.isArray(resp)) {
              return resp
            }
            return []
          })
          .catch(error => {
            console.error('Error fetching building pramukh list:', error)
            return []
          })

        const [response, buildingList] = await Promise.all([
          displayBuildingPramukhCadreWithVoter(mainAdminId, panelApiUrl),
          buildingListPromise
        ])

        setGlobalBuildingMobiles(collectMobilesFromBuildingList(buildingList))

        console.log('📦 Building data response:', response)
        setBuildingPramukh(response.buildingPramukh || null)
        
        // Ensure voters is an array
        const votersList = Array.isArray(response.voters) ? response.voters : []
        setVoters(votersList)
        
        // Extract addresses from result3 (addressData) - use remark field to determine category
        const regularAddrs = []
        const reDevAddrs = []
        
        // Check if addressData is available from result3
        if (response.addressData && Array.isArray(response.addressData)) {
          response.addressData.forEach((item, index) => {
            if (!item || !item.address) return
            
            const address = String(item.address).trim()
            if (address === '') return
            
            const addressInfo = {
              address: address,
              voterCount: item.total_voter || 0,
              note: (item.note && typeof item.note === 'string') ? item.note.trim() : ''
            }
            
            // Check remark field - if it's "Re-Development" or "Re Development", add to redevelopment section
            const remark = (item.remark && typeof item.remark === 'string') ? item.remark.trim() : ''
            const isReDevelopment = remark === 'Re-Development' || remark === 'Re Development' || remark.toLowerCase().includes('re-development') || remark.toLowerCase().includes('redevelopment')
            
            if (isReDevelopment) {
              reDevAddrs.push(addressInfo)
            } else {
              // For regular addresses, store as object with voterCount for consistency
              regularAddrs.push({
                address: address,
                voterCount: item.total_voter || 0
              })
            }
          })
        } else {
          // Fallback: If result3 is not available, extract from voters (backward compatibility)
          const addressMap = new Map()
          
          votersList.forEach(voter => {
            if (!voter || typeof voter !== 'object') return
            
            const address = voter.eng_localityid
            if (address && (typeof address === 'string' || typeof address === 'number')) {
              const addressKey = String(address).trim()
              if (addressKey !== '') {
                if (!addressMap.has(addressKey)) {
                  const voterCount = votersList.filter(v => {
                    const vAddress = v.eng_localityid
                    return vAddress && String(vAddress).trim() === addressKey
                  }).length
                  addressMap.set(addressKey, voterCount)
                }
              }
            }
          })
          
          addressMap.forEach((voterCount, key) => {
            regularAddrs.push({
              address: key,
              voterCount: voterCount
            })
          })
        }
        
        setAddresses(regularAddrs)
        setReDevelopmentAddresses(reDevAddrs)
        
        // Set initial selected address to "All" (empty string) - default option
        // This ensures "पता (All)" option is selected by default when screen first loads
        setSelectedAddress('')
        
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

  // Helper function to check if voter is visited (voter_available === 1)
  const isVoterVisited = (voter) => {
    return voter.voter_available === 1 || voter.voter_available === '1'
  }

  // Helper function to check if voter is unavailable
  // Unavailable: voter_available === 0 and not_available_status is not empty
  const isVoterUnavailable = (voter) => {
    const voterAvailable = voter.voter_available === 0 || voter.voter_available === '0'
    const notAvailableStatus = (voter.not_available_status || '').toString().trim()
    return voterAvailable && notAvailableStatus !== ''
  }

  // Helper function to check if voter visit is remaining
  // Remaining: voter_available === 0 and not_available_status is empty
  const isVoterRemaining = (voter) => {
    const voterAvailable = voter.voter_available === 0 || voter.voter_available === '0'
    const notAvailableStatus = (voter.not_available_status || '').toString().trim()
    return voterAvailable && notAvailableStatus === ''
  }

  // Helper function to get voter status text and badge color
  const getVoterStatus = (voter) => {
    const voterAvailable = voter.voter_available === 1 || voter.voter_available === '1'
    
    if (!voterAvailable) {
      // If voter_available is 0, show not_available_status
      const notAvailableStatus = (voter.not_available_status || '').toString().trim()
      return {
        text: notAvailableStatus || '',
        color: 'bg-red-500' // Red for unavailable status
      }
    } else {
      // If voter_available is 1, map voter_status1
      const status = (voter.voter_status1 || '').toString().toLowerCase().trim()
      let statusText = ''
      let statusColor = 'bg-gray-500'
      
      switch (status) {
        case 'p':
          statusText = 'पॉजिटिव'
          statusColor = 'bg-green-500'
          break
        case 'n':
          statusText = 'नेगेटिव'
          statusColor = 'bg-red-500'
          break
        case 'c':
          statusText = "Can't Say"
          statusColor = 'bg-yellow-500'
          break
        case 'd':
          statusText = 'Doubtful'
          statusColor = 'bg-orange-500'
          break
        default:
          statusText = ''
          statusColor = 'bg-gray-500'
      }
      
      return {
        text: statusText,
        color: statusColor
      }
    }
  }

  // Calculate voter statistics
  const totalVoters = voters.length
  const visitedVoters = voters.filter(voter => isVoterVisited(voter)).length
  const unavailableVoters = voters.filter(voter => isVoterUnavailable(voter)).length
  const remainingVisits = voters.filter(voter => isVoterRemaining(voter)).length

  // Filter building pramukh data based on search query
  const shouldShowBuildingPramukh = buildingPramukh && (
    !searchQuery.trim() ||
    buildingPramukh.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buildingPramukh.phoneNumber?.includes(searchQuery) ||
    buildingPramukh.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter co-incharge data based on search query
  const filteredCoInchargeData = coInchargeData.filter(person => {
    if (!searchQuery.trim()) return true
    return (
      person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone?.includes(searchQuery) ||
      person.role?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Filter addresses based on search query
  const filteredAddresses = addresses.filter(addrItem => {
    if (!searchQuery.trim()) return true
    const address = typeof addrItem === 'string' ? addrItem : addrItem.address
    return address?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Filter re-development addresses based on search query
  const filteredReDevelopmentAddresses = reDevelopmentAddresses.filter(addrData => {
    if (!searchQuery.trim()) return true
    return (
      addrData.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addrData.note?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Filter voters by selected address, summary card filter, and search query
  let filteredVoters = voters

  // Apply summary card filter
  if (selectedFilter === 'visited') {
    filteredVoters = filteredVoters.filter(voter => isVoterVisited(voter))
  } else if (selectedFilter === 'unavailable') {
    filteredVoters = filteredVoters.filter(voter => isVoterUnavailable(voter))
  } else if (selectedFilter === 'remaining') {
    filteredVoters = filteredVoters.filter(voter => isVoterRemaining(voter))
  }

  // Apply address filter
  if (selectedAddress) {
    filteredVoters = filteredVoters.filter(voter => voter.eng_localityid === selectedAddress)
  }

  // Apply search query filter
  if (searchQuery.trim()) {
    filteredVoters = filteredVoters.filter(voter => {
      return (
        voter.eng_f_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.f_eng_surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.eng_m_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.eng_localityid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.contact_no?.includes(searchQuery) ||
        voter.idcard_no?.includes(searchQuery) ||
        voter.slnoinpart?.toString().includes(searchQuery) ||
        voter.booth_no?.toString().includes(searchQuery) ||
        voter.eng_house_no?.toString().includes(searchQuery) ||
        voter.eng_polling_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.add_add?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }

  const handleCall = (phoneNumber) => {
    const sanitized = (phoneNumber || '').toString().trim()
    
    // Check if mobile number exists and is valid (not empty, not '-', not 'N/A', and length >= 10)
    if (sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10) {
      window.open(`tel:${sanitized}`, '_self')
    } else {
      // Show modal if mobile number not found or invalid
      setShowModal(true)
    }
  }


  const handleFamily = (voter) => {
    if (!voter || !voter.id) return
    navigate('/family-screen', {
      voterId: voter.id,
      name: voter.name,
      buildingNumber: voter.buildingNumber
    })
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
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId, panelApiUrl)
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
            const userData = localStorageManager.getUserData()
            const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
            const response = await displayBuildingPramukhCadreWithVoter(savedBuildingId, panelApiUrl)
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
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId, panelApiUrl)
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

  const openBuildingHeadDetail = (building) => {
    if (!building) return

    const resolvedLastLogin = (building.last_login || building.lastLogin || buildingPramukh?.last_login || buildingPramukh?.lastLogin || buildingData?.last_login || buildingData?.lastLogin || '').toString().trim()
    const normalizedStatus = resolvedLastLogin.length > 0 ? 'active' : 'inactive'

    const resolvedPhone = building.phoneNumber || building.phone || building.mobile_no || building.mobileNo || building.mobile || buildingPramukh?.phoneNumber || buildingData?.phoneNumber || ''

    const resolvedProfileImage = building.profileImage
      || building.photoPath
      || building.photo
      || buildingPramukh?.profileImage
      || buildingPramukh?.photoPath
      || buildingPramukh?.photo
      || buildingData?.profileImage
      || buildingData?.photoPath
      || buildingData?.photo
      || null

    const resolvedAddresses = (() => {
      if (Array.isArray(building.addresses) && building.addresses.length > 0) return building.addresses
      if (Array.isArray(buildingPramukh?.addresses) && buildingPramukh.addresses.length > 0) return buildingPramukh.addresses
      if (Array.isArray(buildingData?.addresses) && buildingData.addresses.length > 0) return buildingData.addresses
      if (Array.isArray(addresses) && addresses.length > 0) {
        return addresses
          .map(addrItem => (typeof addrItem === 'string' ? addrItem : addrItem?.address))
          .filter(Boolean)
      }
      return []
    })()

    const resolvedAddressCount = building.addressCount || buildingPramukh?.addressCount || buildingData?.addressCount || resolvedAddresses.length
    const resolvedVoters = building.voters ?? buildingPramukh?.voters ?? buildingData?.voters ?? (Array.isArray(voters) ? voters.length : 0)

    const detailData = {
      ...building,
      id: building.id || buildingPramukh?.id || buildingData?.id || buildingId,
      name: building.name || buildingPramukh?.name || buildingData?.name || '',
      designation: building.designation || buildingPramukh?.designation || buildingData?.designation || 'बिल्डिंग प्रमुख',
      phoneNumber: resolvedPhone,
      profileImage: resolvedProfileImage,
      photoPath: building.photoPath || resolvedProfileImage,
      status: normalizedStatus,
      last_login: resolvedLastLogin,
      lastLogin: resolvedLastLogin,
      addresses: resolvedAddresses,
      addressCount: resolvedAddressCount,
      voters: resolvedVoters
    }

    setSelectedBuildingHead(detailData)
      setShowBuildingHeadDetailModal(true)
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
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId, panelApiUrl)
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
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        const response = await displayBuildingPramukhCadreWithVoter(mainAdminId, panelApiUrl)
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

  const buildingCoInchargeMobiles = useMemo(() => {
    const numbers = new Set()
    ;(coInchargeData || []).forEach(item => {
      const normalized = normalizeMobileNumber(
        item.phone ||
        item.mobile ||
        item.mobile_no ||
        item.mobileNo ||
        item.phoneNumber
      )
      if (normalized) numbers.add(normalized)
    })
    return Array.from(numbers)
  }, [coInchargeData])

  const buildingPramukhNumbers = useMemo(() => {
    const numbers = new Set()
    ;[
      current.phoneNumber,
      current.mobileNo,
      buildingPramukh?.phoneNumber,
      buildingPramukh?.mobileNo,
      buildingData?.phoneNumber,
      buildingData?.mobileNo
    ].forEach(candidate => {
      const normalized = normalizeMobileNumber(candidate)
      if (normalized) numbers.add(normalized)
    })
    return Array.from(numbers)
  }, [current.phoneNumber, current.mobileNo, buildingPramukh?.phoneNumber, buildingPramukh?.mobileNo, buildingData?.phoneNumber, buildingData?.mobileNo])

  const buildingPramukhExistingMobiles = useMemo(() => {
    return Array.from(new Set([
      ...(buildingPramukhNumbers || []),
      ...(buildingCoInchargeMobiles || []),
      ...(globalBuildingMobiles || [])
    ]))
  }, [buildingPramukhNumbers, buildingCoInchargeMobiles, globalBuildingMobiles])

  const currentLastLoginRaw = (current.last_login || current.lastLogin || '').toString().trim()
  const hasValidLastLogin = currentLastLoginRaw.length > 0
  const resolvedStatus = hasValidLastLogin ? 'active' : 'inactive'
  const isCurrentActive = resolvedStatus === 'active'
  const currentStatusLabel = isCurrentActive ? 'Active' : 'Inactive'

  if (!isVisible) return null

  return (
    <>
      <AddBuildingPramukhModal
        isOpen={showAddBuildingHeadModal}
        onClose={() => setShowAddBuildingHeadModal(false)}
        onSave={handleSaveBuildingHead}
        existingMobiles={buildingPramukhExistingMobiles}
        duplicateContextLabel="बिल्डिंग प्रमुख"
      />
      
      <AddBuildingCoInchargeModal
        isOpen={showAddCoInchargeModal}
        onClose={() => setShowAddCoInchargeModal(false)}
        buildingId={buildingPramukh?.id || buildingData?.id || buildingId}
        onSave={handleSaveCoIncharge}
        person={null}
        existingMobiles={buildingCoInchargeMobiles}
        duplicateContextLabel="बिल्डिंग सह इनचार्ज"
      />
      
      <AddBuildingCoInchargeModal
        isOpen={showEditCoInchargeModal}
        onClose={handleCloseEditCoInchargeModal}
        onSuccess={handleEditCoInchargeSuccess}
        buildingId={buildingPramukh?.id || buildingData?.id || buildingId}
        person={coInchargeToEdit}
        existingMobiles={buildingCoInchargeMobiles}
        duplicateContextLabel="बिल्डिंग सह इनचार्ज"
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
      
      <AddBuildingPramukhModal
        isOpen={showEditBuildingHeadModal}
        onClose={handleCloseEditBuildingHeadModal}
        onSuccess={handleEditBuildingHeadSuccess}
        building={buildingHeadToEdit}
        existingMobiles={buildingPramukhExistingMobiles}
        duplicateContextLabel="बिल्डिंग प्रमुख"
      />
      
      <ContactDetailModal
        person={selectedCoIncharge}
        onClose={handleCloseCoInchargeDetailModal}
        onCall={(person, phone) => handleCall(phone)}
        onEdit={handleEditCoIncharge}
        onDelete={handleDeleteCoIncharge}
        title="Building Co-Incharge"
        roleLabel="Building Co-Incharge"
        phoneKeys={['phone', 'phoneNumber', 'mobile', 'mobileNo']}
      />
      
      <ContactDetailModal
        person={selectedBuildingHead}
        onClose={handleCloseBuildingHeadDetailModal}
        onCall={(person, phone) => handleCall(phone)}
        onEdit={handleEditBuildingHead}
        onDelete={handleDeleteBuildingHead}
        title="Building Pramukh"
        roleLabel="Building Pramukh"
        phoneKeys={['phoneNumber', 'mobileNo', 'mobile', 'phone']}
      />
      
      <div className={`fixed inset-0 z-50 flex flex-col transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-100"></div>
        
        {/* Main Container */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <PageHeader
            title={`बिल्डिंग - ${current.name || buildingData?.name || buildingId || '—'}`}
            onBack={handleBack}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClear={() => setSearchQuery('')}
                />

          {/* Navigation Tabs and Search Bar Section */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
            {/* Desktop: Row layout (unchanged) | Mobile: Column layout */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
              {/* Mobile: Navigation Tabs First | Desktop: Left side - Empty space */}
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
                      onClick={() => setActiveTab('address')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors text-sm ${
                        activeTab === 'address' 
                          ? 'text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={activeTab === 'address' ? {backgroundColor: '#102463'} : {}}
                    >
                      पता
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
                  onClick={() => setActiveTab('address')} 
                  className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-colors text-sm ${
                    activeTab === 'address' 
                      ? 'text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={activeTab === 'address' ? {backgroundColor: '#102463'} : {}}
                >
                  पता
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

              {/* Right side - Empty space for consistency */}
              <div className="flex-1 sm:flex-1 flex justify-end w-full sm:w-auto">
              </div>
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
                    <div className="text-white p-2 sm:p-4 flex items-center justify-between" style={{ backgroundColor: '#102463' }}>
                      <h2 className="font-semibold text-sm sm:text-base">बिल्डिंग प्रमुख</h2>
                    {/*   <button
                        onClick={handleAddBuildingHead}
                        className="bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                        style={{ color: '#102463' }}
                      >
                        जोड़ें
                      </button> */}
                    </div>
                
                    <div className="p-2 sm:p-4">
                      {current && current.name && current.name !== '—' ? (
                        shouldShowBuildingPramukh ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                              {renderProfileImage(current, 'w-8 h-8 sm:w-12 sm:h-12')}
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-800 text-xs sm:text-base truncate">{current.name}</h3>
                                {current.phoneNumber && (
                                  <p className="text-blue-600 text-[10px] sm:text-sm truncate">{current.phoneNumber}</p>
                                )}
                                <p className="text-gray-600 text-[10px] sm:text-sm truncate">{current.designation || 'बिल्डिंग प्रमुख'}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                {current.phoneNumber && (
                                  <button
                                    onClick={() => handleCall(current.phoneNumber)}
                                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                                    style={{backgroundColor: '#103a94'}}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                                  >
                                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => openBuildingHeadDetail(current)}
                                  className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                                  type="button"
                                >
                                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                              </div>
                              <button 
                                onClick={() => {
                                  if (isCurrentActive && hasValidLastLogin) {
                                    setSelectedUserForLastLogin({
                                      name: current.name,
                                      lastLogin: currentLastLoginRaw
                                    })
                                    setShowLastLoginModal(true)
                                  }
                                }}
                                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-medium flex-shrink-0 ${
                                  isCurrentActive ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' : 'bg-red-500 text-white'
                                }`}
                              >
                                {currentStatusLabel}
                              </button>
                            </div>
                          </div>
                        ) : searchQuery.trim() ? (
                          <div className="flex flex-col items-center justify-center py-6 sm:py-12">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-6 max-w-md w-full text-center">
                              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <h3 className="text-gray-800 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">No Results Found</h3>
                              <p className="text-gray-600 text-xs sm:text-sm">Try adjusting your search term</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 sm:p-4 text-center text-gray-500">
                            <p className="text-xs sm:text-sm">कोई बिल्डिंग प्रमुख नहीं मिला</p>
                          </div>
                        )
                      ) : (
                        <div className="p-3 sm:p-4 text-center text-gray-500">
                          <p className="text-xs sm:text-sm">कोई बिल्डिंग प्रमुख नहीं मिला</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Co-incharge Section */}
                  <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gray-200 p-2 sm:p-4 flex items-center justify-between border-b border-red-500">
                      <h2 className="font-semibold text-gray-700 text-sm sm:text-base">बिल्डिंग सह इनचार्ज</h2>
                      <button
                        onClick={handleAddCoIncharge}
                        className="bg-blue-800 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium hover:bg-blue-900 transition-colors"
                      >
                        जोड़ें
                      </button>
                    </div>
                
                    <div className="p-2 sm:p-4">
                      {coInchargeData && coInchargeData.length > 0 ? (
                        filteredCoInchargeData.length > 0 ? (
                          <div className="space-y-2 sm:space-y-3">
                            {filteredCoInchargeData.map((person, index) => (
                            <div key={person.id || person.admin_id} className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                {renderProfileImage(person, 'w-8 h-8 sm:w-12 sm:h-12')}
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-800 text-xs sm:text-base truncate">{person.name}</h3>
                                  {person.phone && (
                                    <p className="text-blue-600 text-[10px] sm:text-sm truncate">{person.phone}</p>
                                  )}
                                  <p className="text-gray-600 text-[10px] sm:text-sm truncate">{person.role || person.designation || 'बिल्डिंग सह इनचार्ज'}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  {person.phone && (
                                    <button
                                      onClick={() => handleCall(person.phone)}
                                      className="w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                                      style={{backgroundColor: '#103a94'}}
                                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                                      onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                                    >
                                      <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedCoIncharge(person)
                                      setShowCoInchargeDetailModal(true)
                                    }}
                                    className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                                  >
                                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                  </button>
                                </div>
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
                                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-medium flex-shrink-0 ${
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
                          <div className="flex flex-col items-center justify-center py-6 sm:py-12">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-6 max-w-md w-full text-center">
                              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <h3 className="text-gray-800 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">No Results Found</h3>
                              <p className="text-gray-600 text-xs sm:text-sm">Try adjusting your search term</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="p-3 sm:p-4 text-center text-gray-500">
                          <p className="text-xs sm:text-sm">कोई बिल्डिंग सह इनचार्ज नहीं मिला</p>
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
                    {/* Regular Addresses Section - White Cards */}
                    {addresses && addresses.length > 0 && (
                      filteredAddresses.length > 0 ? (
                        <div className="space-y-2">
                          {filteredAddresses.map((addrItem, index) => {
                          // Handle both string (backward compatibility) and object format
                          const address = typeof addrItem === 'string' ? addrItem : addrItem.address
                          const voterCount = typeof addrItem === 'string' 
                            ? voters.filter(v => v && v.eng_localityid && String(v.eng_localityid).trim() === String(address).trim()).length
                            : (addrItem.voterCount || 0)
                          
                          return (
                            <div 
                              key={`regular-${index}`}
                              className="bg-white rounded-md p-3 hover:bg-gray-50 transition-colors shadow-sm"
                              onClick={() => setSelectedAddress(address)}
                            >
                              <div className="flex items-start">
                                <span className="text-gray-900 font-bold text-sm mr-2 flex-shrink-0">{index + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 font-medium text-xs leading-relaxed uppercase break-words">
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
                      ) : searchQuery.trim() ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-gray-800 font-semibold mb-2">No Results Found</h3>
                            <p className="text-gray-600 text-sm">Try adjusting your search term</p>
                          </div>
                        </div>
                      ) : null
                    )}

                    {/* Re Development Section */}
                    {reDevelopmentAddresses && reDevelopmentAddresses.length > 0 && (
                      filteredReDevelopmentAddresses.length > 0 ? (
                        <div className="space-y-2">
                          {/* Re Development Header */}
                          <div className="px-4 py-2">
                            <h3 className="font-bold text-black text-sm">Re Development</h3>
                          </div>

                          {/* Re Development Address Items - Light Gray Cards */}
                          {filteredReDevelopmentAddresses.map((addrData, index) => {
                          // Use voterCount from addressData (result3), fallback to counting from voters if not available
                          const voterCount = addrData.voterCount || voters.filter(v => v && v.eng_localityid && String(v.eng_localityid).trim() === String(addrData.address).trim()).length
                          
                          return (
                            <div 
                              key={`redev-${index}`}
                              className="bg-gray-200 rounded-md p-3 cursor-pointer hover:bg-gray-300 transition-colors"
                              onClick={() => setSelectedAddress(addrData.address)}
                            >
                              <div className="flex items-start">
                                <span className="text-gray-900 font-bold text-sm mr-2 flex-shrink-0">{index + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 font-medium text-xs leading-relaxed uppercase break-words">
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
                            )
                          })}
                        </div>
                      ) : searchQuery.trim() ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-gray-800 font-semibold mb-2">No Results Found</h3>
                            <p className="text-gray-600 text-sm">Try adjusting your search term</p>
                          </div>
                        </div>
                      ) : null
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
                  {/* Voter Statistics */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <button onClick={() => setSelectedFilter('total')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${selectedFilter === 'total' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-[10px] sm:text-xs font-bold text-gray-800">टोटल</div>
                      <div className="text-sm sm:text-lg font-bold text-gray-900">{totalVoters}</div>
                    </button>
                    <button onClick={() => setSelectedFilter('visited')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${selectedFilter === 'visited' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-[10px] sm:text-xs font-bold text-gray-800">मुलाकात</div>
                      <div className="text-sm sm:text-lg font-bold text-gray-900">{visitedVoters}</div>
                    </button>
                    <button onClick={() => setSelectedFilter('unavailable')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${selectedFilter === 'unavailable' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-[10px] sm:text-xs font-bold text-gray-800">अनुपलब्ध</div>
                      <div className="text-sm sm:text-lg font-bold text-gray-900">{unavailableVoters}</div>
                    </button>
                    <button onClick={() => setSelectedFilter('remaining')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${selectedFilter === 'remaining' ? 'ring-2 ring-blue-900' : ''}`}>
                      <div className="text-[10px] sm:text-xs font-bold text-gray-800">मुलाकात बाकी</div>
                      <div className="text-sm sm:text-lg font-bold text-gray-900">{remainingVisits}</div>
                    </button>
                  </div>

              {/* Address Dropdown */}
              {addresses.length > 0 && (
                <div className="bg-white rounded-lg px-1.5 sm:px-2 py-1 sm:py-2 flex items-center justify-between gap-1 sm:gap-2">
                  <select 
                    value={selectedAddress} 
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="bg-transparent text-gray-700 font-medium focus:outline-none text-[10px] sm:text-xs flex-1 min-w-0 truncate"
                  >
                    <option value="">पता (All)</option>
                    {addresses.map((addrItem, index) => {
                      // Handle both string (backward compatibility) and object format
                      const address = typeof addrItem === 'string' ? addrItem : addrItem.address
                      return (
                        <option key={index} value={address}>
                          {address.length > 50 ? `${address.substring(0, 50)}...` : address}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Voter List */}
              {filteredVoters.length === 0 ? (
                <div className="text-center text-gray-600 py-6 sm:py-8">
                  <div className="text-gray-400 text-3xl sm:text-4xl mb-1 sm:mb-2">👥</div>
                  <p className="text-xs sm:text-sm">No voters found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {filteredVoters.map((voter, index) => {
                    const surveyBy = (voter.survey_by || '').toString().trim()
                    const shouldShowSurveySection = surveyBy !== ' - ' && surveyBy !== '-'
                    const voterStatus = getVoterStatus(voter)
                    
                    return (
                    <div key={voter.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Survey Taker Section - Green Header Bar */}
                      {shouldShowSurveySection && (
                        <div className="bg-green-100 px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between">
                          <div className="text-black text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
                            सर्वे लेनेवाला: {surveyBy}
                          </div>
                          {voterStatus.text && (
                            <span className={`${voterStatus.color} text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ml-2`}>
                              {voterStatus.text}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm sm:text-lg font-bold text-gray-900 truncate flex-1 min-w-0">
                            {index + 1}. {voter.eng_f_name} {voter.f_eng_surname}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex flex-wrap gap-x-2">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
                            <span className="text-gray-900 break-words flex-1 min-w-0">{voter.eng_m_name}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-2 gap-y-1">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पता:</span>
                            <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-2">
                              <span className="text-gray-900 break-words flex-1">{voter.eng_localityid}</span>
                             {/*  <button className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              </button> */}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-2">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">क्रमांक:</span>
                            <span className="text-gray-900 break-words flex-1 min-w-0">{voter.slnoinpart}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-2 gap-y-1">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
                            <div className="flex items-center min-w-0">
                              <span className="text-gray-900 truncate">{voter.contact_no || '-'}</span>
                            {/*   <button className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                              </button> */}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-2">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</span>
                            <span className="text-gray-900 break-words flex-1 min-w-0">{voter.idcard_no}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-2">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
                            <span className="text-gray-900 break-words flex-1 min-w-0">{voter.booth_no}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-2">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
                            <span className="text-gray-900 break-words flex-1 min-w-0">{voter.eng_house_no || '-'}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-2">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
                            <span className="text-gray-900 break-words flex-1 min-w-0">{voter.eng_polling_location}</span>
                          </div>

                          <div className="flex flex-wrap gap-x-2">
                            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">दूसरा पता:</span>
                            <span className="text-gray-900 break-words flex-1 min-w-0">{voter.add_add || '-'}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-2 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-100">
                          <button 
                            onClick={() => handleCall(voter.contact_no)}
                            className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                          >
                            <div 
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                              style={{backgroundColor: '#103a94'}}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <span className="text-[10px] sm:text-xs text-gray-600">Call</span>
                          </button>

                        {/*   <CheckButton
                            voter={voter}
                            onShowModal={() => setShowModal(true)}
                          /> */}

                          <button 
                            onClick={() => handleFamily(voter)}
                            className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                          >
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2v6h2z"/>
                              </svg>
                            </div>
                            <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
                </>
              )}
            </div>
          )}

          {/* Footer with dynamic counts */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 shadow-lg space-y-1.5 sm:space-y-0" style={{backgroundColor: '#102463'}}>
            <div className="px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg" style={{backgroundColor: '#ffffff'}}>
              <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6" style={{color: '#102463'}}>
                {activeTab === 'address' ? (
                  <div className="text-center">
                    <div className="text-[10px] sm:text-xs">पता :  {addresses.length + reDevelopmentAddresses.length}</div>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">
                        {activeTab === 'organization' && (current && current.name && current.name !== '—' ? 1 : 0)}
                        {activeTab === 'voter' && voters.length}
                      </div>
                      <div className="text-[10px] sm:text-xs">
                        {activeTab === 'organization' && 'बिल्डिंग प्रमुख'}
                        {activeTab === 'voter' && 'मतदाता'}
                      </div>
                    </div>
                    {activeTab === 'organization' && (
                      <div className="text-center">
                        <div className="text-sm sm:text-base md:text-lg font-bold">{coInchargeData.length}</div>
                        <div className="text-[10px] sm:text-xs">बिल्डिंग सह इनचार्ज</div>
                      </div>
                    )}
                  </>
                )}
                {activeTab === 'voter' && (
                  <>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">{visitedVoters}</div>
                      <div className="text-[10px] sm:text-xs">मुलाकात</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">{remainingVisits}</div>
                      <div className="text-[10px] sm:text-xs">मुलाकात बाकी</div>
                    </div>
                  </>
                )}
              </div>
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

      {showCoInchargeDetailModal && (
        <ContactDetailModal
          person={selectedCoIncharge}
          onClose={handleCloseCoInchargeDetailModal}
          onCall={(person, phone) => handleCall(phone)}
          onEdit={handleEditCoIncharge}
          onDelete={handleDeleteCoIncharge}
          title="Building Co-Incharge"
          roleLabel="Building Co-Incharge"
          phoneKeys={['phone', 'phoneNumber', 'mobile', 'mobileNo']}
        />
      )}
      {showBuildingHeadDetailModal && (
        <ContactDetailModal
          person={selectedBuildingHead}
          onClose={handleCloseBuildingHeadDetailModal}
          onCall={(person, phone) => handleCall(phone)}
          onEdit={handleEditBuildingHead}
          onDelete={handleDeleteBuildingHead}
          title="Building Pramukh"
          roleLabel="Building Pramukh"
          phoneKeys={['phoneNumber', 'mobileNo', 'mobile', 'phone']}
        />
      )}
      
      {/* Validation Modal */}
      <ValidationModal
        isOpen={showModal}
        message="मोबाइल नंबर नहीं मिला"
        onClose={() => setShowModal(false)}
        okText="Ok"
      />
    </>
  )
}

export default BuildingDetailSlide


