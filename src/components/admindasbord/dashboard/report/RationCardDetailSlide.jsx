import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayRationCardWiseSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import VoterCard from '../../common/VoterCard.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'

const RationCardDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('मोबाइल नंबर नहीं मिला')

  // Fetch voters based on category id and active tab
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try multiple possible field names for category ID
      // API accepts ration card type name like "Antyoday/Yellow"
      let categoryId = categoryData.cardType || categoryData.name || categoryData.id || categoryData.categoryId || categoryData.category_id || categoryData.ration_card_id
      
      // If ID is not found, try using index as fallback
      if (!categoryId && categoryData.index !== undefined) {
        categoryId = categoryData.index + 1
      }
      
      console.log('Ration Card Data:', categoryData)
      console.log('Ration Card ID/Name (using):', categoryId)
      
      if (!categoryId) {
        console.error('Ration Card ID/Name not found in:', categoryData)
        setError('Ration Card ID/Name not found. Please check console for details.')
        setLoading(false)
        return
      }

      const panelApiUrl = localStorageManager.getApiUrl()
      console.log('Fetching voters for ration card:', categoryId, 'from:', panelApiUrl)
      console.log('API Function: displayRationCardWiseSurveyVoter')
      
      const response = await displayRationCardWiseSurveyVoter(categoryId, panelApiUrl)
      
      console.log('API Response Type:', typeof response)
      console.log('API Response:', response)
      console.log('Is Array:', Array.isArray(response))
      
      if (response && Array.isArray(response)) {
        console.log('Voters fetched:', response.length)
        setVoters(response)
      } else if (response && typeof response === 'object') {
        const votersList = response.result || response.data || response.voters || []
        if (Array.isArray(votersList)) {
          console.log('Voters fetched from wrapped response:', votersList.length)
          setVoters(votersList)
        } else {
          console.warn('Unexpected response format:', response)
          setVoters([])
        }
      } else {
        console.warn('No voters found in response:', response)
        setVoters([])
      }
    } catch (err) {
      console.error('Error fetching ration card wise survey voters:', err)
      setError(err.message || 'Failed to fetch data')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [categoryData])

  useEffect(() => {
    const storedActiveTab = sessionStorage.getItem('rationCardDetailActiveTab')
    if (storedActiveTab) {
      setActiveTab(storedActiveTab)
      sessionStorage.removeItem('rationCardDetailActiveTab')
    }
  }, [])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  // Filter voters based on active tab and voter_status - strict filtering
  const filteredVoters = useMemo(() => {
    if (!voters || voters.length === 0) {
      return []
    }
    const query = searchQuery.trim().toLowerCase()
    
    const statusMap = {
      'positive': 'p',
      'negative': 'n',
      'doubtful': 'd',
      'nothing': 'c'
    }
    
    const expectedStatus = statusMap[activeTab]
    
    console.log(`=== Filtering Voters ===`)
    console.log(`Active Tab: ${activeTab}`)
    console.log(`Expected Status: ${expectedStatus}`)
    console.log(`Total Voters: ${voters.length}`)
    
    const filtered = voters.filter(voter => {
      // Only show voters with exact status match
      // If voterStatus is missing/empty, don't show in any tab (strict filtering)
      if (!voter.voterStatus || voter.voterStatus === '' || voter.voterStatus === null || voter.voterStatus === undefined) {
        console.log(`✗ Skipping voter with no status: ${voter.name}`)
        return false
      }
      
      // Convert to string and normalize to lowercase
      const voterStatus = String(voter.voterStatus).toLowerCase().trim()
      
      // Only match exact status - 'p' for positive, 'n' for negative, 'd' for doubtful, 'c' for nothing
      const matches = voterStatus === expectedStatus
      if (!matches) return false

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
    
    console.log(`✅ Filtered Result - Tab: ${activeTab}, Found: ${filtered.length} voters`)
    if (filtered.length > 0) {
      console.log(`Filtered voter names:`, filtered.map(v => `${v.name} (${v.voterStatus})`))
    }
    
    return filtered
  }, [voters, activeTab, searchQuery])
  
  // Calculate counts for each tab from fetched voters - strict matching
  const tabCounts = useMemo(() => {
    if (!voters || voters.length === 0) {
      return { positive: 0, negative: 0, doubtful: 0, nothing: 0 }
    }
    
    const counts = {
      positive: voters.filter(v => {
        if (!v.voterStatus) return false
        const status = String(v.voterStatus).toLowerCase().trim()
        return status === 'p' // Only exact 'p' status
      }).length,
      negative: voters.filter(v => {
        if (!v.voterStatus) return false
        const status = String(v.voterStatus).toLowerCase().trim()
        return status === 'n' // Only exact 'n' status
      }).length,
      doubtful: voters.filter(v => {
        if (!v.voterStatus) return false
        const status = String(v.voterStatus).toLowerCase().trim()
        return status === 'd' // Only exact 'd' status
      }).length,
      nothing: voters.filter(v => {
        if (!v.voterStatus) return false
        const status = String(v.voterStatus).toLowerCase().trim()
        return status === 'c' // Only exact 'c' status
      }).length
    }
    
    console.log('Tab Counts (strict):', counts)
    console.log('Total voters:', voters.length)
    console.log('Voters by status:', voters.map(v => ({ name: v.name, status: v.voterStatus })))
    
    return counts
  }, [voters])

  const totalFiltered = filteredVoters.length

  const handleBack = () => {
    navigate('/ration-card-wise-survey')
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
    sessionStorage.setItem('rationCardDetailActiveTab', activeTab)
    navigate('/family-screen', {
      voterId: numericVoterId,
      name: voterName
    })
  }

  const handleLogNavigation = (voter) => {
    sessionStorage.setItem('rationCardDetailActiveTab', activeTab)
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
          title={categoryData.cardType || 'विवरण'}
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
              <p>Ration Card Data: {JSON.stringify(categoryData, null, 2)}</p>
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
            {/* Render all filtered voters as separate cards */}
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

export default RationCardDetailSlide

