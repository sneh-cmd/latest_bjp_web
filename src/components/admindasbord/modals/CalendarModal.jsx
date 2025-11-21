import React, { useEffect, useRef } from 'react'

const CalendarModal = ({
  show = false,
  onClose,
  onConfirm,
  tempMonthIndex = 0,
  tempYear = 2025,
  onMonthSelect,
  onYearSelect,
  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  startYear = 2015,
  endYear = 2034,
  title = 'Calendar'
}) => {
  const monthScrollRef = useRef(null)
  const yearScrollRef = useRef(null)

  // Auto-scroll to selected month and year when modal opens
  useEffect(() => {
    if (show) {
      setTimeout(() => {
        if (monthScrollRef.current) {
          const monthButton = monthScrollRef.current.children[tempMonthIndex]
          if (monthButton) {
            monthButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
        if (yearScrollRef.current) {
          const yearIndex = tempYear - startYear
          const yearButton = yearScrollRef.current.children[yearIndex]
          if (yearButton) {
            yearButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }, 100)
    }
  }, [show, tempMonthIndex, tempYear, startYear])

  if (!show) return null

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (onClose) {
      onClose()
    }
  }

  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none backdrop-blur-sm"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-sm relative pointer-events-auto z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Month and Year Columns */}
        <div className="flex p-4 h-64">
          {/* Month Column */}
          <div className="flex-1 overflow-y-auto scroll-smooth pr-2">
            <div ref={monthScrollRef} className="flex flex-col items-center">
              {monthNames.map((month, index) => (
                <button
                  key={index}
                  onClick={() => onMonthSelect && onMonthSelect(index)}
                  className={`w-full py-3 px-2 text-center rounded-lg mb-1 transition-colors ${
                    tempMonthIndex === index
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Year Column */}
          <div className="flex-1 overflow-y-auto scroll-smooth pl-2 border-l border-gray-200">
            <div ref={yearScrollRef} className="flex flex-col items-center">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => onYearSelect && onYearSelect(year)}
                  className={`w-full py-3 px-2 text-center rounded-lg mb-1 transition-colors ${
                    tempYear === year
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="flex-1 py-4 px-6 text-white font-bold text-base hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#ef4444' }}
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 px-6 text-white font-bold text-base hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#10b981' }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default CalendarModal

