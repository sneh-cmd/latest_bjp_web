import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata'
import localStorageManager from '../../../utils/localStorage'
import DataSearchLoader from '../utils/DataSearchLoader'

const AddressDetailSlide = ({ navigation, onClose }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [addresses, setAddresses] = useState([])
  const [allAddresses, setAllAddresses] = useState([])
  const [error, setError] = useState(null)
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
        navigate('/admin')
      }
    }, 300)
  }

  const handleAddressClick = (address) => {
    if (!address) return
    navigate('/address-voter', { address })
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

              <h1 className="text-white text-base sm:text-lg font-semibold">पते के अनुसार</h1>
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
                टोटल : {totalAddresses}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3" style={{ backgroundColor: '#e5e8ff' }}>
          {isLoading ? null : error ? (
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
                  className="bg-white rounded-md cursor-pointer hover:bg-gray-300 transition-colors"
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
            </div>
          )}
        </div>
      </div>
    </div>

  </div>
  )
}

export default AddressDetailSlide
