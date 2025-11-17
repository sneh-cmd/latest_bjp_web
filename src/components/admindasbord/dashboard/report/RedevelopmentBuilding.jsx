import React, { useState, useEffect, useCallback } from 'react'
import { displayRedevelopmentBuilding } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import PageHeader from '../../common/PageHeader.jsx'

const RedevelopmentBuilding = ({ navigation }) => {
  const { navigate } = navigation
  const [redevelopmentBuildings, setRedevelopmentBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        <PageHeader
          title="पुनर्विकास"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={handleClearSearch}
              />

        {/* Summary Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {filteredBuildings.length}
              </span>
            </div>
          </div>
        </div>
      </div>

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
                  className="bg-white rounded-xl p-3 sm:p-5 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow relative"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    {/* Number Badge */}
                    <div className="flex-shrink-0 w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center rounded-full font-bold text-white text-xs sm:text-base" style={{ backgroundColor: '#102463' }}>
                      {index + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Address */}
                      <p className="text-gray-900 text-xs sm:text-base font-medium mb-1.5 sm:mb-3 break-words leading-tight">
                        {building.address}
                      </p>
                      
                      {/* Total Voters */}
                      <div className="mb-1.5 sm:mb-2">
                        <span className="text-gray-700 text-[10px] sm:text-sm font-semibold">
                          टोटल मतदाता : {building.totalVoter || 0}
                        </span>
                      </div>
                      
                      {/* Note */}
                      {building.note && (
                        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-200">
                          <span className="text-gray-600 text-[10px] sm:text-sm">
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
    </div>
  )
}

export default RedevelopmentBuilding

