import React, { useState, useEffect, useCallback } from 'react'
import { displayBoothWiseSurveyDash } from '../../../../apidata'

const BoothWiseSurvey = ({ navigation }) => {
  const { navigate } = navigation
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
        
              <h1 className="text-white text-base sm:text-lg font-semibold">बूथ अनुसार सर्वे</h1>
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

        {/* Summary Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {totalCount}
              </span>
            </div>
          </div>
          </div>
        </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-20 space-y-3 sm:space-y-4 mb-7 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                <div className="bg-green-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">पॉजिटिव</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold text-green-600">{item.positive || 0}</div>
                </div>
                <div className="bg-red-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">नेगेटिव</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold text-red-600">{item.negative || 0}</div>
                </div>
                <div className="bg-orange-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">डाउटफुल</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold text-orange-600">{item.doubtful || 0}</div>
                </div>
                <div className="bg-blue-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">कुछ नहीं</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold text-blue-600">{item.nothing || 0}</div>
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BoothWiseSurvey
