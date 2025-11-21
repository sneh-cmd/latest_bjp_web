import React, { useState, useEffect, useMemo } from 'react'
import AddBoothHeadModal from '../modals/AddBoothHeadModal.jsx'
import AddCoInchargeModal from '../modals/AddCoInchargeModal.jsx'
import ContactDetailModal from '../modals/ContactDetailModal.jsx'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal.jsx'
import LastLoginModal from '../modals/LastLoginModal.jsx'
import CheckButton from '../common/CheckButton.jsx'
import ValidationModal from '../modals/ValidationModal.jsx'
import PageHeader from '../common/PageHeader.jsx'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const normalizeMobileNumber = (value) => {
  if (!value) return ''
  const digits = value.toString().replace(/\D/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

const collectMobilesFromBoothList = (boothList = []) => {
  if (!Array.isArray(boothList)) return []
  const numbers = new Set()
  boothList.forEach((booth) => {
    ;[
      booth?.mobileNo,
      booth?.mobile_no,
      booth?.mobile,
      booth?.phoneNumber,
      booth?.phone
    ].forEach((candidate) => {
      const normalized = normalizeMobileNumber(candidate)
      if (normalized) numbers.add(normalized)
    })
    if (Array.isArray(booth?.headDetails)) {
      booth.headDetails.forEach((head) => {
        ;[
          head?.mobile,
          head?.mobileNo,
          head?.mobile_no,
          head?.phone,
          head?.phoneNumber
        ].forEach((candidate) => {
          const normalized = normalizeMobileNumber(candidate)
          if (normalized) numbers.add(normalized)
        })
      })
    }
  })
  return Array.from(numbers)
}

const BoothDetailSlide = ({ navigation, boothData, boothId }) => {
  const { navigate, state } = navigation
  const [isVisible, setIsVisible] = useState(false)
  // If coming from shakti-kendra-detail, show only voter tab
  const isFromShaktiKendra = state?.from === 'shakti-kendra-detail'
  const [activeTab, setActiveTab] = useState(isFromShaktiKendra ? 'voter' : 'organization') // 'organization' or 'voter'
  const [boothHeadData, setBoothHeadData] = useState([])
  const [coInchargeData, setCoInchargeData] = useState([])
  const [globalBoothHeadMobiles, setGlobalBoothHeadMobiles] = useState([])
  const [voterData, setVoterData] = useState([])
  const [voterStats, setVoterStats] = useState({
    total: 0,
    visits: 0,
    visitsRemaining: 0,
    unavailable: 0
  })
  const [selectedSurname, setSelectedSurname] = useState('')
  const [visitFilter, setVisitFilter] = useState('all') // 'all' | 'visited' | 'unavailable' | 'remaining'
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddBoothHeadModal, setShowAddBoothHeadModal] = useState(false)
  const [showAddCoInchargeModal, setShowAddCoInchargeModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [personToDelete, setPersonToDelete] = useState(null)
  const [personToEdit, setPersonToEdit] = useState(null)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
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

  // Function to fetch booth data when boothData is not available (e.g., on page refresh)
  const fetchBoothDataFromAPI = async (boothNumber) => {
    try {
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      console.log('Fetching booth data for booth:', boothNumber)
      
      // Get booth data from displayBoothPramukh API
      const boothList = await apiService.displayBoothPramukh(panelApiUrl)
      const boothInfo = boothList.find(booth => parseInt(booth.boothNo) === parseInt(boothNumber))
      
      if (boothInfo) {
        return {
          id: parseInt(boothInfo.boothNo),
          boothNumber: parseInt(boothInfo.boothNo),
          voters: boothInfo.voterCount || 0,
          heads: boothInfo.totalBoothPramukh || 0,
          assigned: (boothInfo.totalBoothPramukh || 0) > 0,
          profileImage: boothInfo.photoPath || null,
          photoPath: boothInfo.photoPath || null,
          isPhoto: Boolean(boothInfo.photoPath && boothInfo.photoPath.trim() !== ''),
          name: boothInfo.totalBoothPramukh > 0 ? `Booth Head ${boothInfo.boothNo}` : 'Unassigned',
          phoneNumber: boothInfo.mobileNo || '',
          status: (boothInfo.totalBoothPramukh || 0) > 0 ? 'active' : 'inactive'
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching booth data:', error)
      return null
    }
  }

  const handlefetchsangathanData = async () => {
    try {
      setIsLoading(true)
      // Get panel API URL from localStorage or use default
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Use boothData.boothNumber if available, otherwise use boothId from URL
      const boothNumber = boothData?.boothNumber || boothId || 1
      
      const boothPramukhListPromise = apiService
        .displayBoothPramukh(panelApiUrl)
        .then((list) => (Array.isArray(list) ? list : []))
        .catch((error) => {
          console.error('Error fetching global booth pramukh list:', error)
          return []
        })

      const [voters, boothPramukhCadre, boothPramukhList] = await Promise.all([
        apiService.displayBoothPramukhWiseVoter(boothNumber, panelApiUrl),
        apiService.displayBoothPramukhCadre(boothNumber, panelApiUrl),
        boothPramukhListPromise
      ])

      if (boothPramukhList && Array.isArray(boothPramukhList)) {
        setGlobalBoothHeadMobiles(collectMobilesFromBoothList(boothPramukhList))
      } else {
        setGlobalBoothHeadMobiles([])
      }
      
      // Update state with fetched data
      if (voters && Array.isArray(voters)) {
        // The new API already returns normalized data, so we can use it directly
        setVoterData(voters)
        
        // Count visited: voter_available === 1 = मुलाकात
        const visitedCount = voters.filter(v => {
          return v.voter_available === 1 || v.voter_available === '1'
        }).length || 0
        
        // Count unavailable: voter_available === 0 and not_available_status is not empty = अनुपलब्ध
        const unavailableCount = voters.filter(v => {
          const voterAvailable = v.voter_available === 0 || v.voter_available === '0'
          const notAvailableStatus = (v.not_available_status || '').toString().trim()
          return voterAvailable && notAvailableStatus !== ''
        }).length || 0
        
        // Count remaining: 
        // - voter_available === 0 and not_available_status is empty = मुलाकात बाकी
        // - voter_available is null/undefined and not_available_status is empty = मुलाकात बाकी
        // - voter_available field doesn't exist and not_available_status is empty = मुलाकात बाकी
        const remainingCount = voters.filter(v => {
          const voterAvailable = v.voter_available
          const notAvailableStatus = (v.not_available_status || '').toString().trim()
          
          // If voter_available is 1, it's visited, not remaining
          if (voterAvailable === 1 || voterAvailable === '1') {
            return false
          }
          
          // If not_available_status has value, it's unavailable, not remaining
          if (notAvailableStatus !== '') {
            return false
          }
          
          // Remaining: voter_available is 0, null, undefined, empty string, or doesn't exist AND not_available_status is empty
          const isNotVisited = !(voterAvailable === 1 || voterAvailable === '1')
          const isNotUnavailable = notAvailableStatus === ''
          
          // If voter_available doesn't exist at all, check if voter_status1 is empty (old logic fallback)
          if (voterAvailable === null || voterAvailable === undefined || voterAvailable === '') {
            const voterStatus1 = (v.voter_status1 || '').toString().trim()
            // If voter_status1 is also empty, it's remaining
            return voterStatus1 === '' && isNotUnavailable
          }
          
          return (voterAvailable === 0 || voterAvailable === '0') && isNotUnavailable
        }).length || 0
        
        // Fallback: Calculate remaining as total - visited - unavailable
        // Use this if remainingCount seems wrong (too low compared to total)
        const calculatedRemaining = Math.max(0, voters.length - visitedCount - unavailableCount)
        
        // Use calculated remaining if:
        // 1. remainingCount is 0 but we have voters (likely voter_available field missing)
        // 2. calculatedRemaining makes more sense (positive value)
        const finalRemainingCount = (remainingCount === 0 && voters.length > 0 && calculatedRemaining > 0) 
          ? calculatedRemaining 
          : remainingCount
        
        setVoterStats({
          total: voters.length,
          visits: visitedCount, // मुलाकात - when voter_available === 1
          unavailable: unavailableCount, // अनुपलब्ध - when voter_available === 0 and not_available_status is not empty
          visitsRemaining: finalRemainingCount // मुलाकात बाकी - when voter_available === 0 and not_available_status is empty
        })
      }
      
      if (boothPramukhCadre && Array.isArray(boothPramukhCadre)) {
      
        // Update booth head data with real API data
        // Filter by type='BP' and sub_type='BP' OR designation='बुथ प्रमुख' for Booth Head
        const transformedBoothHeadData = boothPramukhCadre
          .filter(cadre => {
            // Check sub_type (both snake_case and camelCase)
            const subType = cadre.sub_type || cadre.subType || ''
            const type = cadre.type || ''
            const designation = cadre.designation || cadre.role || ''
            
            // Booth Head: type='BP' and (sub_type='BP' OR sub_type is empty/null)
            const isBoothHeadByType = type === 'BP' && (subType === 'BP' || !subType || subType === '')
            
            // Check by designation/role
            const isBoothHeadByRole = designation === 'बुथ प्रमुख' || designation === 'Booth Pramukh' || 
                                    designation === 'बूथ प्रमुख' || cadre.role === 'बुथ प्रमुख'
            
            // Explicitly exclude Co Incharge
            const isNotCoIncharge = subType !== 'BS' && 
                                   designation !== 'बुथ सह इनचार्ज' && 
                                   designation !== 'Co Incharge' &&
                                   cadre.role !== 'बुथ सह इनचार्ज'
            
            return (isBoothHeadByType || isBoothHeadByRole) && isNotCoIncharge
          })
          .map(cadre => ({
            id: cadre.id || cadre.admin_id || cadre.adminId || cadre.cadre_id,
            name: cadre.name || cadre.full_name,
            phone: cadre.phone || cadre.mobile || cadre.mobile_no || cadre.mobileNo || cadre.phoneNumber,
            role: cadre.role || cadre.designation || 'बुथ प्रमुख',
            status: cadre.status || (cadre.lastLogin || cadre.last_login ? 'active' : 'inactive'),
            profileImage: cadre.profileImage || cadre.photo_path || cadre.photoPath,
            lastLogin: cadre.lastLogin || cadre.last_login || '',
            last_login: cadre.lastLogin || cadre.last_login || ''
          }))
        
        // Always set the data, even if empty (to clear previous data)
        setBoothHeadData(transformedBoothHeadData)
        console.log('Transformed Booth Head Data:', transformedBoothHeadData)
        
        // Update co-incharge data with real API data
        // Filter by type='BP' and sub_type='BS' OR designation='बुथ सह इनचार्ज' for Co Incharge
        const transformedCoInchargeData = boothPramukhCadre
          .filter(cadre => {
            // Check sub_type (both snake_case and camelCase)
            const subType = cadre.sub_type || cadre.subType || ''
            const type = cadre.type || ''
            const designation = cadre.designation || cadre.role || ''
            
            // Co Incharge: type='BP' and sub_type='BS'
            const isCoInchargeByType = type === 'BP' && subType === 'BS'
            
            // Check by designation/role
            const isCoInchargeByRole = designation === 'बुथ सह इनचार्ज' || designation === 'Co Incharge' ||
                                     cadre.role === 'बुथ सह इनचार्ज' || cadre.role === 'Co Incharge'
            
            return isCoInchargeByType || isCoInchargeByRole
          })
          .map(cadre => ({
            id: cadre.id || cadre.admin_id || cadre.adminId || cadre.cadre_id,
            name: cadre.name || cadre.full_name,
            phone: cadre.phone || cadre.mobile || cadre.mobile_no || cadre.mobileNo || cadre.phoneNumber,
            role: cadre.role || cadre.designation || 'बुथ सह इनचार्ज',
            status: cadre.status || (cadre.lastLogin || cadre.last_login ? 'active' : 'inactive'),
            profileImage: cadre.profileImage || cadre.photo_path || cadre.photoPath
          }))
        
        // Always set the data, even if empty (to clear previous data)
        setCoInchargeData(transformedCoInchargeData)
        console.log('Transformed Co-Incharge Data:', transformedCoInchargeData)
      } else {
        // Clear data if API returns empty or invalid response
        setBoothHeadData([])
        setCoInchargeData([])
      }
      
    } catch (error) {
      console.error('Error fetching sangathan data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log("Booth Data: ", boothData)
    console.log("Booth ID from URL: ", boothId)
    console.log("Navigation object: ", navigation)
    
    // If boothData is available, use it directly
    if (boothData) {
      console.log("Using boothData directly")
      handlefetchsangathanData()
    } 
    // If boothData is not available but boothId is, fetch booth data first
    else if (boothId) {
      console.log("Fetching booth data using boothId:", boothId)
      const fetchAndSetBoothData = async () => {
        const fetchedBoothData = await fetchBoothDataFromAPI(boothId)
        if (fetchedBoothData) {
          console.log("Fetched booth data:", fetchedBoothData)
          // Update the component state to reflect the fetched booth data
          // We'll use the boothId for API calls since boothData is not available
          handlefetchsangathanData()
        }
      }
      fetchAndSetBoothData()
    } else {
      console.log("No boothData or boothId available")
    }
  }, [boothData, boothId])


  const handleBack = () => {
     setIsVisible(false)
     setTimeout(() => {
       // Determine where to return based on navigation state metadata
       let returnPath = state?.returnPath
       let navigationState = state?.originState || null
       if (!returnPath) {
         if (state?.from === 'shakti-kendra-detail') {
           returnPath = '/shakti-kendra-pramukh'
         } else if (state?.from === 'booth-pramukh') {
           returnPath = '/booth-pramukh'
         }
       }
 
       if (returnPath) {
         navigate(returnPath, navigationState)
       } else {
         // Fallback to booth list if origin is unknown
         navigate('/booth-pramukh')
       }
     }, 300)
   }

  const handleCall = (person) => {
    if (person.phone) {
      window.open(`tel:${person.phone}`, '_self')
    }
  }

  const handleAddBoothHead = () => {
    setPersonToEdit(null)
    setShowAddBoothHeadModal(true)
  }

  const handleSaveBoothHead = async (boothHeadData) => {
    console.log('Booth head saved:', boothHeadData)
    // Refresh data from API after successful save
    await handlefetchsangathanData()
  }

  const handleAddCoIncharge = () => {
    setPersonToEdit(null)
    setShowAddCoInchargeModal(true)
  }

  const handleSaveCoIncharge = async (coInchargeData) => {
    console.log('Co-incharge saved:', coInchargeData)
    // Refresh data from API after successful save
    await handlefetchsangathanData()
  }

  const handleViewDetails = (person) => {
    setSelectedPerson(person)
    setShowDetailModal(true)
  }

  const handleToggleStatus = async (personId) => {
    try {
      setIsLoading(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Find the person in either boothHeadData or coInchargeData
      const person = [...boothHeadData, ...coInchargeData].find(p => p.id === personId)
      if (!person) {
        alert('Person not found')
        return
      }

      // Determine type and sub_type based on role
      const isBoothHead = person.role === 'बुथ प्रमुख' || person.role === 'Booth Pramukh' || person.role === 'बूथ प्रमुख'
      const type = 'BP'
      const subType = isBoothHead ? 'BP' : 'BS'

      // Toggle status (active -> inactive, inactive -> active)
      const newStatus = person.status === 'active' ? 'inactive' : 'active'
      
      // Prepare payload for update_admin API
      const payload = {
        admin_id: personId,
        type: type,
        sub_type: subType,
        name: person.name || '',
        mobile_no: person.phone || '',
        photo: '',
        base64: '',
        idcard_no: '',
        booth_javabdari: (boothData?.boothNumber || boothId || 1).toString(),
        page_javabdari: '',
        add: '',
        modify_by: '1',
        temp_status: newStatus === 'active' ? '1' : '0' // Assuming temp_status controls active/inactive
      }

      // Call the update API
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh data
      await handlefetchsangathanData()
      
      // Update selected person if modal is open
      if (selectedPerson && selectedPerson.id === personId) {
        setSelectedPerson({ ...selectedPerson, status: newStatus })
      }
      
      alert(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (!selectedPerson) return
    
    // Determine if it's booth head or co-incharge based on role
    const isBoothHead = selectedPerson.role === 'बुथ प्रमुख' || 
                        selectedPerson.role === 'Booth Pramukh' || 
                        selectedPerson.role === 'बूथ प्रमुख'
    
    setPersonToEdit(selectedPerson)
    setShowDetailModal(false)
    
    if (isBoothHead) {
      setShowAddBoothHeadModal(true)
    } else {
      setShowAddCoInchargeModal(true)
    }
  }

  const handleDeleteClick = () => {
    setPersonToDelete(selectedPerson)
    setShowDeleteConfirm(true)
    setShowDetailModal(false)
  }

  const handleDeleteConfirm = async () => {
    if (!personToDelete) return
    
    try {
      setIsLoading(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Determine type and sub_type based on role
      const isBoothHead = personToDelete.role === 'बुथ प्रमुख' || 
                          personToDelete.role === 'Booth Pramukh' || 
                          personToDelete.role === 'बूथ प्रमुख'
      const type = 'BP'
      const subType = isBoothHead ? 'BP' : 'BS'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: personToDelete.id,
        type: 'D',
        sub_type: 'D',
        name: personToDelete.name || '',
        mobile_no: personToDelete.phone || '',
        photo: '',
        base64: '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh data from API after successful deletion
      await handlefetchsangathanData()
      
      setShowDeleteConfirm(false)
      setPersonToDelete(null)
      
    } catch (error) {
      console.error('Error deleting person:', error)
      alert('Failed to delete person')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setPersonToDelete(null)
  }

  // Voter-related handlers
  const handleVoterCall = (voter) => {
    const phone = voter.mobile || voter.mobile_no || voter.phone
    const sanitized = (phone || '').toString().trim()
    
    // Check if mobile number exists and is valid (not empty, not '-', not 'N/A', and length >= 10)
    if (sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10) {
      window.open(`tel:${sanitized}`, '_self')
    } else {
      // Show modal if mobile number not found or invalid
      setShowModal(true)
    }
  }


  const handleVoterFamily = (voter) => { 
    if (!voter || !voter.id) return
    navigate('/family-screen', {
      voterId: voter.id,
      name: voter.name,
      boothNumber: voter.boothNumber
    })
  }

  const handleSurnameFilter = (surname) => {
    setSelectedSurname(surname)
  }

  // Get unique surnames for dropdown
  const uniqueSurnames = [...new Set(voterData.map(voter => (voter.surname || voter.last_name || '').trim()).filter(Boolean))]

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
  // Remaining: voter_available is 0, null, undefined, or empty AND not_available_status is empty
  // This logic must match the stats calculation logic exactly
  const isVoterRemaining = (voter) => {
    const voterAvailable = voter.voter_available
    const notAvailableStatus = (voter.not_available_status || '').toString().trim()
    
    // If voter_available is 1, it's visited, not remaining
    if (voterAvailable === 1 || voterAvailable === '1') {
      return false
    }
    
    // If not_available_status has value, it's unavailable, not remaining
    if (notAvailableStatus !== '') {
      return false
    }
    
    // If voter_available doesn't exist at all (null, undefined, empty string), 
    // check voter_status1 as fallback (old logic)
    if (voterAvailable === null || voterAvailable === undefined || voterAvailable === '') {
      const voterStatus1 = (voter.voter_status1 || '').toString().trim()
      // If voter_status1 is also empty, it's remaining
      // Also check if it's not visited and not unavailable
      const isNotVisited = !(voterAvailable === 1 || voterAvailable === '1')
      const isNotUnavailable = notAvailableStatus === ''
      return voterStatus1 === '' && isNotVisited && isNotUnavailable
    }
    
    // Remaining: voter_available is 0 or '0' AND not_available_status is empty
    // Also handle cases where voter_available might be false or other falsy values
    const isNotVisited = !(voterAvailable === 1 || voterAvailable === '1')
    const isNotUnavailable = notAvailableStatus === ''
    
    // If voter_available is explicitly 0 or '0', it's remaining if not unavailable
    if (voterAvailable === 0 || voterAvailable === '0') {
      return isNotUnavailable
    }
    
    // For any other value (including false, null after check, etc.), 
    // if it's not visited and not unavailable, consider it remaining
    return isNotVisited && isNotUnavailable
  }

  // Filter booth head data based on search query
  const filteredBoothHeadData = boothHeadData.filter(person => {
    if (!searchQuery.trim()) return true
    return (
      person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone?.includes(searchQuery) ||
      person.role?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const filteredCoInchargeData = coInchargeData.filter(person => {
    if (!searchQuery.trim()) return true
    return (
      person.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone?.includes(searchQuery) ||
      person.role?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const boothHeadMobileNumbers = useMemo(() => {
    const numbers = new Set()
    ;(boothHeadData || []).forEach(person => {
      const normalized = normalizeMobileNumber(
        person.phone ||
        person.mobile ||
        person.mobileNo ||
        person.mobile_no ||
        person.phoneNumber
      )
      if (normalized) numbers.add(normalized)
    })
    return Array.from(numbers)
  }, [boothHeadData])

  // Filter voters by surname, visit status, and search query
  const filteredVoters = voterData.filter(voter => {
    const surnameMatches = selectedSurname
      ? (voter.surname || voter.last_name) === selectedSurname
      : true
    
    // Apply visit filter based on voter_available and not_available_status
    // This logic must match the stats calculation logic exactly
    let visitMatches = true
    if (visitFilter === 'visited') {
      visitMatches = isVoterVisited(voter)
    } else if (visitFilter === 'unavailable') {
      visitMatches = isVoterUnavailable(voter)
    } else if (visitFilter === 'remaining') {
      // For remaining, use the exact same logic as stats calculation (lines 116-142)
      // This ensures filter results match the displayed stats count
      const voterAvailable = voter.voter_available
      const notAvailableStatus = (voter.not_available_status || '').toString().trim()
      
      // If voter_available is 1, it's visited, not remaining
      if (voterAvailable === 1 || voterAvailable === '1') {
        visitMatches = false
      }
      // If not_available_status has value, it's unavailable, not remaining
      else if (notAvailableStatus !== '') {
        visitMatches = false
      }
      // If voter_available is null/undefined/empty, check voter_status1 as fallback
      else if (voterAvailable === null || voterAvailable === undefined || voterAvailable === '') {
        const voterStatus1 = (voter.voter_status1 || '').toString().trim()
        const isNotUnavailable = notAvailableStatus === ''
        // If voter_status1 is empty and not unavailable, it's remaining
        visitMatches = voterStatus1 === '' && isNotUnavailable
      }
      // If voter_available is 0 or '0' and not_available_status is empty, it's remaining
      else if (voterAvailable === 0 || voterAvailable === '0') {
        const isNotUnavailable = notAvailableStatus === ''
        visitMatches = isNotUnavailable
      }
      // For any other case (including missing field), if not visited and not unavailable, it's remaining
      else {
        const isNotVisited = !(voterAvailable === 1 || voterAvailable === '1')
        const isNotUnavailable = notAvailableStatus === ''
        visitMatches = isNotVisited && isNotUnavailable
      }
    }
    // If visitFilter === 'all', visitMatches remains true
    
    // Apply search query filter
    const searchMatches = !searchQuery.trim() || (
      voter.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.fatherHusband?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.mobile?.includes(searchQuery) ||
      voter.voterId?.includes(searchQuery) ||
      voter.serialNo?.toString().includes(searchQuery) ||
      voter.boothNo?.toString().includes(searchQuery)
    )
    
    return surnameMatches && visitMatches && searchMatches
  })

  const coInchargeMobileNumbers = useMemo(() => {
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

  const combinedBoothHeadMobiles = useMemo(() => {
    return Array.from(new Set([...(boothHeadMobileNumbers || []), ...(globalBoothHeadMobiles || [])]))
  }, [boothHeadMobileNumbers, globalBoothHeadMobiles])

  return (
    <>
      <AddBoothHeadModal
        isOpen={showAddBoothHeadModal}
        onClose={() => {
          setShowAddBoothHeadModal(false)
          setPersonToEdit(null)
        }}
        boothNumber={boothData?.boothNumber || boothId || 1}
        onSave={handleSaveBoothHead}
        editData={personToEdit}
        mode={personToEdit ? 'edit' : 'create'}
        existingMobiles={combinedBoothHeadMobiles}
        duplicateContextLabel="बूथ प्रमुख"
      />
      
      <AddCoInchargeModal
        isOpen={showAddCoInchargeModal}
        onClose={() => {
          setShowAddCoInchargeModal(false)
          setPersonToEdit(null)
        }}
        boothNumber={boothData?.boothNumber || boothId || 1}
        onSave={handleSaveCoIncharge}
        editData={personToEdit}
        mode={personToEdit ? 'edit' : 'create'}
        existingMobiles={coInchargeMobileNumbers}
        duplicateContextLabel="बुथ सह इनचार्ज"
      />

      {showDetailModal && (
        <ContactDetailModal
          person={selectedPerson}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedPerson(null)
          }}
          onCall={(person) => handleCall(person)}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          title={selectedPerson?.role || 'Booth Pramukh'}
          roleLabel={selectedPerson?.role || 'Booth Pramukh'}
          phoneKeys={['phone', 'phoneNumber', 'mobile', 'mobileNo']}
        />
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        admin={personToDelete}
      />
      
      <div className={`relative w-screen h-screen overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-100"></div>
        
        {/* Main Container */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <PageHeader
            title={`बूथ नं. ${boothData?.boothNumber || boothId || '1'}`}
            onBack={handleBack}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClear={() => setSearchQuery('')}
                />

          {/* Navigation Tabs and Search Bar Section - Hide if coming from shakti-kendra-detail */}
          {!isFromShaktiKendra && (
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
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-100 px-4 py-4" style={{ backgroundColor: '#e5e8ff' }}>
            {isLoading ? (
              <div className="flex-1 px-4 py-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
                  <p className="text-gray-600">डेटा लोड हो रहा है...</p>
                </div>
              </div>
            ) : activeTab === 'organization' && !isFromShaktiKendra ? (
              <div className="space-y-4">
                {/* Booth Head Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-2 sm:p-4 rounded-t-lg" style={{ backgroundColor: '#102463' }}>
                    <h3 className="text-white font-medium text-sm sm:text-base">बूथ प्रमुख</h3>
                    <button
                      onClick={handleAddBoothHead}
                      className="bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                      style={{ color: '#102463' }}
                    >
                      जोड़ें
                    </button>
                  </div>
                  
                  <div className="p-2 sm:p-4">
                    {boothHeadData.length > 0 ? (
                      filteredBoothHeadData.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {filteredBoothHeadData.map((person) => (
                          <div key={person.id} className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              {/* Profile Image */}
                              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                {person.profileImage ? (
                                  <img
                                    src={person.profileImage}
                                    alt={person.name}
                                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                  </svg>
                                )}
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-800 text-xs sm:text-base truncate">{person.name}</h3>
                                <p className="text-blue-600 text-[10px] sm:text-sm truncate">{person.phone}</p>
                                <p className="text-gray-600 text-[10px] sm:text-sm truncate">{person.role}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => handleCall(person)}
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
                                  onClick={() => handleViewDetails(person)}
                                  className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
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
                                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-medium ${
                                  person.status === 'active'
                                    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                                    : 'bg-red-500 text-white'
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
                            <h3 className="text-gray-800 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">No Results Found</h3>
                            <p className="text-gray-600 text-xs sm:text-sm">Try adjusting your search term</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="p-2 sm:p-4 text-center text-gray-500">
                        <p className="text-xs sm:text-sm">कोई बूथ प्रमुख नहीं मिला</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Co-incharge Section */}
                <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-2 sm:p-4 bg-gray-200 rounded-t-lg border-b border-red-500">
                    <h3 className="text-gray-700 font-medium text-sm sm:text-base">बुथ सह इनचार्ज</h3>
                    <button
                      onClick={handleAddCoIncharge}
                      className="bg-blue-800 text-white px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium hover:bg-blue-900 transition-colors"
                    >
                      जोड़ें
                    </button>
                  </div>
                  
                  <div className="p-2 sm:p-4">
                    {coInchargeData.length > 0 ? (
                      filteredCoInchargeData.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {filteredCoInchargeData.map((person) => (
                          <div key={person.id} className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                {person.profileImage ? (
                                  <img
                                    src={person.profileImage}
                                    alt={person.name}
                                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                  </svg>
                                )}
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-800 text-xs sm:text-base truncate">{person.name}</h3>
                                <p className="text-blue-600 text-[10px] sm:text-sm truncate">{person.phone}</p>
                                <p className="text-gray-600 text-[10px] sm:text-sm truncate">{person.role}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => handleCall(person)}
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
                                  onClick={() => handleViewDetails(person)}
                                  className="w-7 h-7 sm:w-10 sm:h-10 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
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
                                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-medium ${
                                  person.status === 'active'
                                    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                                    : 'bg-red-500 text-white'
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
                            <h3 className="text-gray-800 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">No Results Found</h3>
                            <p className="text-gray-600 text-xs sm:text-sm">Try adjusting your search term</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="p-2 sm:p-4 text-center text-gray-500">
                        <p className="text-xs sm:text-sm">कोई बुथ सह इनचार्ज नहीं मिला</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {/* Voter Statistics */}
                <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <button onClick={() => setVisitFilter('all')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'all' ? 'ring-2 ring-blue-900' : ''}`}>
                    <div className="text-[10px] sm:text-xs font-bold text-gray-800">टोटल</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{voterStats.total}</div>
                  </button>
                  <button onClick={() => setVisitFilter('visited')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'visited' ? 'ring-2 ring-blue-900' : ''}`}>
                    <div className="text-[10px] sm:text-xs font-bold text-gray-800">मुलाकात</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{voterStats.visits}</div>
                  </button>
                  <button onClick={() => setVisitFilter('unavailable')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'unavailable' ? 'ring-2 ring-blue-900' : ''}`}>
                    <div className="text-[10px] sm:text-xs font-bold text-gray-800">अनुपलब्ध</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{voterStats.unavailable}</div>
                  </button>
                  <button onClick={() => setVisitFilter('remaining')} className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'remaining' ? 'ring-2 ring-blue-900' : ''}`}>
                    <div className="text-[10px] sm:text-xs font-bold text-gray-800">मुलाकात बाकी</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{voterStats.visitsRemaining}</div>
                  </button>
                </div>

                {/* Surname Filter */}
                <div className="mb-2 sm:mb-4">
                  <select
                    value={selectedSurname}
                    onChange={(e) => handleSurnameFilter(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm sm:text-base"
                  >
                    <option value="">सरनेम (All)</option>
                    {uniqueSurnames.map(surname => (
                      <option key={surname} value={surname}>{surname}</option>
                    ))}
                  </select>
                </div>

                {/* Voter Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {filteredVoters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-12">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-6 max-w-md w-full text-center">
                        <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-gray-800 font-semibold mb-1 sm:mb-2 text-sm sm:text-base">No Results Found</h3>
                        <p className="text-gray-600 text-xs sm:text-sm">Try adjusting your search term or filters</p>
                      </div>
                    </div>
                  ) : (
                    filteredVoters.map((voter) => {
                      // Determine card background color
                      // White if voter_available === 0 AND not_available_status is empty
                      // Sky color otherwise
                      const voterAvailable = voter.voter_available
                      const notAvailableStatus = (voter.not_available_status || '').toString().trim()
                      const isRemaining = (voterAvailable === 0 || voterAvailable === false) && notAvailableStatus === ''
                      const cardBgClass = isRemaining ? 'bg-white' : 'bg-sky-50'
                      
                      return (
                    <div key={voter.id} className={`${cardBgClass} border border-gray-200 rounded-lg p-2 sm:p-4`}>
                      {/* Voter Header */}
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                          {voter.serialNo}. {voter.name}
                        </h3>
                      </div>

                      {/* Voter Details */}
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.fatherHusband}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पता:</span>
                          <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-2">
                            <span className="text-gray-900 break-words flex-1">{voter.address}</span>
                            {/* <button className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                            </button> */}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">क्रमांक:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.serialNo}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
                          <div className="flex items-center min-w-0">
                            <span className="text-gray-900 truncate">{voter.mobile}</span>
                            {/* <button className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button> */}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.voterId}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.boothNo}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.houseNo}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.pollingStation}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">दूसरा पता:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.secondAddress}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-2 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0">
                        <button
                          onClick={() => handleVoterCall(voter)}
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

                        <CheckButton
                          voter={voter}
                          onShowModal={() => setShowModal(true)}
                        />

                        <button
                          onClick={() => handleVoterFamily(voter)}
                          className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H17c-.8 0-1.54.37-2.01.99L14 9l-1.99-2.01A2.5 2.5 0 0 0 10.01 7H9.46c-.8 0-1.54.37-2.01.99L5 9l-1.99-2.01A2.5 2.5 0 0 0 1.01 7H.5L3 14.5V22h2v-6h2v6h2v-6h2v6h2v-6h2v6h2v-6h2v6h2v-6h2v6h2z"/>
                            </svg>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
                        </button>
                      </div>
                    </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with dynamic counts */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 shadow-lg space-y-1.5 sm:space-y-0" style={{backgroundColor: '#102463'}}>
            <div className="px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg" style={{backgroundColor: '#ffffff'}}>
              <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6" style={{color: '#102463'}}>
                {activeTab === 'organization' && (
                  <>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">{boothHeadData.length}</div>
                      <div className="text-[10px] sm:text-xs">बूथ प्रमुख</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">{coInchargeData.length}</div>
                      <div className="text-[10px] sm:text-xs">बुथ सह इनचार्ज</div>
                    </div>
                  </>
                )}
                {activeTab === 'voter' && (
                  <>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">{voterStats.total}</div>
                      <div className="text-[10px] sm:text-xs">टोटल</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">{voterStats.visits}</div>
                      <div className="text-[10px] sm:text-xs">मुलाकात</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-bold">{voterStats.visitsRemaining}</div>
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

export default BoothDetailSlide
