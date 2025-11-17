import React, { useState, useEffect, useCallback } from 'react'
import { displayDeathSurvey } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import VoterCard from '../../common/VoterCard.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'

const DeathSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooth, setSelectedBooth] = useState('all')
  const [boothOptions, setBoothOptions] = useState([])
  const [showBoothDropdown, setShowBoothDropdown] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('मोबाइल नंबर नहीं मिला')

  // Fetch death survey voters
  const fetchDeathSurveyVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      console.log('Fetching death survey voters from:', panelApiUrl)
      
      // Use the new API endpoint
      const response = await displayDeathSurvey(panelApiUrl)
      
      console.log('Death Survey Response:', response)
      
      // Parse response
      let votersData = []
      
      if (Array.isArray(response)) {
        votersData = response
      } else if (response && response.result && Array.isArray(response.result)) {
        votersData = response.result
      } else if (response && response.data && Array.isArray(response.data)) {
        votersData = response.data
      }
      
      // Map the response to our component format
      const mappedVoters = votersData.map((item, index) => {
        // Combine first name and surname for full name
        const firstName = item.eng_f_name || item.first_name || item.f_name || ''
        const surname = item.eng_surname || item.surname || item.s_name || ''
        const fullName = `${firstName} ${surname}`.trim() || item.name || 'N/A'
        
        return {
          id: item.id || item.voter_id || index + 1,
          name: fullName,
          firstName: firstName,
          surname: surname,
          fatherHusband: item.eng_m_name || item.father_name || item.father_husband || item.m_name || '',
          address: item.eng_localityid || item.address || item.full_address || item.locality || '',
          serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
          mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '-',
          idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
          boothNo: item.part_no || item.booth_no || item.booth_number || '',
          houseNo: item.eng_house_no || item.house_no || item.house_number || '',
          pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
          otherAddress: item.other_address || item.dusra_pata || item.add_add || '-'
        }
      })
      
      console.log('Mapped Death Survey Voters:', mappedVoters)
      setVoters(mappedVoters)
      
      // Extract unique booth numbers for filter
      const uniqueBooths = [...new Set(mappedVoters.map(v => v.boothNo).filter(Boolean))].sort((a, b) => {
        const numA = parseInt(a) || 0
        const numB = parseInt(b) || 0
        return numA - numB
      })
      setBoothOptions(['all', ...uniqueBooths])
    } catch (err) {
      console.error('Error fetching death survey voters:', err)
      setError(err.message || 'Failed to fetch death survey data')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeathSurveyVoters()
  }, [fetchDeathSurveyVoters])

  // Filter voters based on search query and selected booth
  const filteredVoters = voters.filter(voter => {
    // Booth filter
    if (selectedBooth !== 'all' && voter.boothNo !== selectedBooth) {
      return false
    }
    
    // Search filter
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      voter.name.toLowerCase().includes(query) ||
      voter.fatherHusband.toLowerCase().includes(query) ||
      voter.address.toLowerCase().includes(query) ||
      voter.idCardNo.toLowerCase().includes(query) ||
      voter.mobile.includes(query)
    )
  })

  const handleBack = () => {
    navigate('/cadre-survey-report')
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const sanitizePhoneNumber = (phoneNumber) => (phoneNumber || '').toString().trim()

  const hasValidPhoneNumber = (phoneNumber) => {
    const sanitized = sanitizePhoneNumber(phoneNumber)
    return sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10
  }

  const handleCallAction = (phoneNumber) => {
    const sanitized = sanitizePhoneNumber(phoneNumber)
    if (hasValidPhoneNumber(phoneNumber)) {
      window.open(`tel:${sanitized}`, '_self')
    } else {
      setModalMessage('मोबाइल नंबर नहीं मिला')
      setShowModal(true)
    }
  }

  const handleFamilyNavigation = (voter) => {
    if (!voter) return

    const getNumericId = (value) => {
      if (value === null || value === undefined) return null
      const trimmed = String(value).trim()
      if (!trimmed || !/^\d+$/.test(trimmed)) return null
      const parsed = Number.parseInt(trimmed, 10)
      return Number.isNaN(parsed) ? null : parsed
    }

    const candidateKeys = ['id', 'voter_id', 'voterId', 'voterid', 'voterID', 'master_id', 'main_admin_id']
    const numericVoterId = candidateKeys
      .map((key) => getNumericId(voter[key]))
      .filter((value) => value !== null)[0]

    if (!numericVoterId) {
      console.warn('Unable to open family screen. Numeric voter id missing for voter:', voter)
      setModalMessage('परिवार की जानकारी उपलब्ध नहीं है')
      setShowModal(true)
      return
    }

    const voterName = voter.name || 'परिवार'
    navigate('/family-screen', {
      voterId: numericVoterId,
      name: voterName
    })
  }

  const handleBoothChange = (booth) => {
    setSelectedBooth(booth)
    setShowBoothDropdown(false)
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        {/* Header */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 shadow-md" style={{ backgroundColor: '#102463' }}>
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
              <h1 className="text-white text-base sm:text-lg font-semibold">मृत्यु</h1>
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
                onClick={handleClearSearch}
              />
            </div>
          </div>
        </div>

        {/* Summary Bar + Booth Filter */}
        <div className="px-2 sm:px-4 py-2 sm:py-3" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {filteredVoters.length}
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
                      {booth === 'all' ? 'सभी' : booth}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 pb-24 sm:pb-28">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">डेटा लोड हो रहा है...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
            <div className="text-center">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <p className="text-red-700 font-semibold">{error}</p>
              <button
                onClick={fetchDeathSurveyVoters}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: '#102463' }}
              >
                पुनः प्रयास करें
              </button>
            </div>
          </div>
        )}

        {/* Voter List */}
        {!loading && !error && (
          <>
            {filteredVoters.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-600 font-medium">
                  {searchQuery || selectedBooth !== 'all' ? 'कोई परिणाम नहीं मिला' : 'कोई डेटा नहीं मिला'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                {filteredVoters.map((voter, index) => (
                  <VoterCard
                    key={voter.id || voter.voter_id || voter.admin_id || `${voter.idCardNo || ''}-${index}`}
                    voter={voter}
                    index={index}
                    onCall={handleCallAction}
                    onFamily={handleFamilyNavigation}
                    onCheckModal={() => {
                      setModalMessage('मोबाइल नंबर नहीं मिला')
                      setShowModal(true)
                    }}
                    showLocationButton={false}
                    showEditButton={false}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        okText="Ok"
      />
    </div>
  )
}

export default DeathSurvey

