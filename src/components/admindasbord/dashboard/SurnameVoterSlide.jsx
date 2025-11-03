import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'

const SurnameVoterSlide = ({ navigation, onClose, surnames, surnameListString }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [voters, setVoters] = useState([])
  const [allVoters, setAllVoters] = useState([])
  const [error, setError] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBoothModal, setShowBoothModal] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch voters from API
  useEffect(() => {
    const fetchVoters = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        if (!surnames || surnames.length === 0) {
          throw new Error('No surnames provided')
        }
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
        
        // Create surname list string from selected surnames (prefer provided string)
        const surnameList = (surnameListString && surnameListString.trim())
          ? surnameListString
          : surnames.map(s => s.name).join(',')
        
        const apiSurnameList = surnameList.endsWith(',') ? surnameList : `${surnameList},`
        console.log('Fetching voters for surnames:', apiSurnameList)
        const response = await apiService.surnameWiseSearch(apiSurnameList, panelApiUrl)
        
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
        setAllVoters(transformedVoters)
      } catch (err) {
        console.error('Error fetching voters:', err)
        setError(err.message || 'Failed to fetch voters')
        setVoters([])
        setAllVoters([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchVoters()
  }, [surnames])

  // Filter voters based on search query and booth selection
  useEffect(() => {
    let filtered = allVoters

    // Filter by booth if selected
    if (selectedBooth) {
      filtered = filtered.filter(voter => voter.boothNo === selectedBooth)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(voter =>
        voter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.voterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        voter.mobile.includes(searchQuery) ||
        voter.serialNo.includes(searchQuery) ||
        voter.boothNo.includes(searchQuery) ||
        voter.fatherHusband.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setVoters(filtered)
  }, [searchQuery, selectedBooth, allVoters])

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

  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchQuery('')
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const handleToggleBoothModal = () => {
    setShowBoothModal(!showBoothModal)
  }

  const handleSelectBooth = (boothNo) => {
    setSelectedBooth(boothNo)
    setShowBoothModal(false)
  }

  const handleCloseBoothModal = () => {
    setShowBoothModal(false)
  }

  // Get unique booth numbers from all voters
  const uniqueBooths = [...new Set(allVoters.map(v => v.boothNo))].sort()

  // Total voters
  const totalVoters = voters.length

  // Get selected surnames text
  const baseList = (surnameListString && surnameListString.trim())
    ? surnameListString
    : (surnames && surnames.length > 0 
      ? surnames.map(s => s.name).join(',')
      : '')
  const selectedSurnamesText = baseList
    ? (baseList.endsWith(',') ? baseList : `${baseList},`)
    : 'Selected Surnames'

  return (
    <div className="fixed inset-0 z-50">
      <div className={`relative w-full h-full overflow-hidden transition-all duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Background */}
        <div className="absolute inset-0 bg-gray-100"></div>
      
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
              सरनेम के अनुसार
            </h1>
            
            <button 
              onClick={handleSearchToggle}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Surname Search Bar - Always Visible */}
        <div className="px-4 py-2 flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-700 font-medium">
              {selectedSurnamesText}
            </span>
          </div>
        </div>

        {/* Booth Selection Button */}
        <div className="px-4 py-2 flex-shrink-0 bg-white border-b border-gray-200">
          <button 
            onClick={handleToggleBoothModal}
            className="w-full flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
          >
            <span className="text-sm text-gray-700 font-medium">
              बूथ चुनें
            </span>
            <svg 
              className="w-5 h-5 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Name, Voter ID, Mobile, Serial No... નામ, મતદાર આઈડી શોધો..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-600">
                Found {voters.length} result{voters.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white p-3">
          {isLoading ? (
            // Loading Screen
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    SEARCHING RECORDS IN{' '}
                    <span className="text-orange-500">500000+</span> DATA, PLEASE WAIT....
                  </h2>
                </div>
                
                {/* Illustration */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    {/* Hand holding card */}
                    <svg className="w-64 h-64" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                      {/* Card */}
                      <rect x="60" y="40" width="80" height="100" rx="8" fill="#103a94" stroke="#1e40af" strokeWidth="2"/>
                      <rect x="65" y="45" width="70" height="90" rx="4" fill="#1e3a8a"/>
                      
                      {/* Profile picture */}
                      <circle cx="95" cy="75" r="15" fill="#e5e7eb"/>
                      <path d="M 85 85 Q 85 80 95 80 T 105 85 Q 105 90 95 95 Q 85 90 85 85" fill="#9ca3af"/>
                      <circle cx="90" cy="72" r="2" fill="#374151"/>
                      <circle cx="100" cy="72" r="2" fill="#374151"/>
                      
                      {/* Name field */}
                      <rect x="75" y="95" width="40" height="8" fill="#6b7280" rx="2"/>
                      
                      {/* ID field */}
                      <rect x="75" y="107" width="30" height="6" fill="#6b7280" rx="1"/>
                      
                      {/* Date field */}
                      <rect x="75" y="117" width="25" height="6" fill="#6b7280" rx="1"/>
                      
                      {/* Address field */}
                      <rect x="75" y="127" width="35" height="6" fill="#6b7280" rx="1"/>
                      
                      {/* Name label */}
                      <text x="105" y="102" fontSize="10" fill="#a855f7" fontWeight="bold">Name</text>
                      <text x="122" y="102" fontSize="8" fill="#9333ea">John Doe</text>
                      
                      {/* ID label */}
                      <text x="75" y="115" fontSize="10" fill="#3b82f6" fontWeight="bold">ID #</text>
                      <text x="85" y="115" fontSize="8" fill="#2563eb">123-456</text>
                      
                      {/* Date label */}
                      <text x="105" y="125" fontSize="8" fill="#a855f7">12/08/94</text>
                      
                      {/* Address label */}
                      <text x="115" y="137" fontSize="8" fill="#103a94" fontWeight="bold">12 Street</text>
                    </svg>
                  </div>
                </div>
                
                {/* Loading spinner */}
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            // Error State
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium mb-2">Error loading voters</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          ) : voters.length === 0 ? (
            // Empty State
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-600 font-medium">No voters found</p>
              </div>
            </div>
          ) : (
            // Voter List
            <div className="space-y-3">
              {/* Voter Cards */}
              {voters.map((voter) => (
                <div key={voter.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Voter Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {voter.serialNo}. {voter.name}
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
                      <div className="flex-1 flex items-center">
                        <span className="text-gray-900 text-xs">{voter.address}</span>
                        <button className="ml-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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
              <div className="fixed bottom-6 left-4 bg-gray-700 rounded-md px-4 py-2">
                <span className="text-white font-semibold text-sm">
                  टोटल : {totalVoters}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Booth Selection Modal - Bottom Sheet */}
      {showBoothModal && (
        <div className="fixed inset-0 z-60 flex items-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black opacity-30"
            onClick={handleCloseBoothModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full bg-white rounded-t-xl shadow-lg max-h-[60vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200">
              <button
                onClick={handleCloseBoothModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-lg font-bold text-gray-900">बूथ चुनें</h2>
              
              <div className="w-8"></div> {/* Spacer for centering */}
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto flex-1">
              <div className="divide-y divide-gray-200">
                {uniqueBooths.map((booth) => (
                  <button
                    key={booth}
                    onClick={() => handleSelectBooth(booth)}
                    className={`w-full text-left px-4 py-4 text-lg font-medium transition-colors ${
                      selectedBooth === booth 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {booth}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SurnameVoterSlide

