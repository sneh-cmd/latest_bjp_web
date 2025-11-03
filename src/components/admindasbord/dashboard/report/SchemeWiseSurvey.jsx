import React, { useState, useEffect, useCallback } from 'react'
import { displaySchemeWiseSurveyDash } from '../../../../apidata'

const SchemeWiseSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [schemeData, setSchemeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Fetch data from API
  const fetchSchemeWiseData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const panelApiUrl = localStorage.getItem('panelApiUrl') || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      const response = await displaySchemeWiseSurveyDash(panelApiUrl)
      
      if (response && Array.isArray(response)) {
        setSchemeData(response)
      } else {
        setSchemeData([])
      }
    } catch (err) {
      console.error('Error fetching scheme wise survey data:', err)
      setError(err.message || 'Failed to fetch data')
      setSchemeData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchemeWiseData()
  }, [fetchSchemeWiseData])

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
  const filteredData = schemeData.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return item.schemeName.toLowerCase().includes(query)
  })

  const totalCount = filteredData.length

  const handleCardClick = (item, index) => {
    navigate('/scheme-detail', {
      categoryData: {
        ...item,
        index
      }
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
        
        <h1 className="text-white text-base sm:text-lg md:text-xl font-bold text-center flex-1 px-2">योजना अनुसार सर्वे</h1>
        
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
              placeholder="योजना नाम से खोजें..."
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
      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-20 space-y-3 sm:space-y-4 mb-7">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-base sm:text-lg text-gray-500 mt-4">डेटा लोड हो रहा है...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="text-base sm:text-lg">{error}</p>
            <button
              onClick={fetchSchemeWiseData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-base sm:text-lg">कोई परिणाम नहीं मिला</p>
          </div>
        ) : (
          filteredData.map((item, index) => (
          <div 
            key={item.id || `scheme-${index}`}
            className="bg-white rounded-lg sm:rounded-xl shadow-sm w-full overflow-hidden mb-3 sm:mb-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick(item, index)}
          >
            <div className="p-3 sm:p-4">
              {/* Mobile Card Layout - Similar to RationCardWiseSurvey */}
              <div className="flex items-center justify-between">
                {/* Left Side: Avatar and Scheme Info */}
                <div className="flex items-center gap-3 flex-1">
                  {/* Avatar Circle with Number */}
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-sm text-white font-bold text-lg sm:text-xl" style={{ backgroundColor: '#102463' }}>
                    {index + 1}
                  </div>
                  
                  {/* Scheme Name and Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                      {item.schemeName || 'N/A'}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">
                      टोटल मतदाता : {item.totalVoters || 0}
                    </div>
                  </div>
                </div>

                {/* Right Side: Total Survey with Call Icon */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-sm sm:text-base font-medium" style={{ color: '#8B4513' }}>
                    टोटल सर्वे : {item.totalSurvey || 0}
                  </div>
                  <button 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow" 
                    style={{ backgroundColor: '#ADD8E6' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle call action - you can add phone number logic here
                      console.log('Call action for:', item.schemeName)
                    }}
                    title="Call"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#00008B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Survey Breakdown Boxes - Below the main card */}
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                {/* पॉजिटिव */}
                <div className="bg-green-50 rounded-md p-2 sm:p-2.5 text-center border border-green-100">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">पॉजिटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-green-600">{item.positive || 0}</div>
                </div>

                {/* नेगेटिव */}
                <div className="bg-red-50 rounded-md p-2 sm:p-2.5 text-center border border-red-100">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">नेगेटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-red-600">{item.negative || 0}</div>
                </div>

                {/* डाउटफुल */}
                <div className="bg-orange-50 rounded-md p-2 sm:p-2.5 text-center border border-orange-100">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">डाउटफुल</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-orange-600">{item.doubtful || 0}</div>
                </div>

                {/* कुछ नहीं */}
                <div className="bg-blue-50 rounded-md p-2 sm:p-2.5 text-center border border-blue-100">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">कुछ नहीं</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600">{item.nothing || 0}</div>
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 py-2.5 sm:py-3 z-20 shadow-lg bg-black">
        <div className="text-sm sm:text-base md:text-lg font-bold text-white text-center">टोटल : {totalCount}</div>
      </div>
    </div>
  )
}

export default SchemeWiseSurvey
