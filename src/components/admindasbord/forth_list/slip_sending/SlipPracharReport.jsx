import React, { useRef, useState, useEffect } from 'react'

const SlipPracharReport = ({ navigation }) => {
  const { navigate } = navigation
  const containerRef = useRef(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Static data matching the image
  const totalVoters = 45132
  const sentCount = 15
  const notSentCount = 45117
  const whatsappCount = 13
  const smsCount = 2
  const printSlipCount = 0

  // Calculate percentage for the donut chart
  const sentPercentage = (sentCount / totalVoters) * 100
  const notSentPercentage = (notSentCount / totalVoters) * 100

  const handleBack = () => {
    navigate(-1)
  }

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Smooth scroll to top on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Navigation buttons data
  const navigationButtons = [
    {
      id: 'my-phonebook',
      label: 'मेरा फोनबुक पर्ची रिपोर्ट',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 0H4c-1.1 0-2 .9-2 2v20l4-4h14c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zm0 16H6l-2 2V2h16v14z"/>
          <circle cx="9" cy="7" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="7" r="1.5" fill="currentColor"/>
          <path d="M12 10c-1.38 0-2.5 1.12-2.5 2.5h5c0-1.38-1.12-2.5-2.5-2.5z"/>
        </svg>
      ),
      onClick: () => console.log('My Phonebook Slip Report')
    },
    {
      id: 'booth-wise',
      label: 'बूथ अनुसार',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
          <rect x="10" y="10" width="4" height="4" fill="currentColor"/>
        </svg>
      ),
      onClick: () => console.log('Booth Wise')
    },
    {
      id: 'phonebook-wise',
      label: 'फोनबूक अनुसार',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 0H4c-1.1 0-2 .9-2 2v20l4-4h14c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zm0 16H6l-2 2V2h16v14z"/>
          <circle cx="9" cy="7" r="1.5" fill="currentColor"/>
          <circle cx="15" cy="7" r="1.5" fill="currentColor"/>
          <path d="M12 10c-1.38 0-2.5 1.12-2.5 2.5h5c0-1.38-1.12-2.5-2.5-2.5z"/>
        </svg>
      ),
      onClick: () => console.log('Phonebook Wise')
    },
    {
      id: 'polling-station-wise',
      label: 'मतदान स्थल अनुसार',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          <path d="M7 10h2v7H7zm4 0h2v7h-2zm4 0h2v7h-2z"/>
        </svg>
      ),
      onClick: () => console.log('Polling Station Wise')
    },
    {
      id: 'worker-slip',
      label: 'कार्यकर्ता का स्लिप प्रचार',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      onClick: () => console.log('Worker Slip Campaign')
    },
    {
      id: 'date-wise',
      label: 'तारीख अनुसार',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      ),
      onClick: () => console.log('Date Wise')
    }
  ]

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
      onScroll={(e) => {
        // React scroll event handler
        const scrollTop = e.currentTarget.scrollTop
        setScrollPosition(scrollTop)
        
        // Show scroll to top button when scrolled down more than 300px
        if (scrollTop > 300) {
          setShowScrollTop(true)
        } else {
          setShowScrollTop(false)
        }
      }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3.5 md:py-4 flex items-center justify-between shadow-xl" style={{ backgroundColor: '#102463' }}>
        <button
          onClick={handleBack}
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95 shadow-sm"
        >
          <svg className="w-5 h-5 sm:w-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center flex-1 px-3 sm:px-4">स्लिप प्रचार रिपोर्ट</h1>
        
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11"></div>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 pb-6 sm:pb-8 md:pb-10 lg:pb-12">
        {/* Main White Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          {/* Total Voters */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              टोटल मतदाता : {totalVoters.toLocaleString('en-IN')}
            </h2>
          </div>

          {/* Donut Chart */}
          <div className="flex justify-center mb-6">
            <div className="relative" style={{ width: '240px', height: '240px' }}>
              <svg width="240" height="240" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="120"
                  cy="120"
                  r="90"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="30"
                />
                {/* Not Sent (red) - almost full circle */}
                <circle
                  cx="120"
                  cy="120"
                  r="90"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="30"
                  strokeDasharray={`${2 * Math.PI * 90 * (notSentPercentage / 100)} ${2 * Math.PI * 90}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
                {/* Sent (green) - small segment */}
                <circle
                  cx="120"
                  cy="120"
                  r="90"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="30"
                  strokeDasharray={`${2 * Math.PI * 90 * (sentPercentage / 100)} ${2 * Math.PI * 90}`}
                  strokeDashoffset={`-${2 * Math.PI * 90 * (notSentPercentage / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Dotted Line */}
          <div className="border-t border-dashed border-gray-300 my-6"></div>

          {/* Sent/Not Sent Stats */}
          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-lg font-semibold text-gray-800">भेज दिया</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{sentCount}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-lg font-semibold text-gray-800">नहीं भेजा</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{notSentCount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Dotted Line */}
          <div className="border-t border-dashed border-gray-300 my-6"></div>

          {/* Sent Breakdown */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              भेज दिया ({sentCount})
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">{whatsappCount}</div>
                <div className="text-sm text-gray-600">Whatsapp</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">{smsCount}</div>
                <div className="text-sm text-gray-600">SMS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">{printSlipCount}</div>
                <div className="text-sm text-gray-600">Print Slip</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons Grid */}
        <div className="grid grid-cols-3 gap-4">
          {navigationButtons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick}
              className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-200 min-h-[120px] border border-gray-100 hover:border-blue-300"
            >
              <div className="text-blue-600 mb-3">
                {button.icon}
              </div>
              <span className="text-xs text-center text-gray-700 font-medium leading-tight">
                {button.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border-2"
          style={{ borderColor: '#102463' }}
          aria-label="Scroll to top"
        >
          <svg 
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#102463' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default SlipPracharReport

