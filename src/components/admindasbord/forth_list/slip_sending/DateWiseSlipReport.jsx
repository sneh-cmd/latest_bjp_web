import React, { useRef, useState, useEffect, useCallback } from 'react'
import PageHeader from '../../common/PageHeader'
import CalendarModal from '../../modals/CalendarModal'
import { dis_date_wise_slip_distribution } from '../../../../apidata.jsx'
import localStorageManager from '../../../../utils/localStorage.js'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DateWiseSlipReport = ({ navigation }) => {
  const { navigate } = navigation
  const containerRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(9) // October (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [tempMonthIndex, setTempMonthIndex] = useState(9)
  const [tempYear, setTempYear] = useState(2025)
  
  const [dateWiseData, setDateWiseData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Format month for API (YYYY-MM-DD format, first day of month)
  const formatMonthForAPI = useCallback((monthIndex, year) => {
    const month = String(monthIndex + 1).padStart(2, '0')
    return `${year}-${month}-01`
  }, [])

  // Fetch date wise slip distribution data
  const fetchDateWiseData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const panelApiUrl = localStorageManager.getApiUrl()
      const monthParam = formatMonthForAPI(selectedMonthIndex, selectedYear)
      console.log('Fetching date wise slip distribution for:', monthParam)
      
      const response = await dis_date_wise_slip_distribution(monthParam, panelApiUrl)
      console.log('Date wise slip distribution response:', response)

      if (Array.isArray(response) && response.length > 0) {
        // Map API response to component data structure
        const mappedData = response.map((item, index) => {
          // Extract day from date string (e.g., "01 Oct, 2025" -> "01")
          const dayMatch = item.date ? item.date.match(/^(\d+)/) : null
          const day = dayMatch ? dayMatch[1] : String(index + 1).padStart(2, '0')
          
          return {
            id: index + 1,
            day: day,
            date: item.date || `${day} ${monthNames[selectedMonthIndex]}, ${selectedYear}`,
            slipCount: Number(item.total) || 0
          }
        })
        
        setDateWiseData(mappedData)
      } else if (Array.isArray(response)) {
        // Empty array - no data for this month
        setDateWiseData([])
      } else if (response && typeof response === 'object') {
        // Single object response
        const dayMatch = response.date ? response.date.match(/^(\d+)/) : null
        const day = dayMatch ? dayMatch[1] : '01'
        setDateWiseData([{
          id: 1,
          day: day,
          date: response.date || `01 ${monthNames[selectedMonthIndex]}, ${selectedYear}`,
          slipCount: Number(response.total) || 0
        }])
      } else {
        // No data or unexpected format
        setDateWiseData([])
      }
    } catch (err) {
      console.error('Error fetching date wise slip distribution:', err)
      setError(err.message || 'Failed to fetch data')
      setDateWiseData([])
    } finally {
      setLoading(false)
    }
  }, [selectedMonthIndex, selectedYear, formatMonthForAPI])

  const handleBack = () => {
    navigate(-1)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
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
  }

  // Fetch data when component mounts or month/year changes
  useEffect(() => {
    fetchDateWiseData()
  }, [fetchDateWiseData])

  // Smooth scroll to top on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Filter data based on search query
  const filteredData = dateWiseData.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.date.toLowerCase().includes(query) ||
      item.slipCount.toString().includes(query)
    )
  })

  // Calculate max value for chart scaling
  const maxValue = dateWiseData.length > 0 
    ? Math.max(...dateWiseData.map(item => item.slipCount), 12) 
    : 12
  const chartHeight = 200
  const chartPadding = 40
  const barWidth = 30
  const barGap = 20
  
  // Calculate dynamic chart width based on number of data points
  const chartWidth = dateWiseData.length > 0 
    ? Math.max(600, chartPadding * 2 + dateWiseData.length * (barWidth + barGap) + barGap)
    : 600

  const selectedMonth = monthNames[selectedMonthIndex]

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20">
        <PageHeader
          title="तारीख अनुसार"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          uppercase={false}
        />
        
        {/* Date Selector Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-end">
            <button
              onClick={handleMonthYearClick}
              className="flex items-center justify-center py-2 px-3 sm:px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 bg-white border border-gray-200"
            >
              <span className="text-sm sm:text-base font-semibold text-gray-800 mr-2">
                {selectedMonth} {selectedYear}
              </span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-full mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5 pb-6 sm:pb-8 md:pb-10">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-8 shadow-md mb-3 sm:mb-4 md:mb-5">
            <div className="flex items-center justify-center">
              <div className="text-gray-600">Loading...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-4 shadow-md mb-3 sm:mb-4 md:mb-5">
            <div className="text-red-600 text-center">{error}</div>
          </div>
        )}

        {/* Bar Chart Card */}
        {!loading && !error && dateWiseData.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-md mb-3 sm:mb-4 md:mb-5">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">तारीख अनुसार</h2>
          </div>
          
          {/* Chart Container */}
          <div className="w-full overflow-x-auto scroll-smooth" style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #1d2024'
          }}>
            <div className="relative mx-auto" style={{ width: `${chartWidth}px`, height: `${chartHeight + chartPadding * 2}px` }}>
              <svg width={chartWidth} height={chartHeight + chartPadding * 2}>
                {/* Grid Lines */}
                {[0, 2, 4, 6, 8, 10, 12].map((value) => {
                  const y = chartHeight + chartPadding - (value / maxValue) * chartHeight
                  return (
                    <g key={value}>
                      <line
                        x1={chartPadding}
                        y1={y}
                        x2={chartWidth - chartPadding}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                      <text
                        x={chartPadding - 10}
                        y={y + 5}
                        textAnchor="end"
                        className="text-xs fill-gray-600"
                        fontSize="12"
                      >
                        {value}
                      </text>
                    </g>
                  )
                })}

                {/* Bars */}
                {dateWiseData.map((item, index) => {
                  const barHeight = (item.slipCount / maxValue) * chartHeight
                  const x = chartPadding + index * (barWidth + barGap) + barGap / 2
                  const y = chartHeight + chartPadding - barHeight
                  
                  return (
                    <g key={item.id}>
                      {/* Bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="#10b981"
                        rx="2"
                      />
                      {/* Value above bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        className="text-xs font-semibold fill-gray-800"
                        fontSize="11"
                      >
                        {item.slipCount.toFixed(1)}
                      </text>
                      {/* Day label */}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight + chartPadding + 20}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                        fontSize="11"
                        transform={`rotate(-45 ${x + barWidth / 2} ${chartHeight + chartPadding + 20})`}
                      >
                        {item.day}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center mt-4 sm:mt-5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-xs sm:text-sm text-gray-700">Voters Sent</span>
            </div>
          </div>
        </div>
        )}

        {/* Empty State */}
        {!loading && !error && dateWiseData.length === 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-8 shadow-md mb-3 sm:mb-4 md:mb-5">
            <div className="text-center text-gray-600">No data available for this month</div>
          </div>
        )}

        {/* Data Table Card */}
        {!loading && !error && dateWiseData.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-md">
            {/* Vertical Layout for screens ≤ 425px */}
            <div className="max-[426px]:block hidden">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-2 bg-gray-50">
                  <div className="px-3 py-2.5 text-sm font-bold text-gray-900 text-center border-r border-b-2 border-gray-300">
                    तारीख
                  </div>
                  <div className="px-3 py-2.5 text-sm font-bold text-gray-900 text-center border-b-2 border-gray-300">
                    Slip
                  </div>
                </div>
                
                {/* Data Rows */}
                {filteredData.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="grid grid-cols-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-3 py-2.5 text-sm font-semibold text-gray-900 text-center border-r border-gray-200">
                      {item.date}
                    </div>
                    <div className="px-3 py-2.5 text-sm font-semibold text-gray-900 text-center">
                      {item.slipCount}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal Table for screens > 425px */}
            <div className="min-[426px]:block hidden">
              <div className="overflow-x-auto scroll-smooth" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}>
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 z-10 bg-gray-50 text-center py-3 px-4 text-sm font-bold text-gray-900 border-b-2 border-r-2 border-gray-300 whitespace-nowrap">
                        तारीख
                      </th>
                      {filteredData.map((item) => (
                        <th key={item.id} className="text-center py-3 px-3 text-xs sm:text-sm font-bold text-gray-900 border-b-2 border-r border-gray-300 whitespace-nowrap min-w-[100px]">
                          {item.date}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="sticky left-0 z-10 bg-white text-center py-3 px-4 text-sm font-bold text-gray-900 border-b border-r-2 border-gray-300 whitespace-nowrap">
                        Slip
                      </td>
                      {filteredData.map((item) => (
                        <td key={item.id} className="text-center py-3 px-3 text-sm font-semibold text-gray-900 border-b border-r border-gray-200 hover:bg-blue-50 transition-colors whitespace-nowrap">
                          {item.slipCount}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

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
        startYear={2020}
        endYear={2030}
        title="Calendar"
      />
    </div>
  )
}

export default DateWiseSlipReport

