import React, { useState, useEffect, useCallback } from 'react'
import { displayCasteWiseSurveyDash } from '../../../../apidata'
import PageHeader from '../../common/PageHeader.jsx'

const CasteWiseSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [searchQuery, setSearchQuery] = useState('')
  const [casteData, setCasteData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Fetch data from API
  const fetchCasteWiseData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const panelApiUrl = localStorage.getItem('panelApiUrl') || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      const response = await displayCasteWiseSurveyDash(panelApiUrl)
      
      if (response && Array.isArray(response)) {
        setCasteData(response)
      } else {
        setCasteData([])
      }
    } catch (err) {
      console.error('Error fetching caste wise survey data:', err)
      setError(err.message || 'Failed to fetch data')
      setCasteData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCasteWiseData()
  }, [fetchCasteWiseData])

  const handleBack = () => {
    navigate('/cadre-survey-report')
  }

  // Filter data based on search query
  const filteredData = casteData.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return item.casteName.toLowerCase().includes(query)
  })

  const totalCount = filteredData.length

  const handleCardClick = (item, index) => {
    navigate('/caste-detail', {
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
        <PageHeader
          title="कास्ट अनुसार सर्वे"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

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
              onClick={fetchCasteWiseData}
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
            key={item.id || `caste-${index}`}
            className="bg-white rounded-lg sm:rounded-xl shadow-sm w-full overflow-hidden mb-3 sm:mb-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick(item, index)}
          >
            <div className="p-3 sm:p-4">
              {/* Mobile Card Layout - Similar to EducationProfessionWiseSurvey */}
              <div className="flex items-center justify-between gap-2">
                {/* Left Side: Avatar and Caste Info */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Avatar Circle with Number */}
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-sm text-white font-semibold text-sm sm:text-base" style={{ backgroundColor: '#D2B48C' }}>
                    {index + 1}
                  </div>
                  
                  {/* Caste Name and Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">
                      {item.casteName || 'N/A'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">
                      टोटल मतदाता: {item.totalVoters || 0}
                    </div>
                  </div>
                </div>

                {/* Right Side: Total Survey */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <div className="text-xs sm:text-sm font-medium whitespace-nowrap" style={{ color: '#8B4513' }}>
                    टोटल सर्वे: {item.totalSurvey || 0}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
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

export default CasteWiseSurvey

