import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'
import DataSearchLoader from '../utils/DataSearchLoader'

const AgeSlide = ({ navigation, onClose }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [voters, setVoters] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
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

  const handleSearch = async () => {
    if (!ageFrom || !ageTo) {
      alert('Please enter both age range values')
      return
    }
    console.log('Searching for age range:', ageFrom, 'to', ageTo)
    
    try {
      setIsLoading(true)
      setShowResults(false)
      setError(null)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      console.log('Fetching voters for age range:', ageFrom, 'to', ageTo)
      const response = await apiService.ageWiseSearch(ageFrom, ageTo, panelApiUrl)
      
      console.log('API response:', response)
      
      // Transform the response to match our structure
      const transformedVoters = Array.isArray(response) 
        ? response.map((item) => ({
            id: item.id,
            serialNo: item.slnoinpart || item.serial_no,
            name: `${item.eng_f_name || ''} ${item.f_eng_surname || ''}`.trim(),
            fatherHusband: item.eng_m_name || '-',
            address: item.eng_localityid || '-',
            mobile: item.contact_no || '-',
            voterId: item.idcard_no || '-',
            boothNo: item.booth_no || item.part_no,
            houseNo: item.eng_house_no || '-',
            pollingStation: item.eng_polling_location || '-'
          }))
        : []
      
      setVoters(transformedVoters)
    } catch (err) {
      console.error('Error fetching voters:', err)
      setError(err.message || 'Failed to fetch voters')
      setVoters([])
    } finally {
      setIsLoading(false)
      setShowResults(true)
    }
  }

  const handleCall = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== '-') {
      window.open(`tel:${phoneNumber}`, '_self')
    }
  }

  const handleCheck = (voter) => {
    console.log('Check voter:', voter)
  }

  const handleFamily = (voter) => {
    console.log('View family for:', voter)
  }

  const handleEdit = () => {
    console.log('Edit mobile')
  }

  const totalVoters = voters.length

  return (
    <div className="fixed inset-0 z-50">
      <div className={`relative w-full h-full overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0" style={{backgroundColor: '#e3f2fd'}}></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">
        <DataSearchLoader isVisible={isLoading} />

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

              <h1 className="text-white text-base sm:text-lg font-semibold uppercase">
                उम्र के अनुसार
              </h1>
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" style={{backgroundColor: '#e5e8ff'}}>
          {/* Age Selection Section - Light Blue Background */}
          <div className="sticky top-[0px] z-20 px-4 py-2" style={{backgroundColor: '#e5e8ff'}}>
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="order-2 sm:order-1 w-full sm:w-auto px-2 py-1 rounded-lg inline-block">
                <span className="text-sm font-bold" style={{ color: '#102463' }}>
                  टोटल : {totalVoters}
                </span>
              </div>

              {/* Label, Age Input Fields and Search Button */}
              <div className="order-1 sm:order-2 w-full sm:w-auto flex items-center gap-2 sm:gap-3 flex-wrap justify-start">
                <span className="text-sm sm:text-base font-medium px-2 text-gray-900 whitespace-nowrap flex-shrink-0">
                  उम्र चुने
                </span>

                {/* Age From Input */}
                <input
                  type="number"
                  placeholder="उम्र से..."
                  value={ageFrom}
                  onChange={(e) => setAgeFrom(e.target.value)}
                  className="w-20 sm:w-28 flex-shrink-0 bg-white rounded-lg px-2.5 sm:px-4 py-1 sm:py-2 text-sm sm:text-base text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102463] focus:border-transparent"
                  min="0"
                  max="120"
                />

                {/* Age To Input */}
                <input
                  type="number"
                  placeholder="उम्र तक..."
                  value={ageTo}
                  onChange={(e) => setAgeTo(e.target.value)}
                  className="w-20 sm:w-28 flex-shrink-0 bg-white rounded-lg px-2.5 sm:px-4 py-1 sm:py-2 text-sm sm:text-base text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#102463] focus:border-transparent"
                  min="0"
                  max="120"
                />

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-9 h-9 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Results Area - White Background */}
          <div className="p-3" style={{backgroundColor: '#e5e8ff'}}>
            {isLoading ? null : !showResults ? (
              // Empty State - Results will appear here
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 font-medium text-lg">Enter age range and search</p>
                  <p className="text-gray-500 text-sm mt-2">Results will appear here</p>
                </div>
              </div>
            ) : error ? (
              // Error State
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium mb-2">Error loading voters</p>
                  <p className="text-gray-600 text-sm">{error}</p>
                </div>
              </div>
            ) : voters.length === 0 ? (
              // No Results
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <p className="text-gray-600 font-medium">No voters found</p>
                </div>
              </div>
            ) : (
              // Voter List
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {voters.map((voter, idx) => (
                  <div key={voter.id} className="bg-white rounded-xl border border-gray-300 p-4 h-full flex flex-col">
                    <div className="text-base font-extrabold tracking-wide mb-3">
                      {idx + 1}.&nbsp;&nbsp;{voter.name || '-'}
                    </div>

                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm flex-1">
                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.fatherHusband || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पता:</span>
                        <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-2">
                          <span className="text-gray-900 break-words flex-1">{voter.address || '-'}</span>
                          <button className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">क्रमांक:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.serialNo || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
                        <div className="flex items-center min-w-0">
                          <span className="text-gray-900 truncate">{voter.mobile || '-'}</span>
                          <button
                            onClick={handleEdit}
                            className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0"
                          >
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.voterId || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.boothNo || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.houseNo || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.pollingStation || '-'}</span>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleCall(voter.mobile)}
                        className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                        type="button"
                      >
                        <div
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                          style={{ backgroundColor: '#103a94' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d2f7a')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#103a94')}
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-600">Call</span>
                      </button>

                      <button
                        onClick={() => handleCheck(voter)}
                        className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                        type="button"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-600">Check</span>
                      </button>

                      <button
                        onClick={() => handleFamily(voter)}
                        className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                        type="button"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L4 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default AgeSlide

