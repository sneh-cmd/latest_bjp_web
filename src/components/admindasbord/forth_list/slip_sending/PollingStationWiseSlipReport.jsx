import React, { useRef, useState, useEffect, useCallback } from 'react'
import PageHeader from '../../common/PageHeader'
import { dis_polling_location_wise_slip_send_dash } from '../../../../apidata.jsx'
import localStorageManager from '../../../../utils/localStorage.js'

const PollingStationWiseSlipReport = ({ navigation }) => {
  const { navigate } = navigation
  const containerRef = useRef(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pollingStationData, setPollingStationData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPollingStationData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await dis_polling_location_wise_slip_send_dash(panelApiUrl)
      
      console.log('Polling location wise slip send dash response:', response)
      console.log('Response type:', typeof response)
      console.log('Is array:', Array.isArray(response))
      
      // Normalize response
      let records = []
      if (Array.isArray(response)) {
        records = response
      } else if (response?.result && Array.isArray(response.result)) {
        records = response.result
      } else if (response?.data && Array.isArray(response.data)) {
        records = response.data
      } else if (response && typeof response === 'object') {
        console.log('Response is object, keys:', Object.keys(response))
        if (response.Success === "1" && response.result && Array.isArray(response.result)) {
          records = response.result
        } else if (response.Success === "1" && response.result && !Array.isArray(response.result)) {
          records = [response.result]
        }
      }
      
      console.log('Normalized polling station records:', records)
      console.log('Records count:', records.length)
      if (records.length > 0) {
        console.log('First record:', records[0])
      }
      
      // Map API response to component structure
      const mappedData = records.map((item, index) => {
        const voters = Number(item.total_voter) || Number(item.totalVoter) || Number(item.total) || 0
        const sent = Number(item.send) || Number(item.sent) || 0
        const remain = Number(item.remain) || Number(item.remaining) || 0
        const address = item.eng_polling_location || item.polling_location || item.address || '-'
        
        return {
          id: item.id || index + 1,
          voters: voters,
          sent: sent,
          remain: remain,
          address: address
        }
      })
      
      console.log('Mapped data:', mappedData)
      setPollingStationData(mappedData)
    } catch (err) {
      console.error('Error fetching polling station wise slip data:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setPollingStationData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPollingStationData()
  }, [fetchPollingStationData])

  const totalStations = pollingStationData.length

  const handleBack = () => {
    navigate(-1)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
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

  // Calculate percentage for each polling station
  const calculatePercentage = (sent, total) => {
    if (total === 0) return 0
    return ((sent / total) * 100).toFixed(1)
  }

  // Filter data based on search query
  const filteredData = pollingStationData.filter((station) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      station.address.toLowerCase().includes(query) ||
      station.voters.toString().includes(query) ||
      station.sent.toString().includes(query)
    )
  })

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
      onScroll={(e) => {
        const scrollTop = e.currentTarget.scrollTop
        if (scrollTop > 300) {
          setShowScrollTop(true)
        } else {
          setShowScrollTop(false)
        }
      }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20">
        <PageHeader
          title="मतदान स्थल अनुसार"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          uppercase={false}
        />
        
        {/* Total Count Section */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {totalStations}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-full mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 pb-4 sm:pb-6 md:pb-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
            <p className="mt-4 text-gray-600 text-sm">डेटा लोड हो रहा है...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-red-100">
            <div className="text-red-500 text-3xl mb-2">⚠️</div>
            <p className="text-red-600 text-sm font-semibold mb-3">{error}</p>
            <button
              type="button"
              onClick={fetchPollingStationData}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {!loading && !error && filteredData.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
            <p className="text-gray-600 text-sm">कोई डेटा नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredData.length > 0 && (
          /* Polling Station Cards List */
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
            {filteredData.map((station) => {
              const percentage = calculatePercentage(station.sent, station.voters)
              const percentageValue = parseFloat(percentage)
              
              return (
                <div
                  key={station.id}
                  className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
                >
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    {/* Left Side: Circular Progress Indicator */}
                    <div className="flex-shrink-0">
                      <div className="relative w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] md:w-[80px] md:h-[80px]">
                        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 70 70">
                          {/* Background circle */}
                          <circle
                            cx="35"
                            cy="35"
                            r="28"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="6"
                          />
                          {/* Progress circle - red */}
                          <circle
                            cx="35"
                            cy="35"
                            r="28"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * 28 * (percentageValue / 100)} ${2 * Math.PI * 28}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                          />
                        </svg>
                        {/* Percentage text in center */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs md:text-sm font-bold text-red-600">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Voter Details and Address */}
                    <div className="flex-1 min-w-0">
                      {/* Voter and Sent Count */}
                      <div className="mb-1 sm:mb-1.5 md:mb-2">
                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                          <div>
                            <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900">
                              मतदाता : {station.voters.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900">
                              भेज दिया : {station.sent}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="text-[10px] sm:text-xs md:text-sm text-gray-700 leading-snug sm:leading-relaxed">
                        {station.address}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border-2"
          style={{ borderColor: '#102463' }}
          aria-label="Scroll to top"
        >
          <svg 
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" 
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

export default PollingStationWiseSlipReport

