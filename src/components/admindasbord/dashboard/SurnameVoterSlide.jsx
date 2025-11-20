import React, { useState, useEffect, useMemo } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'
import DataSearchLoader from '../utils/DataSearchLoader'
import ValidationModal from '../modals/ValidationModal.jsx'
import PageHeader from '../common/PageHeader.jsx'
import VoterCard from '../common/VoterCard.jsx'

const ensureTrailingComma = (value) => {
  if (!value) return ''
  return value.endsWith(',') ? value : `${value},`
}

const SurnameVoterSlide = ({
  navigation,
  onClose,
  surnames: surnamesProp,
  surnameListString: surnameListStringProp
}) => {
  const { navigate, state = {}, params = {} } = navigation
  const querySurnameList = typeof params?.surnames === 'string' ? params.surnames : ''
  const derivedSurnameListString = ensureTrailingComma(
    surnameListStringProp ||
      state?.surnameListString ||
      decodeURIComponent(querySurnameList || '')
  )
  const derivedSurnames = useMemo(() => {
    if (Array.isArray(surnamesProp) && surnamesProp.length > 0) {
      return surnamesProp
    }
    if (Array.isArray(state?.selectedSurnames) && state.selectedSurnames.length > 0) {
      return state.selectedSurnames
    }
    if (derivedSurnameListString) {
      return derivedSurnameListString
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, index) => ({
          id: index + 1,
          name
        }))
    }
    return []
  }, [surnamesProp, state?.selectedSurnames, derivedSurnameListString])

  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [voters, setVoters] = useState([])
  const [allVoters, setAllVoters] = useState([])
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBoothDropdown, setShowBoothDropdown] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState('all')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch voters from API
  useEffect(() => {
    const fetchVoters = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        if (!derivedSurnames || derivedSurnames.length === 0) {
          throw new Error('No surnames provided')
        }
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
        
        // Create surname list string from selected surnames (prefer provided string)
        const surnameList = derivedSurnameListString
          ? derivedSurnameListString
          : ensureTrailingComma(derivedSurnames.map((s) => s.name).join(','))
        
        const apiSurnameList = ensureTrailingComma(surnameList)
        console.log('Fetching voters for surnames:', apiSurnameList)
        const response = await apiService.surnameWiseSearch(apiSurnameList, panelApiUrl)
        
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
      }
    }
    
    fetchVoters()
  }, [derivedSurnames, derivedSurnameListString])

  // Filter voters based on search query and booth selection
  useEffect(() => {
    let filtered = allVoters

    // Filter by booth if selected
    if (selectedBooth && selectedBooth !== 'all') {
      filtered = filtered.filter(voter => voter.boothNo === selectedBooth)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((voter) => {
        const name = (voter.name || '').toLowerCase()
        const voterId = (voter.voterId || voter.idCardNo || '').toLowerCase()
        const mobile = (voter.mobile || voter.contact_no || '').toString()
        const serialNo = (voter.serialNo || voter.serialNumber || '').toString()
        const boothNo = (voter.boothNo || '').toString()
        const fatherHusband = (voter.fatherHusband || voter.eng_m_name || '').toLowerCase()
        
        return (
          name.includes(query) ||
          voterId.includes(query) ||
          mobile.includes(query) ||
          serialNo.includes(query) ||
          boothNo.includes(query) ||
          fatherHusband.includes(query)
        )
      })
    }

    setVoters(filtered)
  }, [searchQuery, selectedBooth, allVoters])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) {
        onClose()
      } else {
        navigate('/surname')
      }
    }, 300)
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
  }

  const handleBoothChange = (boothNo) => {
    setSelectedBooth(boothNo)
    setShowBoothDropdown(false)
  }

  // Get unique booth numbers from all voters
  const uniqueBooths = [...new Set(allVoters.map(v => v.boothNo))].sort()
  const boothOptions = ['all', ...uniqueBooths.filter(Boolean)]

  // Total voters
  const totalVoters = voters.length

  // Get selected surnames text
  const baseList = derivedSurnameListString
    || (derivedSurnames && derivedSurnames.length > 0
      ? derivedSurnames.map((s) => s.name).join(',')
      : '')
  const selectedSurnamesText = ensureTrailingComma(baseList) || 'Selected Surnames'

  return (
    <div className="fixed inset-0 z-50">
      <div className={`relative w-full h-full overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gray-100"></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">
        <DataSearchLoader isVisible={isLoading} />

        {/* Header */}
        <PageHeader
          title="सरनेम के अनुसार"
          onBack={() => {
            // Navigate to surname slide with previously selected surnames
            navigate('/surname', {
              selectedSurnames: derivedSurnames,
              surnameListString: derivedSurnameListString
            })
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

        {/* Surname Search Bar - Always Visible */}
        <div className="px-4 py-2 flex-shrink-0 border-b border-gray-200" style={{ backgroundColor: '#e5e8ff' }}>
          <button
            onClick={() => {
              // Navigate to surname slide with previously selected surnames
              navigate('/surname', {
                selectedSurnames: derivedSurnames,
                surnameListString: derivedSurnameListString
              })
            }}
            className="w-full flex items-center bg-white rounded-lg px-3 py-2 text-left hover:bg-gray-200 transition-colors"
          >
            <span className="text-sm text-[#102463] font-medium truncate leading-none">
              {selectedSurnamesText}
            </span>
          </button>
        </div>

        {/* Totals & Booth Selector */}
        <div className="px-4 py-2 flex-shrink-0 border-b border-gray-200" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {totalVoters}
              </span>
            </div>
            <div className="relative sm:w-auto">
              <button
                onClick={() => setShowBoothDropdown(!showBoothDropdown)}
                className="w-full sm:w-32 flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-left"
              >
                <span className="text-sm font-medium text-gray-700">
                  {selectedBooth === 'all' ? 'बूथ' : `बूथ: ${selectedBooth}`}
                </span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showBoothDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showBoothDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {boothOptions.map((booth) => (
                    <button
                      key={booth}
                      onClick={() => handleBoothChange(booth)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                        selectedBooth === booth ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {booth === 'all' ? 'All' : booth}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3" style={{ backgroundColor: '#e5e8ff' }}>
          {isLoading ? null : error ? (
            // Error State
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium mb-2">Error loading voters</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          ) : voters.length === 0 ? (
            // Empty State
            <div className="flex items-center justify-center h-full">
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
                  onCheckModal={() => setShowModal(true)}
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

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showModal}
        message="मोबाइल नंबर नहीं मिला"
        onClose={() => setShowModal(false)}
        okText="Ok"
      />
    </div>
  )
}

export default SurnameVoterSlide

