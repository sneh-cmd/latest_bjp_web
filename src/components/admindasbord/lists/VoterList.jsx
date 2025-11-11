import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const VoterList = ({ navigation }) => {
  const { navigate, params, state } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [voterData, setVoterData] = useState([])
  const [loading, setLoading] = useState(true)
  const [boothNumber, setBoothNumber] = useState(5) // Default booth number
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get booth number from state (navigation params) or default
    const boothNum = state?.boothNumber || params?.boothNumber || 5
    console.log('VoterList: Navigation state:', state)
    console.log('VoterList: Booth number from state:', state?.boothNumber, 'from params:', params?.boothNumber, 'Using:', boothNum)
    setBoothNumber(boothNum)

    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [params, state])

  useEffect(() => {
    const fetchVoterData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use the current booth number from state, params, or local state
        const boothNum = state?.boothNumber || params?.boothNumber || boothNumber || 1
        console.log('VoterList: Fetching voter data for booth number:', boothNum)

        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'

        // Use apiService to fetch voter data (handles authentication dynamically)
        const apiData = await apiService.displayBoothWiseVoter(boothNum, panelApiUrl)
        
        console.log('VoterList: API response received:', apiData)
        
        if (Array.isArray(apiData) && apiData.length > 0) {
          // Transform API response to component's expected format
          const transformedData = apiData.map((voter, index) => ({
            id: voter.id || index + 1,
            serialNumber: voter.slnoinpart || voter.serialNumber || (index + 1),
            name: voter.name || `${voter.eng_f_name || ''} ${voter.eng_surname || ''}`.trim(),
            fatherHusbandName: voter.fatherHusbandName || `${voter.eng_m_name || ''} ${voter.f_eng_surname || ''}`.trim(),
            address: voter.address || voter.eng_localityid || '',
            mobileNumber: voter.mobileNumber || voter.contact_no || '',
            idCardNumber: voter.idCardNumber || voter.idcard_no || '',
            boothNumber: boothNum,
            houseNumber: voter.houseNumber || voter.eng_house_no || '',
            pollingStation: voter.pollingStation || voter.eng_polling_location || ''
          }))
          
          console.log('VoterList: Transformed voter data:', transformedData)
          setVoterData(transformedData)
        } else {
          console.log('VoterList: No voters found or invalid response')
          setVoterData([])
        }
      } catch (err) {
        console.error('Error fetching voter data:', err)
        setError(err.message || 'Failed to load voter data')
        setVoterData([])
      } finally {
        setLoading(false)
      }
    }

    fetchVoterData()
  }, [params, boothNumber, state])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/booth-list')
    }, 300)
  }


  const handleMobileEdit = (voterId) => {
    const newMobile = prompt('Enter mobile number:')
    if (newMobile !== null) {
      setVoterData(prev => prev.map(voter => 
        voter.id === voterId 
          ? { ...voter, mobileNumber: newMobile }
          : voter
      ))
    }
  }

  const filteredVoters = voterData.filter(voter => {
    if (!searchQuery || searchQuery.trim() === '') {
      return true; // Show all voters if no search query
    }
    
    const query = searchQuery.toLowerCase().trim();
    return (
      (voter.name && voter.name.toLowerCase().includes(query)) ||
      (voter.fatherHusbandName && voter.fatherHusbandName.toLowerCase().includes(query)) ||
      (voter.idCardNumber && voter.idCardNumber.toLowerCase().includes(query))
    );
  })


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voters...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Voters</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const currentBoothNum = state?.boothNumber || params?.boothNumber || boothNumber || 1

  return (
    <div 
      key={`booth-${currentBoothNum}`}
      className={`relative w-screen h-screen overflow-hidden transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"></div>

      <div className="relative z-10 h-full flex flex-col">
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
            
            <h1 className="text-white text-base sm:text-lg font-semibold">बूथ नं : {currentBoothNum}</h1>
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
              टोटल : {voterData.length}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4 custom-scrollbar" style={{
        backgroundColor: '#e5e8ff',
      }}>
        <div className="grid grid-cols-2 gap-2">
          {filteredVoters.map((voter) => (
            <div key={voter.id} className="bg-white border-l-4 border-blue-400 rounded-lg shadow-sm p-2">
              {/* Serial Number */}
              <div className="text-lg font-bold text-gray-800 mb-1">
                {voter.serialNumber}. {voter.name}
              </div>

              {/* Father/Husband Name */}
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-semibold">पिता/पति :</span> {voter.fatherHusbandName}
              </div>

              {/* Address with Google Maps Icon */}
              <div className="text-xs text-gray-700 mb-1 flex items-start">
                <div className="flex-1">
                  <span className="font-semibold">पता :</span> {voter.address}
                </div>
                <div className="ml-1 flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-1">G</div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>

              {/* Serial Number */}
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-semibold">क्रमांक :</span> {voter.serialNumber}
              </div>

              {/* Mobile Number with Edit Icon */}
              <div className="text-xs text-gray-700 mb-1 flex items-center">
                <span className="font-semibold">मोबाइल :</span> 
                <span className="ml-1">{voter.mobileNumber}</span>
                <button
                  onClick={() => handleMobileEdit(voter.id)}
                  className="ml-1 w-3 h-3 text-gray-500 hover:text-blue-500"
                >
                  ✏️
                </button>
              </div>

              {/* ID Card Number */}
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-semibold">पहचान पत्र नं.:</span> {voter.idCardNumber}
              </div>

              {/* Booth Number */}
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-semibold">बूथ नं :</span> {voter.boothNumber}
              </div>

              {/* House Number */}
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-semibold">घर नं :</span> {voter.houseNumber}
              </div>

              {/* Polling Station */}
              <div className="text-xs text-gray-700 mb-1">
                <span className="font-semibold">मतदान स्थान :</span> {voter.pollingStation}
              </div>

            </div>
          ))}

          {/* Empty State */}
          {filteredVoters.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No voters found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

export default VoterList
