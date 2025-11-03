import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayUserWiseSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'

const PhonebookDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch voters from API
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get admin_id from categoryData - try multiple possible field names
      const adminId = categoryData.id || categoryData.admin_id || categoryData.adminId || categoryData.user_id
      
      console.log('Phonebook Detail Data:', categoryData)
      console.log('Admin ID (using):', adminId)
      
      if (!adminId) {
        console.error('Admin ID not found in:', categoryData)
        setError('Admin ID not found. Please check console for details.')
        setLoading(false)
        return
      }

      // Get panel API URL from localStorage (optional)
      const panelApiUrl = localStorageManager.getApiUrl()
      console.log('Fetching voters for admin_id:', adminId, 'survey_from: ph', 'from:', panelApiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx')
      
      // Call API - survey_from is 'ph' for Phonebook as per SOAP API specification
      // API: http://ntmc2.mhbjplok.com/webservice.asmx?op=dis_user_wise_survey_voter
      const response = await displayUserWiseSurveyVoter(adminId, 'ph', panelApiUrl)
      
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

  const totalVoters = filteredVoters.length

  const handleBack = () => {
    navigate('/phonebook-survey')
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-md" style={{ backgroundColor: '#102463' }}>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBack}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-sm sm:text-base md:text-lg font-bold">{categoryData.name || 'फोनबूक'}</h1>
        </div>
        
        <button 
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Tabs - Below Header */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-2 bg-white border-b flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('positive')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'positive' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          पॉजिटिव-{tabCounts.positive}
        </button>
        <button
          onClick={() => setActiveTab('negative')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'negative' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          नेगेटिव-{tabCounts.negative}
        </button>
        <button
          onClick={() => setActiveTab('doubtful')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'doubtful' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          डाउटफुल-{tabCounts.doubtful}
        </button>
        <button
          onClick={() => setActiveTab('nothing')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'nothing' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          कुछ नहीं-{tabCounts.nothing}
        </button>
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
          <div className="space-y-3 sm:space-y-4">
            {filteredVoters.map((voter, index) => (
              <div key={voter.id || index} className="bg-white rounded-md sm:rounded-lg shadow-sm p-3 sm:p-4 relative">
                {/* Left border indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-green-500 rounded-l-md"></div>
                
                {/* Name */}
                <div className="mb-3">
                  <div className="text-sm sm:text-base font-bold" style={{ color: '#102463' }}>
                    {index + 1}. {(voter.eng_f_name || '') + ' ' + (voter.f_eng_surname || '')}
                  </div>
                </div>

                {/* Information Fields */}
                <div className="space-y-2 sm:space-y-2.5">
                  {/* पिता/पति */}
                  <div className="flex items-start">
                    <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">पिता/पति:</div>
                    <div className="text-xs text-gray-900 flex-1">{voter.eng_m_name || '-'}</div>
                  </div>

                  {/* पता */}
                  <div className="flex items-start">
                    <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">पता:</div>
                    <div className="flex-1 flex items-start justify-between">
                      <div className="text-xs text-gray-900 flex-1">{voter.eng_localityid || '-'}</div>
                      {voter.lat_long && (
                        <button 
                          className="ml-2 flex-shrink-0"
                          onClick={() => {
                            const [lat, lng] = voter.lat_long.split(',')
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
                    <div className="text-xs text-gray-900 flex-1">{voter.slnoinpart || voter.serialNo || '-'}</div>
                  </div>

                  {/* मोबाइल */}
                  <div className="flex items-start">
                    <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">मोबाइल:</div>
                    <div className="flex items-center space-x-1 flex-1">
                      <span className="text-xs text-gray-900">{voter.contact_no || voter.mobile || '-'}</span>
                      {voter.contact_no && (
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
                    <div className="text-xs text-gray-900 flex-1">{voter.idcard_no || '-'}</div>
                  </div>

                  {/* बूथ नं */}
                  <div className="flex items-start">
                    <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">बूथ नं.:</div>
                    <div className="text-xs text-gray-900 flex-1">{voter.part_no || voter.booth_no || '-'}</div>
                  </div>

                  {/* घर नं */}
                  <div className="flex items-start">
                    <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">घर नं.:</div>
                    <div className="text-xs text-gray-900 flex-1">{voter.eng_house_no || voter.houseNo || '-'}</div>
                  </div>

                  {/* मतदान स्थान */}
                  <div className="flex items-start">
                    <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</div>
                    <div className="text-xs text-gray-900 flex-1">{voter.eng_polling_location || voter.pollingStation || '-'}</div>
                  </div>

                  {/* दूसरा पता */}
                  <div className="flex items-start">
                    <div className="text-xs text-gray-600 w-20 sm:w-24 flex-shrink-0">दूसरा पता:</div>
                    <div className="text-xs text-gray-900 flex-1">{voter.add_add || voter.secondAddress || '-'}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-4 pt-3 border-t border-gray-200">
                  {/* Call Button */}
                  {voter.contact_no ? (
                    <a
                      href={`tel:${voter.contact_no}`}
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

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black px-3 sm:px-4 py-2 z-20">
        <div className="bg-white rounded-md px-2.5 sm:px-3 py-1 sm:py-1.5 inline-block">
          <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900">टोटल : {totalVoters}</span>
        </div>
      </div>
    </div>
  )
}

export default PhonebookDetailSlide

