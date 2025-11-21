import React, { useRef, useState, useEffect } from 'react'
import PageHeader from '../../common/PageHeader'
import CalendarModal from '../../modals/CalendarModal'

const DateWiseSlipReport = ({ navigation }) => {
  const { navigate } = navigation
  const containerRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(9) // October (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2025)
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [tempMonthIndex, setTempMonthIndex] = useState(9)
  const [tempYear, setTempYear] = useState(2025)

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Static data matching the image
  const dateWiseData = [
    { id: 1, day: '01', date: '01 Oct, 2025', slipCount: 12 },
    { id: 2, day: '02', date: '02 Oct, 2025', slipCount: 0 },
    { id: 3, day: '03', date: '03 Oct, 2025', slipCount: 2 },
    { id: 4, day: '04', date: '04 Oct, 2025', slipCount: 0 },
    { id: 5, day: '05', date: '05 Oct, 2025', slipCount: 2 },
    { id: 6, day: '06', date: '06 Oct, 2025', slipCount: 0 },
    { id: 7, day: '07', date: '07 Oct, 2025', slipCount: 0 },
    { id: 8, day: '08', date: '08 Oct, 2025', slipCount: 0 },
  ]

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
  const maxValue = Math.max(...dateWiseData.map(item => item.slipCount), 12)
  const chartHeight = 200
  const chartPadding = 40
  const barWidth = 30
  const barGap = 20

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
        {/* Bar Chart Card */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-md mb-3 sm:mb-4 md:mb-5">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">तारीख अनुसार</h2>
          </div>
          
          {/* Chart Container */}
          <div className="w-full overflow-x-auto">
            <div className="relative" style={{ minWidth: '600px', height: `${chartHeight + chartPadding * 2}px` }}>
              <svg width="100%" height={chartHeight + chartPadding * 2} className="w-full">
                {/* Grid Lines */}
                {[0, 2, 4, 6, 8, 10, 12].map((value) => {
                  const y = chartHeight + chartPadding - (value / maxValue) * chartHeight
                  return (
                    <g key={value}>
                      <line
                        x1={chartPadding}
                        y1={y}
                        x2="100%"
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

        {/* Data Table Card */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-center py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm md:text-base font-bold text-gray-900 border-b-2 border-gray-200">
                    तारीख
                  </th>
                  {filteredData.map((item) => (
                    <th key={item.id} className="text-center py-2 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm md:text-base font-bold text-gray-900 border-b-2 border-gray-200">
                      {item.day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center py-2 sm:py-2.5 px-2 sm:px-3 text-xs sm:text-sm md:text-base font-bold text-gray-900 border-r-2 border-gray-200">
                    Slip
                  </td>
                  {filteredData.map((item) => (
                    <td key={item.id} className="text-center py-2 sm:py-2.5 px-2 sm:px-3 text-xs sm:text-sm md:text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                      {item.slipCount}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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

