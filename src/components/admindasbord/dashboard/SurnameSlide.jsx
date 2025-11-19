import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'
import PageHeader from '../common/PageHeader.jsx'

const SurnameSlide = ({ navigation, onClose }) => {
  const { navigate, state = {} } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [surnames, setSurnames] = useState([])
  const [allSurnames, setAllSurnames] = useState([])
  const [selectedSurnames, setSelectedSurnames] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)

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
        
        // Restore previously selected surnames from navigation state
        if (state?.selectedSurnames && Array.isArray(state.selectedSurnames) && state.selectedSurnames.length > 0) {
          // Match the selected surnames by name and set their IDs
          const selectedIds = transformedSurnames
            .filter(surname => 
              state.selectedSurnames.some(selected => 
                selected.name && surname.name && 
                selected.name.toLowerCase().trim() === surname.name.toLowerCase().trim()
              )
            )
            .map(surname => surname.id)
          
          if (selectedIds.length > 0) {
            setSelectedSurnames(selectedIds)
            console.log('Restored selected surnames:', selectedIds)
          }
        }
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
  }, [state?.selectedSurnames])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) {
        onClose()
      } else {
        navigate('/admin')
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
    if (selectedSurnames.length === 0) return
    const selectedSurnameObjects = surnames.filter((s) => selectedSurnames.includes(s.id))
    const surnameList = selectedSurnameObjects.map((s) => s.name).join(',')
    const formattedList = surnameList ? (surnameList.endsWith(',') ? surnameList : `${surnameList},`) : ''
    const query = formattedList ? `?surnames=${encodeURIComponent(formattedList)}` : ''
    navigate(`/surname-voter${query}`, {
      selectedSurnames: selectedSurnameObjects,
      surnameListString: formattedList
    })
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
        <PageHeader
          title="सरनेम"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: '#102463', borderBottomColor: '#102463' }}></div>
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
              {filteredSurnames.map((surname) => {
                const isSelected = selectedSurnames.includes(surname.id)
                return (
                  <div 
                    key={surname.id} 
                    className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleToggleSurname(surname.id)}
                  >
                    <div
                      className="w-5 h-5 flex items-center justify-center rounded-[4px] mr-3 transition-colors"
                      style={{
                        border: `1.5px solid ${isSelected ? '#9C9C9C' : '#C5C5C5'}`,
                        backgroundColor: isSelected ? '#9C9C9C' : '#FFFFFF'
                      }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    
                    <span className="text-gray-900 font-medium uppercase text-sm">
                      {surname.name}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex flex-row flex-wrap sm:flex-nowrap sm:items-center sm:justify-end gap-2 sm:gap-6">
            <button
              onClick={handleFilterCancel}
              className="flex-1 sm:flex-initial px-3 py-3 rounded-2xl border text-sm sm:text-base font-semibold"
              style={{
                borderColor: '#d7dbe7',
                color: '#102463',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 6px rgba(16,36,99,0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9edff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              फ़िल्टर रद कीजिए
            </button>
            
            <button
              onClick={handleViewVoters}
              disabled={selectedSurnames.length === 0}
              className={`flex-1 sm:flex-initial px-3 py-3 rounded-2xl font-semibold text-sm sm:text-base transition-colors ${
                selectedSurnames.length === 0 ? 'cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={
                selectedSurnames.length === 0
                  ? { backgroundColor: '#d1d5db', color: '#6b7280' }
                  : { backgroundColor: '#102463', color: '#ffffff', boxShadow: '0 2px 6px rgba(16,36,99,0.1)' }
              }
            >
              मतदाता देखिए
            </button>
          </div>
        </div>
      </div>
    </div>

    </div>
  )
}

export default SurnameSlide

