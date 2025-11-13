import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import ValidationModal from '../modals/ValidationModal.jsx'
import CheckButton from '../common/CheckButton.jsx'

const VoterList = ({ navigation }) => {
  const { navigate, params, state } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [voterData, setVoterData] = useState([])
  const [loading, setLoading] = useState(true)
  const [boothNumber, setBoothNumber] = useState(5) // Default booth number
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

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

  const handleCallAction = (phoneNumber) => {
    const sanitized = (phoneNumber || '').toString().trim()
    
    // Check if mobile number exists and is valid (not empty, not '-', not 'N/A', and length >= 10)
    if (sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10) {
      window.open(`tel:${sanitized}`, '_self')
    } else {
      // Show modal if mobile number not found or invalid
      setShowModal(true)
    }
  }


  const handleFamilyAction = (voter) => {
    if (!voter || !voter.id) return
    navigate('/family-screen', {
      voterId: voter.id,
      name: voter.name,
      boothNumber: voter.boothNumber
    })
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVoters.map((voter, idx) => (
            <div key={voter.id} className="bg-white rounded-xl border border-gray-300 p-4 h-full flex flex-col">
              <div className="text-base font-extrabold tracking-wide mb-3">{idx + 1}.  {voter.name || '-'}</div>

              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm flex-1">
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.fatherHusbandName || '-'}</span>
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
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.serialNumber || '-'}</span>
                </div>

                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-900 truncate">{voter.mobileNumber || '-'}</span>
                    <button
                      onClick={() => handleMobileEdit(voter.id)}
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
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.idCardNumber || '-'}</span>
                </div>

                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.boothNumber || '-'}</span>
                </div>

                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.houseNumber || '-'}</span>
                </div>

                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.pollingStation || '-'}</span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleCallAction(voter.mobileNumber)}
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

                <CheckButton
                  voter={voter}
                  onShowModal={() => setShowModal(true)}
                />

                <button
                  onClick={() => handleFamilyAction(voter)}
                  className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                  type="button"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2z" />
                    </svg>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
                </button>
              </div>
            </div>
          ))}

          {filteredVoters.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-12">
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
      
      {/* Validation Modal */}
      <ValidationModal
        isOpen={showModal}
        message="मोबाइल नंबर नहीं मिला"
        onClose={() => setShowModal(false)}
        okText="Ok"
      />
      </div>
    </div>
  )
}

export default VoterList
