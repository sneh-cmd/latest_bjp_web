import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayDateWiseSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'

const DateDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleCall = (voter) => {
    if (voter?.mobile && voter.mobile !== 'N/A' && voter.mobile !== '-') {
      window.location.href = `tel:${voter.mobile}`
    }
  }

  const handleCheck = (voter) => {
    console.log('Check action for:', voter)
  }

  const handleFamily = (voter) => {
    console.log('Family action for:', voter)
  }

  const handleLog = (voter) => {
    console.log('Log action for:', voter)
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

              <h1 className="text-white text-base sm:text-lg font-semibold">तारीख: {displayDate}</h1>
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
                onClick={() => setSearchQuery('')}
              />
            </div>
          </div>
        </div>

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
            <p className="text-base sm:text-lg">{error}</p>
            <div className="mt-2 text-xs text-gray-600">
              <p>Date Data: {JSON.stringify(categoryData, null, 2)}</p>
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
              <div className="space-y-4">
                {filteredVoters.map((voter, index) => (
                  <div key={voter.id || voter.voter_id || index} className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: '#ffffff' }}>
                    <div className="p-3 sm:p-4">
                      {/* Header */}
                      <div className="mb-3">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase">
                          {voter.name || 'N/A'}
                        </h2>
                      </div>

                      {/* Information Section */}
                      <div className="space-y-2 mb-3">
                        {/* पिता/पतिः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">पिता/पतिः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.fatherHusband || 'N/A'}</span>
                        </div>

                        {/* पता */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">पता:</span>
                          <div className="flex-1 flex items-start gap-1.5">
                            <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.address || 'N/A'}</span>
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>

                        {/* क्रमांकः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">क्रमांकः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.serialNumber || 'N/A'}</span>
                        </div>

                        {/* मोबाइल */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">मोबाइल:</span>
                          <div className="flex-1 flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm text-gray-900">{voter.mobile || '-'}</span>
                            <button
                              onClick={() => {
                                console.log('Edit mobile for:', voter.name)
                              }}
                              className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded flex items-center justify-center flex-shrink-0"
                            >
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* पहचान पत्र नं. */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">पहचान पत्र नं.:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.idCardNo || 'N/A'}</span>
                        </div>

                        {/* भाग नंः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">भाग नंः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.partNo || 'N/A'}</span>
                        </div>

                        {/* घर नं: */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">घर नं:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.houseNo || 'N/A'}</span>
                        </div>

                        {/* मतदान स्थानः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">मतदान स्थानः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.pollingStation || 'N/A'}</span>
                        </div>

                        {/* दूसरा पता: */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">दूसरा पता:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.otherAddress || '-'}</span>
                        </div>

                      </div>

                      {/* Separator */}
                      <div className="border-t border-gray-300 my-3"></div>

                      {/* Action Buttons - 4 buttons */}
                      <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1">
                        {/* Call Button - Light Blue */}
                        <button
                          onClick={() => handleCall(voter)}
                          className="flex flex-col items-center gap-0.5 group"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:shadow-lg group-active:scale-95" style={{ backgroundColor: '#87CEEB' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white transform rotate-[-12deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Call</span>
                        </button>

                        {/* Check Button - Green */}
                        <button
                          onClick={() => handleCheck(voter)}
                          className="flex flex-col items-center gap-0.5 group"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:shadow-lg group-active:scale-95" style={{ backgroundColor: '#10B981' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Check</span>
                        </button>

                        {/* Family Button - Yellow */}
                        <button
                          onClick={() => handleFamily(voter)}
                          className="flex flex-col items-center gap-0.5 group"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:shadow-lg group-active:scale-95" style={{ backgroundColor: '#FBBF24' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Family</span>
                        </button>

                        {/* Log Button - Orange */}
                        <button
                          onClick={() => handleLog(voter)}
                          className="flex flex-col items-center gap-0.5 group"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:shadow-lg group-active:scale-95" style={{ backgroundColor: '#F97316' }}>
                            <span className="text-white text-lg sm:text-xl font-bold">i</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Log</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export default DateDetailSlide

