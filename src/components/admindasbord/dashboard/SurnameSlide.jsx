import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'
import SurnameVoterSlide from './SurnameVoterSlide'

const SurnameSlide = ({ navigation, onClose }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [surnames, setSurnames] = useState([])
  const [allSurnames, setAllSurnames] = useState([])
  const [selectedSurnames, setSelectedSurnames] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [showVoterSlide, setShowVoterSlide] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch surnames from API
  useEffect(() => {
    const fetchSurnames = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
        
        console.log('Fetching surnames from API...')
        const response = await apiService.displayAllSurname(panelApiUrl)
        
        console.log('API response:', response)
        
        // Transform the response to match our structure
        const transformedSurnames = Array.isArray(response) 
          ? response.map((item, index) => ({
              id: index + 1,
              name: item.eng_surname || item.surname || item || ''
            }))
          : []
        
        setSurnames(transformedSurnames)
        setAllSurnames(transformedSurnames)
      } catch (err) {
        console.error('Error fetching surnames:', err)
        setError(err.message || 'Failed to fetch surnames')
        setSurnames([])
        setAllSurnames([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSurnames()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) {
        onClose()
      } else {
        navigate('/admin-dashboard')
      }
    }, 300)
  }

  const handleToggleSurname = (surnameId) => {
    setSelectedSurnames(prev => {
      if (prev.includes(surnameId)) {
        return prev.filter(id => id !== surnameId)
      } else {
        return [...prev, surnameId]
      }
    })
  }

  const handleFilterCancel = () => {
    setSelectedSurnames([])
  }

  const handleViewVoters = () => {
    console.log('Selected surnames:', selectedSurnames)
    setShowVoterSlide(true)
  }

  const handleCloseVoterSlide = () => {
    setShowVoterSlide(false)
  }

  // Filter surnames based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSurnames(allSurnames)
      return
    }

    const filtered = allSurnames.filter(surname =>
      surname.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setSurnames(filtered)
  }, [searchQuery, allSurnames])

  const filteredSurnames = surnames

  return (
    <div className="fixed inset-0 z-50">
      <div className={`relative w-full h-full overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gray-50"></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 flex-shrink-0 shadow-md bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-gray-900 text-lg font-bold">
              सरनेम
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="सर्च दर्ज करें"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isLoading ? (
            // Loading Screen
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    LOADING SURNMES...
                  </h2>
                </div>
                
                {/* Loading spinner */}
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            // Error State
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium mb-2">Error loading surnames</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          ) : filteredSurnames.length === 0 ? (
            // Empty State
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <p className="text-gray-600 font-medium">No surnames found</p>
              </div>
            </div>
          ) : (
            // Surname List
            <div className="divide-y divide-gray-200">
              {filteredSurnames.map((surname) => (
                <div 
                  key={surname.id} 
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleToggleSurname(surname.id)}
                >
                  <div className="relative w-5 h-5 border-2 border-gray-400 rounded flex-shrink-0 mr-3">
                    {selectedSurnames.includes(surname.id) && (
                      <svg className="w-full h-full text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <span className="text-gray-900 font-medium uppercase text-sm">
                    {surname.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={handleFilterCancel}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              फ़िल्टर रद कीजिए
            </button>
            
            <button
              onClick={handleViewVoters}
              disabled={selectedSurnames.length === 0}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                selectedSurnames.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              मतदाता देखिए
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Surname Voter Slide */}
      {showVoterSlide && (
        <SurnameVoterSlide
          navigation={navigation}
          onClose={handleCloseVoterSlide}
          surnames={surnames.filter(s => selectedSurnames.includes(s.id))}
          surnameListString={surnames.filter(s => selectedSurnames.includes(s.id)).map(s => s.name).join(',')}
        />
      )}
    </div>
  )
}

export default SurnameSlide

