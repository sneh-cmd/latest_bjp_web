import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayBoothWiseSurveyVoter } from '../../../../apidata'

const BoothDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVoter, setSelectedVoter] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    nothing: voters.filter(v => v.voterStatus?.toLowerCase() === 'c').length
  }

  // Get current voter data to display
  const currentVoter = selectedVoter || filteredVoters[0] || null

  const totalFiltered = filteredVoters.length

  const handleBack = () => {
    navigate('/booth-wise-survey')
  }

  const handleCall = (voter = currentVoter) => {
    const voterData = voter || currentVoter
    if (voterData?.mobile && voterData.mobile !== 'N/A' && voterData.mobile !== '-') {
      window.location.href = `tel:${voterData.mobile}`
    }
  }

  const handleCheck = (voter = currentVoter) => {
    const voterData = voter || currentVoter
    console.log('Check action for:', voterData)
    // Add your check logic here
  }

  const handleFamily = (voter = currentVoter) => {
    const voterData = voter || currentVoter
    console.log('Family action for:', voterData)
    // Add your family logic here
  }

  const handleLog = (voter = currentVoter) => {
    const voterData = voter || currentVoter
    console.log('Log action for:', voterData)
    // Add your log logic here
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

              <h1 className="text-white text-base sm:text-lg font-semibold">बूथ नं. {categoryData.boothNo || 'विवरण'}</h1>
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
                {filteredVoters.map((voter, index) => {
                  const voterContact = voter.mobile || voter.contact_no || voter.phone || ''
                  const cardKey = voter.id || voter.voter_id || voter.admin_id || `${voter.idCardNo || ''}-${index}`

                  return (
                    <div key={cardKey} className="bg-white rounded-xl border border-gray-300 p-4 h-full flex flex-col relative">
                      <div className="text-base font-extrabold tracking-wide mb-3">
                        {index + 1}. {(voter.name || '').trim() || 'N/A'}
                      </div>

                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm flex-1">
                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.fatherHusband || '-'}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पता:</span>
                          <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-2">
                            <span className="text-gray-900 break-words flex-1">{voter.address || '-'}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">क्रमांक:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.serialNumber || 'N/A'}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
                          <div className="flex items-center min-w-0">
                            <span className="text-gray-900 truncate">{voterContact || '-'}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.idCardNo || '-'}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.boothNo || '-'}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.houseNo || '-'}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.pollingStation || '-'}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-2">
                          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">दूसरा पता:</span>
                          <span className="text-gray-900 break-words flex-1 min-w-0">{voter.otherAddress || '-'}</span>
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleCall(voter)}
                          className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                          type="button"
                        >
                          <div
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                            style={{ backgroundColor: '#103a94' }}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-600">Call</span>
                        </button>

                        <button
                          onClick={() => handleCheck(voter)}
                          className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                          type="button"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-600">Check</span>
                        </button>

                        <button
                          onClick={() => handleFamily(voter)}
                          className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                          type="button"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2z" />
                            </svg>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
                        </button>

                        <button
                          onClick={() => handleLog(voter)}
                          className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                          type="button"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center transition-all hover:scale-105">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" fill="white" opacity="0.2" />
                              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                            </svg>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-600">Log</span>
                        </button>
                      </div>
                    </div>
                );
              })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No voters found for this filter.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BoothDetailSlide

