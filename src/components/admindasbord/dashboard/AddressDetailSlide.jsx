import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'
import AddressVoterSlide from './AddressVoterSlide'

const AddressDetailSlide = ({ navigation, onClose }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [addresses, setAddresses] = useState([])
  const [allAddresses, setAllAddresses] = useState([])
  const [error, setError] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showVoterSlide, setShowVoterSlide] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch addresses from API
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
        
        console.log('Fetching addresses from API...')
        const response = await apiService.displayAllAddress(panelApiUrl)
        
        console.log('API response:', response)
        
        // Transform the response to match our structure
        const transformedAddresses = Array.isArray(response) 
          ? response.map((item, index) => ({
              id: index + 1,
              address: item.eng_localityid || item.address || item
            }))
          : []
        
        setAddresses(transformedAddresses)
        setAllAddresses(transformedAddresses)
      } catch (err) {
        console.error('Error fetching addresses:', err)
        setError(err.message || 'Failed to fetch addresses')
        setAddresses([])
        setAllAddresses([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAddresses()
  }, [])

  // Filter addresses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setAddresses(allAddresses)
      return
    }

    const filtered = allAddresses.filter((addr) => {
      const query = searchQuery.toLowerCase()
      return addr.address.toLowerCase().includes(query)
    })

    setAddresses(filtered)
  }, [searchQuery, allAddresses])

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

  const handleAddressClick = (address) => {
    setSelectedAddress(address)
    setShowVoterSlide(true)
  }

  const handleCloseVoterSlide = () => {
    setShowVoterSlide(false)
    setSelectedAddress(null)
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

  // Calculate total addresses
  const totalAddresses = addresses.length

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
            
            <h1 className="text-white text-lg font-semibold">
              पते के अनुसार
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

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search addresses... पते खोजें..."
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
                Found {addresses.length} address{addresses.length !== 1 ? 'es' : ''}
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
                <p className="text-red-600 font-medium mb-2">Error loading addresses</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          ) : addresses.length === 0 ? (
            // Empty State
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">📍</div>
                <p className="text-gray-600 font-medium">No addresses found</p>
              </div>
            </div>
          ) : (
            // Address List
            <div className="space-y-2">
              {/* Address Cards */}
              {addresses.map((address, index) => (
                <div 
                  key={address.id} 
                  className="bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition-colors"
                  onClick={() => handleAddressClick(address.address)}
                >
                  <div className="flex items-start p-3">
                    {/* Number */}
                    <div className="flex flex-col items-center mr-3">
                      <div className="bg-gray-600 text-white w-7 h-7 rounded flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="w-px h-full bg-gray-400 mt-1"></div>
                    </div>
                    
                    {/* Address Text */}
                    <div className="flex-1 pt-1">
                      <p className="text-gray-900 font-medium text-xs leading-relaxed uppercase">
                        {address.address}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total Display - Fixed at bottom */}
              <div className="fixed bottom-6 left-4 bg-gray-700 rounded-md px-4 py-2">
                <span className="text-white font-semibold text-sm">
                  टोटल : {totalAddresses}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Address Voter Slide */}
      {showVoterSlide && selectedAddress && (
        <AddressVoterSlide
          navigation={navigation}
          onClose={handleCloseVoterSlide}
          address={selectedAddress}
        />
      )}
  </div>
  )
}

export default AddressDetailSlide
