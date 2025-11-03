import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayCommunityWiseSurveyVoter } from '../../../../apidata'

const CommunityDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVoter, setSelectedVoter] = useState(null)

  // Fetch voters based on category id and active tab
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try multiple possible field names for category ID
      let categoryId = categoryData.id || categoryData.categoryId || categoryData.category_id || categoryData.community_id
      
      // If ID is not found, try using category name or index as fallback
      if (!categoryId) {
        // Try using index as ID (since API might use 1-based index)
        if (categoryData.index !== undefined) {
          categoryId = categoryData.index + 1
        } else if (categoryData.communityName) {
          // As last resort, try using community name (API might accept it)
          categoryId = categoryData.communityName
        }
      }
      
      console.log('Community Data:', categoryData)
      console.log('Community ID (using):', categoryId)
      
      if (!categoryId) {
        console.error('Community ID not found in:', categoryData)
        setError('Community ID not found. Please check console for details.')
        setLoading(false)
        return
      }

      const panelApiUrl = localStorage.getItem('panelApiUrl') || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      console.log('Fetching voters for community ID:', categoryId, 'from:', panelApiUrl)
      
      // Using community wise survey voter API
      const response = await displayCommunityWiseSurveyVoter(categoryId, panelApiUrl)
      
      console.log('API Response:', response)
      
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
      console.error('Error fetching community wise survey voters:', err)
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
      if (!voter.voterStatus) {
        // If no status, show only when on positive tab (default)
        return activeTab === 'positive'
      }
      
      // Compare voter_status (case-insensitive)
      const voterStatus = voter.voterStatus.toString().toLowerCase().trim()
      return voterStatus === expectedStatus
    })
    
    console.log(`Filtering voters - Tab: ${activeTab}, Expected Status: ${expectedStatus}, Found: ${filtered.length} voters`)
    
    return filtered
  }, [voters, activeTab])
  
  // Update selected voter when filtered list or tab changes
  useEffect(() => {
    if (filteredVoters.length > 0) {
      // If current selected voter is not in filtered list, select first from filtered
      const isCurrentVoterInFiltered = selectedVoter && filteredVoters.some(v => v.id === selectedVoter.id)
      if (!isCurrentVoterInFiltered) {
        setSelectedVoter(filteredVoters[0])
      }
    } else {
      setSelectedVoter(null)
    }
  }, [filteredVoters, activeTab, selectedVoter])

  // Calculate counts for each tab from fetched voters
  const tabCounts = {
    positive: voters.filter(v => v.voterStatus?.toLowerCase() === 'p').length,
    negative: voters.filter(v => v.voterStatus?.toLowerCase() === 'n').length,
    doubtful: voters.filter(v => v.voterStatus?.toLowerCase() === 'd').length,
    nothing: voters.filter(v => v.voterStatus?.toLowerCase() === 'c').length
  }

  // Get current voter data to display
  const currentVoter = selectedVoter || filteredVoters[0] || null

  const handleBack = () => {
    navigate('/community-wise-survey')
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
      {/* Header */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-md" style={{ backgroundColor: '#102463' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-sm sm:text-base font-medium">{categoryData.communityName || 'विवरण'}</h1>
        </div>
        
        <button className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[60px] sm:top-[64px] z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('positive')}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative ${
              activeTab === 'positive'
                ? 'text-gray-900 bg-green-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            पॉजिटिव-{tabCounts.positive || categoryData.positive || 0}
            {activeTab === 'positive' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('negative')}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative ${
              activeTab === 'negative'
                ? 'text-gray-900 bg-red-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            नेगेटिव-{tabCounts.negative || categoryData.negative || 0}
            {activeTab === 'negative' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('doubtful')}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative ${
              activeTab === 'doubtful'
                ? 'text-gray-900 bg-orange-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            डाउटफुल-{tabCounts.doubtful || categoryData.doubtful || 0}
            {activeTab === 'doubtful' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('nothing')}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all relative ${
              activeTab === 'nothing'
                ? 'text-gray-900 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            कुछ नहीं-{tabCounts.nothing || categoryData.nothing || 0}
            {activeTab === 'nothing' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
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
              <p>Community Data: {JSON.stringify(categoryData, null, 2)}</p>
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
                                // Handle edit mobile action
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

                        {/* बूथ नंः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">बूथ नंः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.boothNo || 'N/A'}</span>
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

                      {/* Action Buttons - 4 buttons as per image */}
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
                            <span className="text-white text-lg sm:text-xl font-bold lowercase" style={{ fontFamily: 'sans-serif' }}>i</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Log</span>
                        </button>
                      </div>
                    </div>
                  </div>
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

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 py-2.5 sm:py-3 z-20 shadow-lg bg-black">
        <div className="text-sm sm:text-base md:text-lg font-bold text-white text-center">
          टोटल : {filteredVoters.length || 0}
        </div>
      </div>
    </div>
  )
}

export default CommunityDetailSlide

