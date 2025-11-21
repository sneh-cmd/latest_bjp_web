import React, { useState, useEffect, useCallback } from 'react'
import { displayDateWiseSurveyDash } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import PageHeader from '../../common/PageHeader.jsx'
import CalendarModal from '../../modals/CalendarModal.jsx'

const DateWiseSurvey = ({ navigation }) => {
  const { navigate } = navigation
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Generate default data structure for a month (fallback if API fails)
  const generateDefaultDateData = (year, monthIndex) => {
    const data = []
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    
    for (let i = 1; i <= daysInMonth; i++) {
      const day = String(i).padStart(2, '0')
      const monthName = monthNames[monthIndex]
      data.push({
        id: i,
        date: `${day}, ${monthName}, ${year}`,
        surveyCount: 0,
      })
    }
    return data
  }

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(9) // October (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [dateSurveyData, setDateSurveyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [tempMonthIndex, setTempMonthIndex] = useState(9)
  const [tempYear, setTempYear] = useState(2025)

  // Convert month/year to API format (YYYY-MM-DD, first day of month)
  const getMonthForAPI = useCallback((year, monthIndex) => {
    const month = String(monthIndex + 1).padStart(2, '0')
    return `${year}-${month}-01`
  }, [])

  // Fetch data from API
  const fetchDateWiseData = useCallback(async (year, monthIndex) => {
    setLoading(true)
    setError(null)
    
    try {
      const monthParam = getMonthForAPI(year, monthIndex)
      console.log('Fetching date-wise survey data for:', monthParam)
      
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await displayDateWiseSurveyDash(monthParam, panelApiUrl)
      
      console.log('API Response:', response)
      
      if (Array.isArray(response) && response.length > 0) {
        console.log('API returned', response.length, 'items')
        // API returned data - merge with default structure to ensure all days are shown
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
        const defaultData = generateDefaultDateData(year, monthIndex)
        
        console.log('Days in month:', daysInMonth)
        console.log('Default data length:', defaultData.length)
        
        // Create a map of API data by day number
        const apiDataMap = new Map()
        response.forEach((item, idx) => {
          console.log(`Processing API item ${idx}:`, item)
          
          // Extract day from date string
          let day = null
          if (item.date) {
            // Try to extract day from formatted date (DD, Mon, YYYY)
            const match = item.date.match(/^(\d+),/)
            if (match) {
              day = parseInt(match[1])
              console.log(`Extracted day from formatted date: ${day}`)
            }
          }
          
          // If not found, try rawDate (YYYY-MM-DD format)
          if (!day && item.rawDate) {
            const parts = item.rawDate.split('-')
            if (parts.length === 3) {
              day = parseInt(parts[2])
              console.log(`Extracted day from rawDate: ${day}`)
            }
          }
          
          // If still not found, try to extract from date if it's in YYYY-MM-DD format
          if (!day && item.date && item.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const parts = item.date.split('-')
            if (parts.length === 3) {
              day = parseInt(parts[2])
              console.log(`Extracted day from date YYYY-MM-DD: ${day}`)
            }
          }
          
          // Use index + 1 as fallback
          if (!day) {
            day = idx + 1
            console.log(`Using index as day: ${day}`)
          }
          
          if (day >= 1 && day <= daysInMonth) {
            const surveyCount = Number(item.surveyCount || 0)
            console.log(`Setting day ${day} with surveyCount: ${surveyCount}`)
            
            apiDataMap.set(day, {
              id: item.id || day,
              date: item.date || defaultData[day - 1]?.date || `${String(day).padStart(2, '0')}, ${monthNames[monthIndex]}, ${year}`,
              surveyCount: surveyCount
            })
          } else {
            console.warn(`Day ${day} is out of range (1-${daysInMonth})`)
          }
        })
        
        console.log('API data map:', Array.from(apiDataMap.entries()))
        
        // Merge: use API data if available, otherwise use default (0 survey count)
        const mergedData = defaultData.map((defaultItem, index) => {
          const day = index + 1
          const apiItem = apiDataMap.get(day)
          if (apiItem) {
            console.log(`Day ${day}: Using API data, surveyCount: ${apiItem.surveyCount}`)
            return apiItem
          } else {
            console.log(`Day ${day}: Using default data, surveyCount: 0`)
            return defaultItem
          }
        })
        
        console.log('Final merged data:', mergedData)
        setDateSurveyData(mergedData)
      } else {
        // No data from API - use default structure
        console.log('No data from API, using default structure')
        setDateSurveyData(generateDefaultDateData(year, monthIndex))
      }
    } catch (err) {
      console.error('Error fetching date-wise survey data:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      // On error, use default structure
      setDateSurveyData(generateDefaultDateData(year, monthIndex))
    } finally {
      setLoading(false)
    }
  }, [getMonthForAPI])

  // Update data when month or year changes
  useEffect(() => {
    fetchDateWiseData(selectedYear, selectedMonthIndex)
    setSearchQuery('') // Clear search when month/year changes
  }, [selectedMonthIndex, selectedYear, fetchDateWiseData])



  const handleBack = () => {
    navigate('/cadre-survey-report')
  }

  const handleMonthYearClick = () => {
    setTempMonthIndex(selectedMonthIndex)
    setTempYear(selectedYear)
    setShowMonthYearPicker(true)
  }

  const handleMonthSelect = (monthIndex) => {
    setTempMonthIndex(monthIndex)
  }

  const handleYearSelect = (year) => {
    setTempYear(year)
  }

  const handleCalendarCancel = () => {
    setShowMonthYearPicker(false)
  }

  const handleCalendarOK = () => {
    setSelectedMonthIndex(tempMonthIndex)
    setSelectedYear(tempYear)
    setShowMonthYearPicker(false)
    // fetchDateWiseData will be called automatically via useEffect
  }

  const handleYearChange = (delta) => {
    setTempYear(prev => prev + delta)
  }

  const handleCardClick = (item, index) => {
    // Extract date in YYYY-MM-DD format for API
    let dateForAPI = null
    
    // Try to extract from rawDate if available
    if (item.rawDate) {
      dateForAPI = item.rawDate
    } else if (item.date) {
      // Try to parse from formatted date (DD, Mon, YYYY)
      const match = item.date.match(/^(\d+),\s*(\w+),\s*(\d+)$/)
      if (match) {
        const day = match[1].padStart(2, '0')
        const monthName = match[2]
        const year = match[3]
        const monthIndex = monthNames.indexOf(monthName)
        if (monthIndex !== -1) {
          const month = String(monthIndex + 1).padStart(2, '0')
          dateForAPI = `${year}-${month}-${day}`
        }
      }
    }
    
    // If still not found, construct from selected month/year and day
    if (!dateForAPI) {
      const day = String(item.id || index + 1).padStart(2, '0')
      const month = String(selectedMonthIndex + 1).padStart(2, '0')
      dateForAPI = `${selectedYear}-${month}-${day}`
    }
    
    navigate('/date-detail', {
      categoryData: {
        ...item,
        dateForAPI: dateForAPI,
        index: index
      }
    })
  }

  const selectedMonth = monthNames[selectedMonthIndex]

  // Filter data based on search query
  const filteredData = dateSurveyData.filter(item => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return item.date.toLowerCase().includes(query)
  })

  const totalDays = filteredData.length

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        <PageHeader
          title="तारीख अनुसार सर्वे"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
              />

        {/* Summary Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {totalDays}
              </span>
            </div>

            <button
              onClick={handleMonthYearClick}
              className="flex items-center justify-center py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              style={{ 
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-blue-800 text-sm sm:text-base font-bold">
                {selectedMonth} {selectedYear}
              </span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="

w-full px-3 sm:px-4 md:px-6 py-4 sm:py-4 pb-20 mb-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-base sm:text-lg text-gray-500 mt-4">डेटा लोड हो रहा है...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="text-base sm:text-lg">{error}</p>
            <button
              onClick={() => fetchDateWiseData(selectedYear, selectedMonthIndex)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 justify-items-start max-w-7xl mx-auto">
            {filteredData.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p className="text-base sm:text-lg">कोई परिणाम नहीं मिला</p>
              </div>
            ) : (
              filteredData.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item, index)}
              className="group bg-gradient-to-br from-white via-blue-50 to-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md border border-blue-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer relative overflow-hidden"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                width: '100%',
                maxWidth: '100%'
              }}
            >
              {/* Decorative Corner Accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-transparent rounded-bl-full opacity-50"></div>
              
              {/* Date Section */}
              <div className="mb-2 relative z-10">
                <div className="text-xs text-blue-600 font-semibold mb-0.5 uppercase tracking-wide">तारीख</div>
                <div className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                  {item.date}
                </div>
              </div>

              {/* Survey Count Section */}
              <div className="mt-3 pt-3 border-t border-blue-100 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">सर्वे</span>
                  <div className={`px-3 py-1.5 rounded-lg font-bold text-sm sm:text-base shadow-md group-hover:shadow-lg transition-shadow duration-300 ${
                    item.surveyCount > 0 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  }`}>
                    {item.surveyCount}
                  </div>
                </div>
              </div>
            </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Calendar Modal */}
      <CalendarModal
        show={showMonthYearPicker}
        onClose={handleCalendarCancel}
        onConfirm={handleCalendarOK}
        tempMonthIndex={tempMonthIndex}
        tempYear={tempYear}
        onMonthSelect={handleMonthSelect}
        onYearSelect={handleYearSelect}
        monthNames={monthNames}
        startYear={2015}
        endYear={2034}
        title="Calendar"
      />
    </div>
  )
}

export default DateWiseSurvey


