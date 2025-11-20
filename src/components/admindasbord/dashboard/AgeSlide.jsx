import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'
import DataSearchLoader from '../utils/DataSearchLoader'
import ValidationModal from '../modals/ValidationModal'
import PageHeader from '../common/PageHeader.jsx'
import VoterCard from '../common/VoterCard.jsx'

const AGE_SEARCH_CACHE_KEY = 'age-search-cache'

const AgeSlide = ({ navigation, onClose }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [voters, setVoters] = useState([])
  const [allVoters, setAllVoters] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [showMobileModal, setShowMobileModal] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    try {
      const cachedRaw = sessionStorage.getItem(AGE_SEARCH_CACHE_KEY)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        if (cached.ageFrom !== undefined) setAgeFrom(`${cached.ageFrom}`)
        if (cached.ageTo !== undefined) setAgeTo(`${cached.ageTo}`)
      if (Array.isArray(cached.voters)) {
        setVoters(cached.voters)
        setAllVoters(cached.voters)
      }
      if (typeof cached.searchQuery === 'string') setSearchQuery(cached.searchQuery)
      setError(cached.error || null)
      setShowResults(Boolean(cached.showResults))
      }
    } catch (err) {
      console.error('Failed to restore age search cache:', err)
      sessionStorage.removeItem(AGE_SEARCH_CACHE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!showResults) return
    try {
      const cachePayload = {
        ageFrom,
        ageTo,
        voters: allVoters, // Cache the unfiltered list
        searchQuery,
        error,
        showResults
      }
      sessionStorage.setItem(AGE_SEARCH_CACHE_KEY, JSON.stringify(cachePayload))
    } catch (err) {
      console.error('Failed to persist age search cache:', err)
    }
  }, [ageFrom, ageTo, allVoters, searchQuery, showResults, error])

  const handleBack = () => {
    sessionStorage.removeItem(AGE_SEARCH_CACHE_KEY)
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) {
        onClose()
      } else {
        navigate('/admin')
      }
    }, 300)
  }

  const handleSearch = async () => {
    if (!ageFrom || !ageTo) {
      alert('Please enter both age range values')
      return
    }

    const from = Number(ageFrom)
    const to = Number(ageTo)

    if (Number.isNaN(from) || Number.isNaN(to)) {
      alert('Please enter valid age values')
      return
    }

    if (to < from) {
      alert('कृपया "उम्र तक" का मान "उम्र से" से बड़ा रखें')
      return
    }

    if (to - from > 4) {
      setValidationMessage('आप इसे खोज नहीं सकते। 5 वर्ष आयु समूह की सीमा है')
      setShowValidationModal(true)
      return
    }
    console.log('Searching for age range:', ageFrom, 'to', ageTo)
    
    try {
      setIsLoading(true)
      setShowResults(false)
      setError(null)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      console.log('Fetching voters for age range:', ageFrom, 'to', ageTo)
      const response = await apiService.ageWiseSearch(ageFrom, ageTo, panelApiUrl)
      
      console.log('API response:', response)
      
      // Transform the response to match VoterCard structure
      const transformedVoters = Array.isArray(response) 
        ? response.map((item) => ({
            id: item.id,
            voter_id: item.voter_id,
            admin_id: item.admin_id,
            // Name fields
            name: `${item.eng_f_name || ''} ${item.f_eng_surname || ''}`.trim(),
            eng_f_name: item.eng_f_name,
            f_eng_surname: item.f_eng_surname,
            firstName: item.eng_f_name,
            // Father/Husband fields
            fatherHusband: item.eng_m_name,
            eng_m_name: item.eng_m_name,
            father_name: item.eng_m_name,
            m_name: item.m_name,
            // Address fields
            address: item.eng_localityid,
            eng_localityid: item.eng_localityid,
            full_address: item.eng_localityid,
            locality: item.locality,
            // Mobile fields
            mobile: item.contact_no,
            contact_no: item.contact_no,
            phone: item.phone,
            // Serial number fields
            serialNumber: item.slnoinpart || item.serial_no,
            serialNo: item.slnoinpart || item.serial_no, // Alias for search compatibility
            slnoinpart: item.slnoinpart,
            serial_no: item.serial_no,
            kramank: item.kramank,
            // ID card fields
            idCardNo: item.idcard_no,
            idcard_no: item.idcard_no,
            id_card_no: item.id_card_no,
            epic_no: item.epic_no,
            epic: item.epic,
            voterId: item.idcard_no,
            // Booth fields
            boothNo: item.booth_no || item.part_no,
            partNo: item.part_no,
            part_no: item.part_no,
            booth_no: item.booth_no,
            booth_number: item.booth_number,
            // House number fields
            houseNo: item.eng_house_no,
            eng_house_no: item.eng_house_no,
            house_no: item.house_no,
            house_number: item.house_number,
            // Polling station fields
            pollingStation: item.eng_polling_location,
            eng_polling_location: item.eng_polling_location,
            polling_station: item.polling_station,
            polling_location: item.polling_location,
            // Other address fields
            otherAddress: item.other_address || item.dusra_pata || item.add_add,
            other_address: item.other_address,
            dusra_pata: item.dusra_pata,
            add_add: item.add_add,
            secondAddress: item.secondAddress
          }))
        : []
      
      setVoters(transformedVoters)
      setAllVoters(transformedVoters)
    } catch (err) {
      console.error('Error fetching voters:', err)
      setError(err.message || 'Failed to fetch voters')
      setVoters([])
      setAllVoters([])
    } finally {
      setIsLoading(false)
      setShowResults(true)
    }
  }

  // Filter voters based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setVoters(allVoters)
      return
    }

    const filtered = allVoters.filter((voter) => {
      const query = searchQuery.toLowerCase()
      const name = (voter.name || '').toLowerCase()
      const voterId = (voter.voterId || voter.idCardNo || '').toLowerCase()
      const mobile = (voter.mobile || voter.contact_no || '').toString()
      const serialNo = (voter.serialNo || voter.serialNumber || '').toString()
      const boothNo = (voter.boothNo || '').toString()
      const fatherHusband = (voter.fatherHusband || voter.eng_m_name || '').toLowerCase()
      const address = (voter.address || voter.eng_localityid || '').toLowerCase()
      const houseNo = (voter.houseNo || voter.eng_house_no || '').toString()
      const pollingStation = (voter.pollingStation || voter.eng_polling_location || '').toLowerCase()
      
      return (
        name.includes(query) ||
        voterId.includes(query) ||
        mobile.includes(query) ||
        serialNo.includes(query) ||
        boothNo.includes(query) ||
        fatherHusband.includes(query) ||
        address.includes(query) ||
        houseNo.includes(query) ||
        pollingStation.includes(query)
      )
    })

    setVoters(filtered)
  }, [searchQuery, allVoters])

  const handleCall = (phoneNumber) => {
    const sanitized = (phoneNumber || '').toString().trim()
    
    // Check if mobile number exists and is valid (not empty, not '-', not 'N/A', and length >= 10)
    if (sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10) {
      window.open(`tel:${sanitized}`, '_self')
    } else {
      // Show modal if mobile number not found or invalid
      setShowMobileModal(true)
    }
  }


  const handleFamily = (voter) => { 
    if (!voter || !voter.id) return
    navigate('/family-screen', {
      voterId: voter.id,
      name: voter.name || voter.eng_f_name,
      buildingNumber: voter.buildingNumber
    })
  }

  const handleMobileEdit = (voter, newMobileNumber) => {
    if (!voter || !newMobileNumber) return
    
    // Update the voter's mobile number in the state
    setVoters((prev) =>
      prev.map((v) => {
        // Match voter by id, voter_id, or admin_id
        const isMatch = 
          (v.id && voter.id && v.id === voter.id) ||
          (v.voter_id && voter.voter_id && v.voter_id === voter.voter_id) ||
          (v.admin_id && voter.admin_id && v.admin_id === voter.admin_id)
        
        if (isMatch) {
          return {
            ...v,
            mobile: newMobileNumber,
            contact_no: newMobileNumber,
            phone: newMobileNumber
          }
        }
        return v
      })
    )
    
    // Also update allVoters to keep search functionality working
    setAllVoters((prev) =>
      prev.map((v) => {
        const isMatch = 
          (v.id && voter.id && v.id === voter.id) ||
          (v.voter_id && voter.voter_id && v.voter_id === voter.voter_id) ||
          (v.admin_id && voter.admin_id && v.admin_id === voter.admin_id)
        
        if (isMatch) {
          return {
            ...v,
            mobile: newMobileNumber,
            contact_no: newMobileNumber,
            phone: newMobileNumber
          }
        }
        return v
      })
    )
    
    // Update cache if it exists
    try {
      const cachedRaw = sessionStorage.getItem(AGE_SEARCH_CACHE_KEY)
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        if (Array.isArray(cached.voters)) {
          const updatedCachedVoters = cached.voters.map((v) => {
            const isMatch = 
              (v.id && voter.id && v.id === voter.id) ||
              (v.voter_id && voter.voter_id && v.voter_id === voter.voter_id) ||
              (v.admin_id && voter.admin_id && v.admin_id === voter.admin_id)
            
            if (isMatch) {
              return {
                ...v,
                mobile: newMobileNumber,
                contact_no: newMobileNumber,
                phone: newMobileNumber
              }
            }
            return v
          })
          sessionStorage.setItem(AGE_SEARCH_CACHE_KEY, JSON.stringify({
            ...cached,
            voters: updatedCachedVoters
          }))
        }
      }
    } catch (err) {
      console.error('Failed to update cache:', err)
    }
  }

  const totalVoters = allVoters.length

  return (
    <div className="fixed inset-0 z-50">
      <ValidationModal
        isOpen={showValidationModal}
        message={validationMessage}
        onClose={() => setShowValidationModal(false)}
      />
      <ValidationModal
        isOpen={showMobileModal}
        message="मोबाइल नंबर नहीं मिला"
        onClose={() => setShowMobileModal(false)}
        okText="Ok"
      />
      <div className={`relative w-full h-full overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0" style={{backgroundColor: '#e3f2fd'}}></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">
        <DataSearchLoader isVisible={isLoading} />

        {/* Header */}
        <PageHeader
          title="उम्र के अनुसार"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
          titleClassName="uppercase"
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" style={{backgroundColor: '#e5e8ff'}}>
          {/* Age Selection Section - Light Blue Background */}
          <div className="sticky top-[0px] z-20 px-4 py-2" style={{backgroundColor: '#e5e8ff'}}>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="order-2 sm:order-1 w-full sm:w-auto px-2 py-1 rounded-lg inline-block">
                <span className="text-sm font-bold" style={{ color: '#102463' }}>
                  टोटल : {totalVoters}
                </span>
              </div>

              {/* Label, Age Input Fields and Search Button */}
              <div className="order-1 sm:order-2 w-full sm:w-auto flex items-center gap-2 sm:gap-3 flex-wrap justify-start">
                <span className="text-sm sm:text-base font-medium px-2 text-gray-900 whitespace-nowrap flex-shrink-0">
                  उम्र चुने
                </span>

                {/* Age From Input */}
                <input
                  type="number"
                  placeholder="उम्र से..."
                  value={ageFrom}
                  onChange={(e) => setAgeFrom(e.target.value)}
                  className="w-20 sm:w-28 flex-shrink-0 bg-white rounded-lg px-2.5 sm:px-4 py-1 sm:py-2 text-sm sm:text-base text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102463] focus:border-transparent"
                  min="0"
                  max="120"
                />

                {/* Age To Input */}
                <input
                  type="number"
                  placeholder="उम्र तक..."
                  value={ageTo}
                  onChange={(e) => setAgeTo(e.target.value)}
                  className="w-20 sm:w-28 flex-shrink-0 bg-white rounded-lg px-2.5 sm:px-4 py-1 sm:py-2 text-sm sm:text-base text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102463] focus:border-transparent"
                  min="0"
                  max="120"
                />

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Results Area - White Background */}
          <div className="p-3" style={{backgroundColor: '#e5e8ff'}}>
            {isLoading ? null : !showResults ? (
              // Empty State - Results will appear here
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 font-medium text-lg">Enter age range and search</p>
                  <p className="text-gray-500 text-sm mt-2">Results will appear here</p>
                </div>
              </div>
            ) : error ? (
              // Error State
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium mb-2">Error loading voters</p>
                  <p className="text-gray-600 text-sm">{error}</p>
                </div>
              </div>
            ) : voters.length === 0 ? (
              // No Results
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <p className="text-gray-600 font-medium">No voters found</p>
                </div>
              </div>
            ) : (
              // Voter List
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {voters.map((voter, idx) => (
                  <VoterCard
                    key={voter.id || voter.voter_id || voter.admin_id || `${voter.idCardNo || ''}-${idx}`}
                    voter={voter}
                    index={idx}
                    onCall={handleCall}
                    onFamily={handleFamily}
                    onCheckModal={() => setShowMobileModal(true)}
                    onEditMobile={handleMobileEdit}
                    showLocationButton={false}
                    showEditButton={true}
                    showOtherAddress={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default AgeSlide

