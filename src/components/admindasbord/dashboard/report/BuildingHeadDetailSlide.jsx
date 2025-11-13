import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayUserWiseSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'

const BuildingHeadDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVoterIndex, setSelectedVoterIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch voters from API
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get admin_id from categoryData - try multiple possible field names
      const adminId = categoryData.id || categoryData.admin_id || categoryData.adminId || categoryData.user_id
      
      console.log('Building Head Detail Data:', categoryData)
      console.log('Admin ID (using):', adminId)
      
      if (!adminId) {
        console.error('Admin ID not found in:', categoryData)
        setError('Admin ID not found. Please check console for details.')
        setLoading(false)
        return
      }

      // Get panel API URL from localStorage (optional)
      const panelApiUrl = localStorageManager.getApiUrl()
      console.log('Fetching voters for admin_id:', adminId, 'from:', panelApiUrl || 'default endpoint')
      
      // Call API - survey_from is empty string as per example
      const response = await displayUserWiseSurveyVoter(adminId, '', panelApiUrl)
      
      console.log('API Response Type:', typeof response)
      console.log('API Response:', response)
      console.log('Is Array:', Array.isArray(response))
      
      if (response && Array.isArray(response)) {
        console.log('Voters fetched:', response.length)
        setVoters(response)
        setSelectedVoterIndex(0)
      } else if (response && typeof response === 'object') {
        const votersList = response.result || response.data || response.voters || []
        if (Array.isArray(votersList)) {
          console.log('Voters fetched from wrapped response:', votersList.length)
          setVoters(votersList)
          setSelectedVoterIndex(0)
        } else {
          console.warn('Unexpected response format:', response)
          setVoters([])
        }
      } else {
        console.warn('No voters found in response:', response)
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
    
    return voters.filter(voter => {
      // Get voter status - try multiple field names
      const rawStatus = voter.voter_status || voter.voter_status1 || voter.voterStatus
      
      // Handle null, undefined, empty string, or whitespace-only strings
      const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
      
      switch(activeTab) {
        case 'positive':
          return status === 'p'
        case 'negative':
          return status === 'n'
        case 'doubtful':
          return status === 'd'
        case 'nothing':
          // Show voters with status 'c' (cant say) only
          return status === 'c'
        default:
          return true
      }
    })
  }, [voters, activeTab])

  // Calculate counts for each tab
  const tabCounts = useMemo(() => {
    if (!voters || voters.length === 0) {
      return { positive: 0, negative: 0, doubtful: 0, nothing: 0 }
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
        // Count voters with status 'c' (cant say) only
        return status === 'c'
      }).length
    }
  }, [voters])

  // Get current voter to display
  const currentVoter = useMemo(() => {
    if (filteredVoters.length === 0) return null
    const index = Math.min(selectedVoterIndex, filteredVoters.length - 1)
    return filteredVoters[index]
  }, [filteredVoters, selectedVoterIndex])

  const currentVoterIndex = filteredVoters.length > 0 ? Math.min(selectedVoterIndex, filteredVoters.length - 1) : -1
  const totalVoters = filteredVoters.length

  // Navigation handlers
  const handleNextVoter = () => {
    if (currentVoterIndex < totalVoters - 1) {
      setSelectedVoterIndex(currentVoterIndex + 1)
    }
  }

  const handlePrevVoter = () => {
    if (currentVoterIndex > 0) {
      setSelectedVoterIndex(currentVoterIndex - 1)
    }
  }

  // Reset voter index when tab changes
  useEffect(() => {
    setSelectedVoterIndex(0)
  }, [activeTab])

  // Ensure voter index is within bounds when filtered voters change
  useEffect(() => {
    if (filteredVoters.length > 0 && selectedVoterIndex >= filteredVoters.length) {
      setSelectedVoterIndex(0)
    } else if (filteredVoters.length === 0) {
      setSelectedVoterIndex(0)
    }
  }, [filteredVoters.length, selectedVoterIndex])

  const handleBack = () => {
    navigate('/building-head-survey')
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      {/* Header */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
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

            <h1 className="text-white text-base sm:text-lg font-semibold">{categoryData.name || 'बिल्डिंग प्रमुख'}</h1>
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
              टोटल : {totalVoters || 0}
            </span>
          </div>
          
          {/* Tabs */}
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
        ) : currentVoter ? (
          <>
            {/* Navigation Controls */}
            {totalVoters > 1 && (
              <div className="flex items-center justify-between mb-3 px-2">
                <button
                  onClick={handlePrevVoter}
                  disabled={currentVoterIndex === 0}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                    currentVoterIndex === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-xs sm:text-sm font-medium text-gray-700 px-3 sm:px-4">
                  {currentVoterIndex + 1} / {totalVoters}
                </div>
                
                <button
                  onClick={handleNextVoter}
                  disabled={currentVoterIndex === totalVoters - 1}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                    currentVoterIndex === totalVoters - 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* White Card */}
            <div className="bg-white rounded-md sm:rounded-lg shadow-sm p-3 sm:p-4 mb-3 relative">
              {/* Left border indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-green-500 rounded-l-md"></div>
              
              {/* Name */}
              <div className="mb-3">
                <div className="text-sm sm:text-base font-bold" style={{ color: '#102463' }}>
                  {currentVoterIndex + 1}. {(currentVoter.eng_f_name || '') + ' ' + (currentVoter.f_eng_surname || '')}
                </div>
              </div>

              {/* Information Fields */}
              <div className="space-y-2 sm:space-y-2.5">
                {/* पिता/पति */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">पिता/पति:</div>
                  <div className="text-xs text-gray-900 flex-1">{currentVoter.eng_m_name || '-'}</div>
                </div>

                {/* पता */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">पता:</div>
                  <div className="flex-1 flex items-start justify-between">
                    <div className="text-xs text-gray-900 flex-1">{currentVoter.eng_localityid || '-'}</div>
                    {currentVoter.lat_long && (
                      <button 
                        className="ml-2 flex-shrink-0"
                        onClick={() => {
                          const [lat, lng] = currentVoter.lat_long.split(',')
                          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                        }}
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* क्रमांक */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">क्रमांक:</div>
                  <div className="text-xs text-gray-900 flex-1">{currentVoter.slnoinpart || currentVoter.serialNo || '-'}</div>
                </div>

                {/* मोबाइल */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">मोबाइल:</div>
                  <div className="flex items-center space-x-1 flex-1">
                    <span className="text-xs text-gray-900">{currentVoter.contact_no || currentVoter.mobile || '-'}</span>
                    {currentVoter.contact_no && (
                      <button className="flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* पहचान पत्र नं. */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</div>
                  <div className="text-xs text-gray-900 flex-1">{currentVoter.idcard_no || '-'}</div>
                </div>

                {/* बूथ नं */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">बूथ नं.:</div>
                  <div className="text-xs text-gray-900 flex-1">{currentVoter.part_no || currentVoter.booth_no || '-'}</div>
                </div>

                {/* घर नं */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">घर नं.:</div>
                  <div className="text-xs text-gray-900 flex-1">{currentVoter.eng_house_no || currentVoter.houseNo || '-'}</div>
                </div>

                {/* मतदान स्थान */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</div>
                  <div className="text-xs text-gray-900 flex-1">{currentVoter.eng_polling_location || currentVoter.pollingStation || '-'}</div>
                </div>

                {/* दूसरा पता */}
                <div className="flex items-start">
                  <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">दूसरा पता:</div>
                  <div className="text-xs text-gray-900 flex-1">{currentVoter.add_add || currentVoter.secondAddress || '-'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-4 pt-3 border-t border-gray-200">
                {/* Call Button */}
                {currentVoter.contact_no ? (
                  <a
                    href={`tel:${currentVoter.contact_no}`}
                    className="flex flex-col items-center space-y-1"
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-600 flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">Call</span>
                  </a>
                ) : (
                  <div className="flex flex-col items-center space-y-1 opacity-50">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-400 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">Call</span>
                  </div>
                )}

                {/* Check Button */}
                <button className="flex flex-col items-center space-y-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-600 flex items-center justify-center shadow-sm hover:bg-green-700 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">Check</span>
                </button>

                {/* Family Button */}
                <button className="flex flex-col items-center space-y-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-sm transition-colors" style={{ backgroundColor: '#FFA500' }}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      <path d="M12 14a3 3 0 100-6 3 3 0 000 6z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">Family</span>
                </button>

                {/* Log Button */}
                <button className="flex flex-col items-center space-y-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-600 flex items-center justify-center shadow-sm hover:bg-red-700 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="white" opacity="0.2"/>
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">Log</span>
                </button>
              </div>
            </div>
          </>
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

    </div>
  )
}

export default BuildingHeadDetailSlide

