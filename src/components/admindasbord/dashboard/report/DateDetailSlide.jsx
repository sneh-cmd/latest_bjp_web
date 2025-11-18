import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayDateWiseSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import VoterCard from '../../common/VoterCard.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'

const DateDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('मोबाइल नंबर नहीं मिला')

  // Fetch voters based on date
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get date for API - should be in YYYY-MM-DD format
      let dateForAPI = categoryData.dateForAPI || categoryData.date || categoryData.rawDate
      
      // If date is in formatted format (DD, Mon, YYYY), convert to YYYY-MM-DD
      if (!dateForAPI && categoryData.date) {
        const match = categoryData.date.match(/^(\d+),\s*(\w+),\s*(\d+)$/)
        if (match) {
          const day = match[1].padStart(2, '0')
          const monthName = match[2]
          const year = match[3]
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const monthIndex = monthNames.indexOf(monthName)
          if (monthIndex !== -1) {
            const month = String(monthIndex + 1).padStart(2, '0')
            dateForAPI = `${year}-${month}-${day}`
          }
        }
      }
      
      console.log('Date Data:', categoryData)
      console.log('Date for API:', dateForAPI)
      
      if (!dateForAPI) {
        console.error('Date not found in:', categoryData)
        setError('Date not found. Please check console for details.')
        setLoading(false)
        return
      }

      const panelApiUrl = localStorageManager.getApiUrl()
      console.log('Fetching voters for date:', dateForAPI, 'from:', panelApiUrl)
      console.log('API Function: displayDateWiseSurveyVoter')
      
      const response = await displayDateWiseSurveyVoter(dateForAPI, panelApiUrl)
      
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
      console.error('Error fetching date wise survey voters:', err)
      setError(err.message || 'Failed to fetch data')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [categoryData])

  useEffect(() => {
    const storedActiveTab = sessionStorage.getItem('dateDetailActiveTab')
    if (storedActiveTab) {
      setActiveTab(storedActiveTab)
      sessionStorage.removeItem('dateDetailActiveTab')
    }
  }, [])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  // Filter voters based on active tab and voter_status
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
      // Only show voters with exact status match; skip missing/empty status
      if (!voter.voterStatus || voter.voterStatus.toString().trim() === '') {
        console.log(`✗ Skipping voter with no status: ${voter.name}`)
        return false
      }
      
      // Convert to string and normalize to lowercase
      const voterStatus = String(voter.voterStatus).toLowerCase().trim()
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

  const handleBack = () => {
    navigate('/date-wise-survey')
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
    sessionStorage.setItem('dateDetailActiveTab', activeTab)
    navigate('/family-screen', {
      voterId: numericVoterId,
      name: voterName
    })
  }

  const handleLogNavigation = (voter) => {
    sessionStorage.setItem('dateDetailActiveTab', activeTab)
    navigate('/voter-log', {
      voter
    })
  }

  // Format date for display
  const displayDate = categoryData.date || categoryData.dateForAPI || 'विवरण'
  const totalFiltered = filteredVoters.length

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        <PageHeader
          title={`तारीख: ${displayDate}`}
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
              {['positive', 'negative', 'doubtful', 'nothing'].map((tab) => {
                const config = {
                  positive: { label: 'पॉजिटिव', color: 'bg-green-500' },
                  negative: { label: 'नेगेटिव', color: 'bg-red-500' },
                  doubtful: { label: 'डाउटफुल', color: 'bg-orange-500' },
                  nothing: { label: 'कुछ नहीं', color: 'bg-blue-500' }
                }[tab]

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === tab ? `${config.color} text-white` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {config.label}-{tabCounts[tab] || 0}
                  </button>
                )
              })}
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
             {/* <p className="text-base sm:text-lg">{error}</p> */}
            <div className="mt-2 text-xs text-gray-600">
            {/* <p>Date Data: {JSON.stringify(categoryData, null, 2)}</p> */}
              <p>कोई डेटा उपलब्ध नहीं है</p>
            </div>
           {/*  <button
              onClick={fetchVoters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              पुनः प्रयास करें
            </button> */}
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
                    showLocationButton={false}
                    showEditButton={false}
                  />
                ))}
              </div>
            ) : null}
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

export default DateDetailSlide

