import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayUserWiseSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import ValidationModal from '../../modals/ValidationModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'
import VoterCard from '../../common/VoterCard.jsx'

const ShaktiDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('मोबाइल नंबर नहीं मिला')

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

  // Fetch voters from API
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get admin_id from categoryData - try multiple possible field names
      const adminId = categoryData.id || categoryData.admin_id || categoryData.adminId || categoryData.user_id
      
      console.log('Shakti Kendra Detail Data:', categoryData)
      console.log('Admin ID (using):', adminId)
      
      if (!adminId) {
        console.error('Admin ID not found in:', categoryData)
        setError('Admin ID not found. Please check console for details.')
        setLoading(false)
        return
      }

      // Get panel API URL from localStorage (optional)
      const panelApiUrl = localStorageManager.getApiUrl()
      console.log('Fetching voters for admin_id:', adminId, 'from:', panelApiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx')
      
      // Call API - survey_from is empty string as per SOAP API specification
      // API: http://ntmc2.mhbjplok.com/webservice.asmx?op=dis_user_wise_survey_voter
      const response = await displayUserWiseSurveyVoter(adminId, '', panelApiUrl)
      
      console.log('API Response Type:', typeof response)
      console.log('API Response:', response)
      console.log('Is Array:', Array.isArray(response))
      
      // Handle response - API returns array directly or wrapped in object
      if (response && Array.isArray(response)) {
        console.log('Voters fetched:', response.length)
        setVoters(response)
      } else if (response && typeof response === 'object') {
        // Handle wrapped response format
        const votersList = response.result || response.data || response.voters || []
        if (Array.isArray(votersList)) {
          console.log('Voters fetched from wrapped response:', votersList.length)
          setVoters(votersList)
        } else {
          // Empty result is valid - no voters found
          console.log('No voters found for this admin_id')
          setVoters([])
        }
      } else {
        // No data returned
        console.log('No voters found in response')
        setVoters([])
      }
    } catch (err) {
      console.error('Error fetching user wise survey voters:', err)
      setError(err.message || 'Failed to fetch voter data')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [categoryData])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  // Filter voters based on active tab
  const filteredVoters = useMemo(() => {
    if (!voters || voters.length === 0) return []
    const query = searchQuery.trim().toLowerCase()
    
    return voters.filter(voter => {
      const rawStatus = voter.voter_status || voter.voter_status1 || voter.voterStatus
      const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
      if (activeTab === 'unavailable') {
        const va = voter.voter_available
        const nas = voter.not_available_status
        const isUnavailable =
          (
            va === false ||
            va === 'false' ||
            va === 0 ||
            va === '0'
          ) &&
          nas && nas.toString().trim() !== ''
        return isUnavailable
      }
      let statusMatch = false
      switch(activeTab) {
        case 'positive':
          statusMatch = status === 'p'
          break
        case 'negative':
          statusMatch = status === 'n'
          break
        case 'doubtful':
          statusMatch = status === 'd'
          break
        case 'nothing':
          statusMatch = status === 'c'
          break
        case 'unavailable':
          statusMatch = true // already filtered above
          break
        default:
          statusMatch = true
      }
      if (!statusMatch) return false
      if (!query) return true
      const searchable = [
        voter.eng_f_name,
        voter.f_eng_surname,
        voter.eng_m_name,
        voter.contact_no,
        voter.mobile,
        voter.idcard_no
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return searchable.includes(query)
    })
  }, [voters, activeTab, searchQuery])

  const tabCounts = useMemo(() => {
    if (!voters || voters.length === 0) {
      return { positive: 0, negative: 0, doubtful: 0, nothing: 0, unavailable: 0 }
    }
    return {
      positive: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'p'
      }).length,
      negative: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'n'
      }).length,
      doubtful: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'd'
      }).length,
      nothing: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'c'
      }).length,
      unavailable: voters.filter(v => {
        const va = v.voter_available
        const nas = v.not_available_status
        return (
          (
            va === false ||
            va === 'false' ||
            va === 0 ||
            va === '0'
          ) &&
          nas && nas.toString().trim() !== ''
        )
      }).length
    }
  }, [voters])

  const totalVoters = filteredVoters.length

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

    const voterName = `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.trim() || 'परिवार'
    sessionStorage.setItem('shaktiDetailActiveTab', activeTab)
    navigate('/family-screen', {
      voterId: numericVoterId,
      name: voterName
    })
  }

  const handleLogNavigation = (voter) => {
    if (!voter) return
    sessionStorage.setItem('shaktiDetailActiveTab', activeTab)
    navigate('/voter-log', {
      voter,
      categoryData
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
  }

  useEffect(() => {
    const storedActiveTab = sessionStorage.getItem('shaktiDetailActiveTab')
    if (storedActiveTab) {
      setActiveTab(storedActiveTab)
      sessionStorage.removeItem('shaktiDetailActiveTab')
    }
  }, [])

  const handleBack = () => {
    navigate('/shakti-kendra-survey')
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <PageHeader
        title={categoryData.name || 'शक्ति केन्द्र प्रमुख'}
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Summary Bar with Tabs */}
      <div className="px-2 sm:px-4 py-1.5 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 flex-wrap">
          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg inline-block">
            <span className="text-xs sm:text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {totalVoters}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('positive')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'positive' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              पॉजिटिव-{tabCounts.positive || categoryData.positive || 0}
            </button>
            <button
              onClick={() => setActiveTab('negative')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'negative' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              नेगेटिव-{tabCounts.negative || categoryData.negative || 0}
            </button>
            <button
              onClick={() => setActiveTab('doubtful')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'doubtful' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              डाउटफुल-{tabCounts.doubtful || categoryData.doubtful || 0}
            </button>
            <button
              onClick={() => setActiveTab('nothing')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'nothing' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              कुछ नहीं-{tabCounts.nothing || categoryData.nothing || 0}
            </button>
            <button
              onClick={() => setActiveTab('unavailable')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'unavailable' 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              अनुपलब्ध-{tabCounts.unavailable}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
            <p className="mt-4 text-gray-600 text-xs sm:text-sm">डेटा लोड हो रहा है...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-red-700 text-base sm:text-lg font-semibold mb-4">{error}</p>
            <button
              onClick={fetchVoters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              style={{ backgroundColor: '#102463' }}
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : filteredVoters.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            {filteredVoters.map((voter, index) => (
              <VoterCard
                key={voter.id || voter.voter_id || voter.admin_id || `${voter.idcard_no || ''}-${index}`}
                voter={voter}
                index={index}
                onCall={handleCallAction}
                onFamily={handleFamilyNavigation}
                onLog={handleLogNavigation}
                onCheckModal={() => {
                  setModalMessage('मोबाइल नंबर नहीं मिला')
                  setShowModal(true)
                }}
                onEditMobile={handleMobileEdit}
                showLocationButton={false}
                showEditButton={true}
                showOtherAddress={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-xs sm:text-sm">कोई डेटा उपलब्ध नहीं है</p>
          </div>
        )}

        {/* Background with Lotus Logo */}
        <div className="relative w-full flex items-center justify-center py-6" style={{ backgroundColor: '#e5e8ff', minHeight: '150px' }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg className="w-40 h-40 sm:w-48 sm:h-48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20 L120 60 L160 60 L130 90 L140 130 L100 110 L60 130 L70 90 L40 60 L80 60 Z" fill="#FFA500" opacity="0.4"/>
            </svg>
          </div>
        </div>
      </div>
      <ValidationModal
        isOpen={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        okText="Ok"
      />
    </div>
  )
}

export default ShaktiDetailSlide

