import React, { useState, useEffect, useCallback } from 'react'
import { displayTypeWiseUserListFromSurvey } from '../../../../apidata'
import PageHeader from '../../common/PageHeader.jsx'

const BuildingHeadSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [surveyData, setSurveyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      <PageHeader
        title="बिल्डिंग प्रमुख - सर्वे"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
      />

      {/* Summary Bar */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-20 mb-7 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
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
            
            <div className="pl-2 sm:pl-5 pr-2 sm:pr-4 py-2 sm:py-4">
              {/* Top Section */}
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                {/* Left: User Icon and Info */}
                <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                  {/* User Icon */}
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4a574' }}>
                    <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  
                  {/* Name, Booth Number and Phone */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-lg md:text-xl font-bold text-gray-900 mb-0 sm:mb-1">
                      {item.name}
                    </div>
                    {item.phone && (
                      <div className="text-xs sm:text-base text-gray-600 mt-0 sm:mt-0.5">
                        {item.phone}
                      </div>
                    )}
                  </div>
                </div>

                 {/* Right: Total Survey */}
                 <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0 ml-1.5 sm:ml-2">
                   <div className="flex items-baseline space-x-1 sm:space-x-1.5">
                     <div className="text-[10px] sm:text-sm text-gray-600 leading-tight" style={{ color: '#8B4513' }}>टोटल सर्वे :</div>
                     <div className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 leading-tight">{item.totalSurvey || 0}</div>
                   </div>
                   {item.phone && (
                     <a 
                       href={`tel:${item.phone}`}
                       className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors flex-shrink-0" 
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
                    <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ backgroundColor: '#103a94' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d2f7a')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#103a94')}
                     >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                     </a>
                   )}
                 </div>
              </div>
                    {/* Availability Section */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                {/* उपलब्ध */}
                <div className="rounded-md sm:rounded-lg p-1 text-center border">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">उपलब्ध</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold">
                    {(Number(item.positive ?? 0) + Number(item.negative ?? 0) + Number(item.doubtful ?? 0) + Number(item.nothing ?? 0))}
                  </div>
                </div>

                {/* अनुपलब्ध */}
                <div className="rounded-md sm:rounded-lg p-1 text-center border">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">अनुपलब्ध</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold">
                    {Number(item.UA ?? 0)}
                  </div>
                </div>
              </div>
              {/* Bottom Section - Survey Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                {/* पॉजिटिव */}
                <div className="bg-green-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">पॉजिटिव</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: '#16a34a' }}>{item.positive}</div>
                </div>

                {/* नेगेटिव */}
                <div className="bg-red-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">नेगेटिव</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: '#dc2626' }}>{item.negative}</div>
                </div>

                {/* डाउटफुल */}
                <div className="bg-orange-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">डाउटफुल</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: '#ea580c' }}>{item.doubtful}</div>
                </div>

                {/* कुछ नहीं */}
                <div className="bg-blue-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">कुछ नहीं</div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: '#2563eb' }}>{item.nothing}</div>
                </div>
              </div>
            </div>
          </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BuildingHeadSurvey
