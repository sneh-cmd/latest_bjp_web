import React, { useState, useEffect, useCallback } from 'react'
import { displayTypeWiseUserListFromSurvey } from '../../../../apidata'

const BuildingHeadSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [surveyData, setSurveyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUnsurveyedModal, setShowUnsurveyedModal] = useState(false)
  const [selectedLeader, setSelectedLeader] = useState(null)

  // Fetch survey data from API
  const fetchSurveyData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // survey_by_type: "ap" for Address Pramukh/Building Head
      const data = await displayTypeWiseUserListFromSurvey('ap', '')
      
      console.log('Building Head Survey Data:', data)
      
      // Handle different response formats
      if (Array.isArray(data) && data.length > 0) {
        setSurveyData(data)
      } else if (data && Array.isArray(data.data)) {
        setSurveyData(data.data)
      } else if (data && Array.isArray(data.result)) {
        setSurveyData(data.result)
      } else {
        setSurveyData([])
      }
    } catch (err) {
      console.error('Error fetching Building Head survey data:', err)
      setError(err.message || 'Failed to fetch survey data')
      setSurveyData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSurveyData()
  }, [fetchSurveyData])

  const handleBack = () => {
    navigate('/cadre-survey-report')
  }

  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchQuery('')
    }
  }

  // Filter data based on search query
  const filteredData = surveyData.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.phone.includes(query)
    )
  })

  const totalCount = filteredData.length

  // Filter data for unsurveyed leaders (totalSurvey === 0)
  const unsurveyedData = surveyData.filter(item => (item.totalSurvey || 0) === 0)
  const unsurveyedCount = unsurveyedData.length

  const handleUnsurveyedClick = () => {
    setShowUnsurveyedModal(true)
  }

  const handleCloseUnsurveyedModal = () => {
    setShowUnsurveyedModal(false)
    setSelectedLeader(null)
  }

  const handleLeaderClick = (leader) => {
    setSelectedLeader(leader)
  }



  const handleCardClick = (item) => {
    // Navigate to detail slide with category data
    console.log('Navigating to BuildingHeadDetailSlide with item:', item)
    navigate('/building-head-detail-slide', {
      categoryData: item
    })
  }


  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-md" style={{ backgroundColor: '#102463' }}>
        <button
          onClick={handleBack}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white text-base sm:text-lg md:text-xl font-bold text-center flex-1 px-2">बिल्डिंग प्रमुख - सर्वे</h1>
        
        <button 
          onClick={handleSearchToggle}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      {showSearch && (
        <div className="sticky top-[60px] sm:top-[64px] z-10 w-full px-3 sm:px-4 md:px-6 py-2 bg-white border-b shadow-md">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="नाम या फोन नंबर से खोजें..."
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="
w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-20 space-y-3 sm:space-y-4 mb-7">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
            <p className="mt-4 text-gray-600">डेटा लोड हो रहा है...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-red-700 text-base sm:text-lg font-semibold mb-4">{error}</p>
            <button
              onClick={fetchSurveyData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              style={{ backgroundColor: '#102463' }}
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Data Display */}
        {!loading && !error && (
          <>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-base sm:text-lg">कोई परिणाम नहीं मिला</p>
              </div>
            ) : (
              filteredData.map((item, index) => (
          <div 
            key={item.id}
            onClick={() => handleCardClick(item)}
            className="bg-white rounded-lg sm:rounded-xl shadow-md w-full overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            {/* Left border indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2" style={{ backgroundColor: '#102463' }}></div>
            
            <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-3 sm:py-4">
              {/* Top Section */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                {/* Left: User Icon and Info */}
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                  {/* User Icon */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4a574' }}>
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  
                  {/* Name, Booth Number and Phone */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1">
                      {item.name} {item.designation ? `(${item.designation})` : item.designation === null ? '(null)' : ''}
                    </div>
                    {item.phone && (
                      <div className="text-sm sm:text-base text-gray-600 mt-0.5">
                        {item.phone}
                      </div>
                    )}
                  </div>
                </div>

                 {/* Right: Total Survey */}
                 <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-2">
                   <div className="flex items-baseline space-x-1.5">
                     <div className="text-xs sm:text-sm text-gray-600 leading-tight" style={{ color: '#8B4513' }}>टोटल सर्वे :</div>
                     <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight">{item.totalSurvey || 0}</div>
                   </div>
                   {item.phone && (
                     <a 
                       href={`tel:${item.phone}`}
                       className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors flex-shrink-0" 
                       style={{ 
                         backgroundColor: '#E3F2FD',
                         color: '#102463'
                       }}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.backgroundColor = '#BBDEFB'
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.backgroundColor = '#E3F2FD'
                       }}
                       onClick={(e) => {
                         e.stopPropagation()
                         window.location.href = `tel:${item.phone}`
                       }}
                     >
                       <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                       </svg>
                     </a>
                   )}
                 </div>
              </div>

              {/* Bottom Section - Survey Breakdown */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {/* पॉजिटिव */}
                <div className="bg-green-50 rounded-md sm:rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1">पॉजिटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#16a34a' }}>{item.positive}</div>
                </div>

                {/* नेगेटिव */}
                <div className="bg-red-50 rounded-md sm:rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1">नेगेटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#dc2626' }}>{item.negative}</div>
                </div>

                {/* डाउटफुल */}
                <div className="bg-orange-50 rounded-md sm:rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1">डाउटफुल</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#ea580c' }}>{item.doubtful}</div>
                </div>

                {/* कुछ नहीं */}
                <div className="bg-blue-50 rounded-md sm:rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1">कुछ नहीं</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#2563eb' }}>{item.nothing}</div>
                </div>
              </div>
            </div>
          </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black px-4 sm:px-6 py-2 sm:py-3 z-20">
        <div className="bg-white rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 inline-block">
          <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">टोटल : {totalCount}</span>
        </div>
      </div>


      {/* Unsurveyed Leaders Slide-in Modal */}
      {showUnsurveyedModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleCloseUnsurveyedModal}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black transition-opacity duration-300"
            style={{ 
              opacity: showUnsurveyedModal ? 0.5 : 0,
              animation: 'fadeIn 0.3s ease-out'
            }}
          ></div>
          
          {/* Slide-in Panel */}
          <div 
            className="relative w-full h-[90vh] sm:h-[85vh] sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b shadow-sm" style={{ backgroundColor: '#102463' }}>
              <h2 className="text-white text-lg sm:text-xl font-bold">सर्वे नहीं किए हुए प्रमुख</h2>
              <button
                onClick={handleCloseUnsurveyedModal}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4" style={{ backgroundColor: '#e5e8ff' }}>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
                  <p className="mt-4 text-gray-600">डेटा लोड हो रहा है...</p>
                </div>
              ) : unsurveyedData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-base sm:text-lg">सभी प्रमुखों ने सर्वे किया है</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {unsurveyedData.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleLeaderClick(item)}
                      className="bg-white rounded-lg sm:rounded-xl shadow-md w-full overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow duration-200"
                    >
                      {/* Left border indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2" style={{ backgroundColor: '#102463' }}></div>
                      
                      <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-3 sm:py-4">
                        <div className="flex items-start justify-between">
                          {/* Left: User Icon and Info */}
                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                            {/* User Icon */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4a574' }}>
                              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            </div>
                            
                            {/* Name, Designation and Booth Numbers */}
                            <div className="flex-1 min-w-0">
                              <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1">
                                {item.name}
                              </div>
                              {item.designation && (
                                <div className="text-sm sm:text-base text-gray-600 mb-1">
                                  ({item.designation})
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Call Icon */}
                          {item.phone && (
                            <a 
                              href={`tel:${item.phone}`}
                              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ml-2" 
                              style={{ 
                                backgroundColor: '#E3F2FD',
                                color: '#102463'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#BBDEFB'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#E3F2FD'
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `tel:${item.phone}`
                              }}
                            >
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-black px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
              <div className="bg-white rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
                <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">टोटल : {unsurveyedCount}</span>
              </div>
              {/* Excel Export Icon */}
              <button className="bg-green-600 hover:bg-green-700 rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.5;
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}

export default BuildingHeadSurvey
