import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const BoothList = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [boothData, setBoothData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch booth data from API
  useEffect(() => {
    const fetchBoothData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching booth list data from:', panelApiUrl)
        
        // Call the real API
        const apiData = await apiService.displayAllBoothWithAllTotal(panelApiUrl)
        
        // Transform API data to match component structure
        const transformedData = apiData.map((booth, index) => ({
          id: parseInt(booth.boothNo) || index + 1,
          boothNumber: parseInt(booth.boothNo) || 0,
          totalVoters: booth.totalVoters || 0
        }))
        
        console.log('Transformed booth list data:', transformedData)
        setBoothData(transformedData)
      } catch (err) {
        console.error('Error fetching booth list data:', err)
        setError(err.message || 'Failed to fetch booth list data')
      } finally {
        setLoading(false)
      }
    }

    fetchBoothData()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleBoothClick = (booth) => {
    console.log('Booth clicked:', booth)
    // Navigate to voter list for this booth
    navigate('/voter-list', { boothNumber: booth.boothNumber })
  }

  const filteredBooths = boothData.filter(booth =>
    booth.boothNumber.toString().includes(searchQuery) ||
    booth.totalVoters.toString().includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booths...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
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
            
            <h1 className="text-white text-base sm:text-lg font-semibold">बूथ सूची</h1>
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
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {boothData.length}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area - Light Purple/Grey Background */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar" 
        style={{
          backgroundColor: '#e5e8ff',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          maxHeight: 'calc(100vh - 80px)' // Ensure proper height for scrolling
        }}
      >
        <div className="min-h-full">
          <div className="max-w-4xl mx-auto">
            {error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium mb-2">Error loading booths</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : boothData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <p className="text-gray-600 font-medium">No booths found</p>
                  <p className="text-gray-500 text-sm">No booth data available at the moment</p>
                </div>
              </div>
            ) : (
              <>
                {/* Booth Grid - 2 Column Layout */}
                <div className="grid grid-cols-2 gap-4 pb-8">
                  {filteredBooths.map((booth) => (
                    <div
                      key={booth.id}
                      onClick={() => handleBoothClick(booth)}
                      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 border border-gray-100"
                    >
                      {/* Booth Number */}
                      <div className="text-black font-bold text-base mb-2">
                        बूथ नं. {booth.boothNumber}
                      </div>
                      
                      {/* Total Voters */}
                      <div className="text-gray-600 text-sm">
                        टोटल मतदाता {booth.totalVoters}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty Search State */}
                {filteredBooths.length === 0 && boothData.length > 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No booths found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoothList
