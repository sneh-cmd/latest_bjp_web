import React, { useState, useEffect, useCallback } from 'react'
import { displayRedevelopmentBuilding } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'

const RedevelopmentBuilding = ({ navigation }) => {
  const { navigate } = navigation
  const [redevelopmentBuildings, setRedevelopmentBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Fetch redevelopment building addresses
  const fetchRedevelopmentBuildings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      console.log('Fetching redevelopment buildings from:', panelApiUrl)
      
      // Use the new API endpoint
      const response = await displayRedevelopmentBuilding(panelApiUrl)
      
      console.log('Redevelopment Building Response:', response)
      
      // Parse response - API returns { result: [...] }
      let buildingsData = []
      
      if (Array.isArray(response)) {
        buildingsData = response
      } else if (response && response.result && Array.isArray(response.result)) {
        buildingsData = response.result
      } else if (response && response.data && Array.isArray(response.data)) {
        buildingsData = response.data
      }
      
      // Map the response to our component format
      // API response has: { add, note, admin_name }
      const redevBuildings = buildingsData
        .filter(item => item && item.add && item.add.trim() !== '')
        .map((item, index) => ({
          id: index + 1,
          address: item.add || item.address || '',
          totalVoter: item.total_voter || item.totalVoter || 0, // API doesn't return this, set to 0
          note: (item.note && typeof item.note === 'string') ? item.note.trim() : '',
          adminName: item.admin_name || ''
        }))
      
      console.log('Mapped Redevelopment Buildings:', redevBuildings)
      setRedevelopmentBuildings(redevBuildings)
    } catch (err) {
      console.error('Error fetching redevelopment buildings:', err)
      setError(err.message || 'Failed to fetch redevelopment building data')
      setRedevelopmentBuildings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRedevelopmentBuildings()
  }, [fetchRedevelopmentBuildings])

  // Filter buildings based on search query
  const filteredBuildings = redevelopmentBuildings.filter(building => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return building.address.toLowerCase().includes(query) ||
           building.note.toLowerCase().includes(query)
  })

  const handleBack = () => {
    navigate('/cadre-survey-report')
  }

  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchQuery('')
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-md" style={{ backgroundColor: '#102463' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-sm sm:text-base md:text-lg font-bold">पुनर्विकास</h1>
        </div>
        
        <button 
          onClick={handleSearchToggle}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="sticky top-[60px] sm:top-[64px] z-10 w-full px-3 sm:px-4 md:px-6 py-2 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="खोजें..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 pb-20 sm:pb-24">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">डेटा लोड हो रहा है...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-red-200">
            <div className="text-center">
              <div className="text-red-600 text-4xl mb-4">⚠️</div>
              <p className="text-red-700 font-semibold">{error}</p>
              <button
                onClick={fetchRedevelopmentBuildings}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: '#102463' }}
              >
                पुनः प्रयास करें
              </button>
            </div>
          </div>
        )}

        {/* Building List */}
        {!loading && !error && (
          <div className="space-y-3 sm:space-y-4">
            {/* Background Lotus Icon */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
              <svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z" fill="#f97316" opacity="0.3"/>
              </svg>
            </div>

            {filteredBuildings.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="text-gray-400 text-6xl mb-4">🏗️</div>
                <p className="text-gray-600 font-medium">
                  {searchQuery ? 'कोई परिणाम नहीं मिला' : 'कोई पुनर्विकास भवन नहीं मिला'}
                </p>
              </div>
            ) : (
              filteredBuildings.map((building, index) => (
                <div
                  key={building.id || index}
                  className="bg-white rounded-xl p-4 sm:p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow relative"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Number Badge */}
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full font-bold text-white text-sm sm:text-base" style={{ backgroundColor: '#102463' }}>
                      {index + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Address */}
                      <p className="text-gray-900 text-sm sm:text-base font-medium mb-2 sm:mb-3 break-words">
                        {building.address}
                      </p>
                      
                      {/* Total Voters */}
                      <div className="mb-2">
                        <span className="text-gray-700 text-xs sm:text-sm font-semibold">
                          टोटल मतदाता : {building.totalVoter || 0}
                        </span>
                      </div>
                      
                      {/* Note */}
                      {building.note && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600 text-xs sm:text-sm">
                            नोट : {building.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 w-full px-3 sm:px-4 md:px-6 py-3 bg-gray-800 shadow-lg">
        <div className="flex items-center justify-start">
          <div className="bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-white text-sm sm:text-base font-semibold">
              टोटल : {filteredBuildings.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RedevelopmentBuilding

