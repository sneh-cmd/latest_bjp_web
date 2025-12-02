import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayBoothWiseSurveyVoter } from '../../../../apidata'
import VoterCard from '../../common/VoterCard.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'

const BoothDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVoter, setSelectedVoter] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('मोबाइल नंबर नहीं मिला')

  const sanitizePhoneNumber = (phoneNumber) => (phoneNumber || '').toString().trim()

  const hasValidPhoneNumber = (phoneNumber) => {
    const sanitized = sanitizePhoneNumber(phoneNumber)
    return sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10
  }

  // Fetch voters based on category id and active tab
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try multiple possible field names for category ID
      // API expects booth ID, which might be in different fields
      let categoryId = categoryData.id || categoryData.categoryId || categoryData.category_id || categoryData.booth_id
      
      // If ID is not found, try using booth number (API might accept booth number as ID)
      if (!categoryId && categoryData.boothNo) {
        categoryId = categoryData.boothNo
      }
      
      // If still not found, try using index as ID (since API might use 1-based index)
      if (!categoryId && categoryData.index !== undefined) {
        categoryId = categoryData.index + 1
      }
      
      console.log('Booth Data:', categoryData)
      console.log('Booth ID (using):', categoryId)
      console.log('Booth Number:', categoryData.boothNo)
      console.log('Index:', categoryData.index)
      
      if (!categoryId) {
        console.error('Booth ID not found in:', categoryData)
        setError('Booth ID not found. Please check console for details.')
        setLoading(false)
        return
      }

      const panelApiUrl = localStorage.getItem('panelApiUrl') || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      console.log('Fetching voters for booth ID:', categoryId, 'from:', panelApiUrl)
      console.log('API Function: displayBoothWiseSurveyVoter')
      console.log('API Endpoint:', panelApiUrl)
      
      // Using booth wise survey voter API
      const response = await displayBoothWiseSurveyVoter(categoryId, panelApiUrl)
      
      console.log('API Response Type:', typeof response)
      console.log('API Response:', response)
      console.log('Is Array:', Array.isArray(response))
      
      if (response && Array.isArray(response)) {
        console.log('Voters fetched:', response.length)
        setVoters(response)
        // Set first voter as selected by default
        if (response.length > 0) {
          setSelectedVoter(response[0])
        } else {
          setSelectedVoter(null)
        }
      } else if (response && typeof response === 'object') {
        // Handle case where response might be wrapped
        const votersList = response.result || response.data || response.voters || []
        if (Array.isArray(votersList)) {
          console.log('Voters fetched from wrapped response:', votersList.length)
          setVoters(votersList)
          if (votersList.length > 0) {
            setSelectedVoter(votersList[0])
          } else {
            setSelectedVoter(null)
          }
        } else {
          console.warn('Unexpected response format:', response)
          setVoters([])
          setSelectedVoter(null)
        }
      } else {
        console.warn('No voters found in response:', response)
        setVoters([])
        setSelectedVoter(null)
      }
    } catch (err) {
      console.error('Error fetching booth wise survey voters:', err)
      setError(err.message || 'Failed to fetch data')
      setVoters([])
      setSelectedVoter(null)
    } finally {
      setLoading(false)
    }
  }, [categoryData])

  useEffect(() => {
    const storedActiveTab = sessionStorage.getItem('boothDetailActiveTab')
    if (storedActiveTab) {
      setActiveTab(storedActiveTab)
      sessionStorage.removeItem('boothDetailActiveTab')
    }
  }, [])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  // Filter voters based on active tab and voter_status
  const filteredVoters = useMemo(() => {
    if (!voters || voters.length === 0) return []
    const query = searchQuery.trim().toLowerCase()
    
    // Map voter_status to tabs
    // p = positive, n = negative, d = doubtful, c = cant_say/nothing
    const statusMap = {
      'positive': 'p',
      'negative': 'n',
      'doubtful': 'd',
      'nothing': 'c'
    }
    const expectedStatus = statusMap[activeTab]
    // For अनुपलब्ध tab
    if (activeTab === 'unavailable') {
      return voters.filter(voter => {
        const va = voter.voter_available
        const nas = voter.not_available_status
        return (
          (
            va === false ||
            va === 'false' ||
            va === 0 ||
            va === '0'
          ) &&
          nas && nas.toString().trim() !== ''
        )
      })
    }
    
    // Filter voters based on active tab
    const filtered = voters.filter(voter => {
      if (!voter.voterStatus || voter.voterStatus.toString().trim() === '') {
        // Skip voters that don't have a valid status from the API
        return false
      }
      
      // Compare voter_status (case-insensitive)
      const voterStatus = voter.voterStatus.toString().toLowerCase().trim()
      if (voterStatus !== expectedStatus) return false

      if (!query) return true

      const searchable = [
        voter.name,
        voter.fatherHusband,
        voter.address,
        voter.mobile,
        voter.idCardNo,
        voter.boothNo
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
    
    console.log(`Filtering voters - Tab: ${activeTab}, Expected Status: ${expectedStatus}, Found: ${filtered.length} voters`)
    
    return filtered
  }, [voters, activeTab, searchQuery])
  
  // Update selected voter when filtered list or tab changes
  useEffect(() => {
    if (filteredVoters.length > 0) {
      // If current selected voter is not in filtered list, select first from filtered
      const isCurrentVoterInFiltered = selectedVoter && filteredVoters.some(v => v.id === selectedVoter.id)
      if (!isCurrentVoterInFiltered || !selectedVoter) {
        setSelectedVoter(filteredVoters[0])
      }
    } else {
      setSelectedVoter(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredVoters, activeTab])

  // Calculate counts for each tab from fetched voters
  const tabCounts = {
    positive: voters.filter(v => v.voterStatus?.toLowerCase() === 'p').length,
    negative: voters.filter(v => v.voterStatus?.toLowerCase() === 'n').length,
    doubtful: voters.filter(v => v.voterStatus?.toLowerCase() === 'd').length,
    nothing: voters.filter(v => v.voterStatus?.toLowerCase() === 'c').length,
    unavailable: voters.filter(voter => {
      const va = voter.voter_available
      const nas = voter.not_available_status
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

  // Get current voter data to display
  const currentVoter = selectedVoter || filteredVoters[0] || null

  const totalFiltered = filteredVoters.length

  const handleBack = () => {
    navigate('/booth-wise-survey')
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
    sessionStorage.setItem('boothDetailActiveTab', activeTab)
    navigate('/family-screen', {
      voterId: numericVoterId,
      name: voterName
    })
  }

  const handleLogNavigation = (voter) => {
    sessionStorage.setItem('boothDetailActiveTab', activeTab)
    navigate('/voter-log', {
      voter
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

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        <PageHeader
          title={`बूथ नं. ${categoryData.boothNo || 'विवरण'}`}
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
                टोटल : {totalFiltered}
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
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 py-3 sm:py-4 pb-20">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-base sm:text-lg text-gray-500 mt-4">डेटा लोड हो रहा है...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="text-base sm:text-lg">{error}</p>
            <div className="mt-2 text-xs text-gray-600">
              <p>Booth Data: {JSON.stringify(categoryData, null, 2)}</p>
            </div>
            <button
              onClick={fetchVoters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : filteredVoters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-base sm:text-lg">
              {voters.length > 0 
                ? `${activeTab === 'positive' ? 'पॉजिटिव' : activeTab === 'negative' ? 'नेगेटिव' : activeTab === 'doubtful' ? 'डाउटफुल' : 'कुछ नहीं'} के लिए कोई voter नहीं मिला`
                : 'कोई डेटा नहीं मिला'
              }
            </p>
            {voters.length === 0 && (
              <p className="text-xs mt-2">API से कोई voter नहीं मिला</p>
            )}
            {filteredVoters.length === 0 && voters.length > 0 && (
              <p className="text-xs mt-2">कुल voters: {voters.length}</p>
            )}
          </div>
        ) : (
          <>
            {filteredVoters.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                {filteredVoters.map((voter, index) => (
                  <VoterCard
                    key={voter.id || voter.voter_id || voter.admin_id || `${voter.idCardNo || ''}-${index}`}
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
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No voters found for this filter.</p>
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

export default BoothDetailSlide

