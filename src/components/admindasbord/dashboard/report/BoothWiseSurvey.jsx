import React, { useState, useEffect, useCallback } from 'react'
import { displayBoothWiseSurveyDash } from '../../../../apidata'

const BoothWiseSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [surveyData, setSurveyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Fetch data from API
  const fetchBoothWiseData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const panelApiUrl = localStorage.getItem('panelApiUrl') || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      console.log('Fetching booth wise survey data from:', panelApiUrl)
      
      const response = await displayBoothWiseSurveyDash(panelApiUrl)
      
      console.log('Booth Wise Survey API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Is Array:', Array.isArray(response))
      
      if (response && Array.isArray(response)) {
        console.log('Setting booth data:', response.length, 'items')
        setSurveyData(response)
      } else if (response && typeof response === 'object') {
        // Handle wrapped response
        const dataList = response.result || response.data || response.booths || []
        if (Array.isArray(dataList)) {
          console.log('Setting booth data from wrapped response:', dataList.length, 'items')
          setSurveyData(dataList)
        } else {
          console.warn('Unexpected response format:', response)
          setSurveyData([])
        }
      } else {
        console.warn('No data found in response:', response)
        setSurveyData([])
      }
    } catch (err) {
      console.error('Error fetching booth wise survey data:', err)
      console.error('Error details:', err.message, err.stack)
      setError(err.message || 'Failed to fetch data')
      setSurveyData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoothWiseData()
  }, [fetchBoothWiseData])

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
      item.boothNo?.toString().toLowerCase().includes(query) ||
      item.voters?.toString().includes(query)
    )
  })

  const totalCount = filteredData.length

  const handleCardClick = (item, index) => {
    navigate('/booth-survey-detail', {
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
        
        <h1 className="text-white text-base sm:text-lg md:text-xl font-bold text-center flex-1 px-2">बूथ अनुसार सर्वे</h1>
        
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
              placeholder="बूथ नंबर या मतदाता से खोजें..."
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
              onClick={fetchBoothWiseData}
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
            key={item.id || `booth-${index}`}
            className="bg-white rounded-lg sm:rounded-xl shadow-sm w-full overflow-hidden mb-3 sm:mb-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick(item, index)}
          >
            <div className="p-3 sm:p-4 md:p-5">
              {/* Top Section */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                {/* Left: Booth Number and Voters */}
                <div className="flex-1">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1.5">
                    बूथ नं. : {item.boothNo || 'N/A'}
                  </div>
                  <div className="text-sm sm:text-base md:text-lg text-gray-700 font-medium">
                    मतदाता : {item.voters ? item.voters.toLocaleString() : '0'}
                  </div>
                </div>

                {/* Right: Survey Count */}
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                    सर्वे : {item.survey || 0}
                  </div>
                </div>
              </div>

              {/* Bottom Section - Survey Breakdown */}
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
                {/* पॉजिटिव */}
                <div className="bg-green-50 rounded-md p-2.5 sm:p-3 text-center border border-green-100">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">पॉजिटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-green-600">{item.positive || 0}</div>
                </div>

                {/* नेगेटिव */}
                <div className="bg-red-50 rounded-md p-2.5 sm:p-3 text-center border border-red-100">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">नेगेटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-red-600">{item.negative || 0}</div>
                </div>

                {/* डाउटफुल */}
                <div className="bg-orange-50 rounded-md p-2.5 sm:p-3 text-center border border-orange-100">
                  <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">डाउटफुल</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-orange-600">{item.doubtful || 0}</div>
                </div>

                {/* कुछ नहीं */}
                <div className="bg-blue-50 rounded-md p-2.5 sm:p-3 text-center border border-blue-100">
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
      <div className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 py-2.5 sm:py-3 z-20 shadow-lg" style={{ backgroundColor: '#102463' }}>
        <div className="text-sm sm:text-base md:text-lg font-bold text-white text-center">टोटल : {totalCount}</div>
      </div>
    </div>
  )
}

export default BoothWiseSurvey
