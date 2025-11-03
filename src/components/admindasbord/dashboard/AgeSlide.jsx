import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'

const AgeSlide = ({ navigation, onClose }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [ageFrom, setAgeFrom] = useState('')
  const [ageTo, setAgeTo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [voters, setVoters] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState(null)

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
        {/* Header */}
        <div className="px-4 py-4 flex-shrink-0 shadow-md" style={{backgroundColor: '#103a94'}}>
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-white text-sm font-semibold px-2 text-center truncate uppercase">
              उम्र के अनुसार
            </h1>
            
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto" style={{backgroundColor: '#e3f2fd'}}>
          {/* Age Selection Section - Light Blue Background */}
          <div className="p-4" style={{backgroundColor: '#e3f2fd'}}>
            <div className="space-y-4">
              {/* Label */}
              <div className="flex items-center">
                <span className="text-base font-medium text-gray-900">
                  उम्र चुने
                </span>
              </div>

              {/* Age Input Fields and Search Button */}
              <div className="flex items-center space-x-3">
                {/* Age From Input */}
                <input
                  type="number"
                  placeholder="उम्र से..."
                  value={ageFrom}
                  onChange={(e) => setAgeFrom(e.target.value)}
                  className="flex-1 bg-white rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="0"
                  max="120"
                />

                {/* Age To Input */}
                <input
                  type="number"
                  placeholder="उम्र तक..."
                  value={ageTo}
                  onChange={(e) => setAgeTo(e.target.value)}
                  className="flex-1 bg-white rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="0"
                  max="120"
                />

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:bg-orange-600 transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Results Area - White Background */}
          <div className="bg-white p-3">
            {isLoading ? (
              // Loading Screen
              <div className="flex items-center justify-center h-full py-20">
                <div className="text-center">
                  <div className="mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                      SEARCHING RECORDS IN{' '}
                      <span className="text-orange-500">500000+</span> DATA, PLEASE WAIT....
                    </h2>
                  </div>
                  
                  {/* Loading spinner */}
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
                  </div>
                </div>
              </div>
            ) : !showResults ? (
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
              <div className="space-y-3">
                {/* Voter Cards */}
                {voters.map((voter, index) => (
                  <div key={voter.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* Voter Header with Serial Number Badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 uppercase">
                        {voter.name}
                      </h3>
                    </div>

                    {/* Voter Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">पिता/पति :</span>
                        <span className="text-gray-900">{voter.fatherHusband}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">पता :</span>
                        <div className="flex-1 flex items-start">
                          <span className="text-gray-900 text-xs">{voter.address}</span>
                          <button className="ml-2 w-6 h-6 bg-green-500 rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">क्रमांक :</span>
                        <span className="text-gray-900">{voter.serialNo}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">मोबाइल :</span>
                        <div className="flex items-center">
                          <span className="text-gray-900">{voter.mobile}</span>
                          <button onClick={handleEdit} className="ml-2 w-5 h-5 bg-yellow-500 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">पहचान पत्र नं.:</span>
                        <span className="text-gray-900">{voter.voterId}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">बूथ नं :</span>
                        <span className="text-gray-900">{voter.boothNo}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">घर नं :</span>
                        <span className="text-gray-900">{voter.houseNo || '-'}</span>
                      </div>
                      
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-24">मतदान स्थान :</span>
                        <span className="text-gray-900 text-xs">{voter.pollingStation}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex justify-center space-x-6 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleCall(voter.mobile)}
                        className="flex flex-col items-center space-y-1"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600">Call</span>
                      </button>

                      <button
                        onClick={() => handleCheck(voter)}
                        className="flex flex-col items-center space-y-1"
                      >
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600">Check</span>
                      </button>

                      <button
                        onClick={() => handleFamily(voter)}
                        className="flex flex-col items-center space-y-1"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5 12.01 8.99A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.54.37-2.01.99L4 10.5V22h2v-6h2.5l2.5-7.5h2l2.5 7.5H14v6h2z"/>
                          </svg>
                        </div>
                        <span className="text-xs text-gray-600">Family</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Total Display - Fixed at bottom */}
                <div className="fixed bottom-6 left-4" style={{backgroundColor: '#103a94'}}>
                  <div className="rounded-md px-4 py-2">
                    <span className="text-white font-semibold text-sm">
                      टोटल : {totalVoters}
                    </span>
                  </div>
                </div>
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

