import React, { useState, useEffect, useCallback } from 'react'
import { displayShiftedOutVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'

const TransferredSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooth, setSelectedBooth] = useState('all')
  const [boothOptions, setBoothOptions] = useState([])
  const [showBoothDropdown, setShowBoothDropdown] = useState(false)

  // Fetch transferred survey voters
  const fetchTransferredVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      console.log('Fetching transferred voters from:', panelApiUrl)
      
      // Use the API endpoint
      const response = await displayShiftedOutVoter(panelApiUrl)
      
      console.log('Transferred Survey Response:', response)
      
      // Parse response
      let votersData = []
      
      if (Array.isArray(response)) {
        votersData = response
      } else if (response && response.result && Array.isArray(response.result)) {
        votersData = response.result
      } else if (response && response.data && Array.isArray(response.data)) {
        votersData = response.data
      }
      
      // Map the response to our component format
      const mappedVoters = votersData.map((item, index) => {
        // Combine first name and surname for full name
        const firstName = item.eng_f_name || item.first_name || item.f_name || ''
        const surname = item.eng_surname || item.surname || item.s_name || ''
        const fullName = `${firstName} ${surname}`.trim() || item.name || 'N/A'
        
        return {
          id: item.id || item.voter_id || index + 1,
          name: fullName,
          firstName: firstName,
          surname: surname,
          fatherHusband: item.eng_m_name || item.father_name || item.father_husband || item.m_name || '',
          address: item.eng_localityid || item.address || item.full_address || item.locality || '',
          serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
          mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '-',
          idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
          boothNo: item.part_no || item.booth_no || item.booth_number || '',
          houseNo: item.eng_house_no || item.house_no || item.house_number || '',
          pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
          otherAddress: item.other_address || item.dusra_pata || item.add_add || '-'
        }
      })
      
      console.log('Mapped Transferred Voters:', mappedVoters)
      setVoters(mappedVoters)
      
      // Extract unique booth numbers for filter
      const uniqueBooths = [...new Set(mappedVoters.map(v => v.boothNo).filter(Boolean))].sort((a, b) => {
        const numA = parseInt(a) || 0
        const numB = parseInt(b) || 0
        return numA - numB
      })
      setBoothOptions(['all', ...uniqueBooths])
    } catch (err) {
      console.error('Error fetching transferred voters:', err)
      setError(err.message || 'Failed to fetch transferred survey data')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransferredVoters()
  }, [fetchTransferredVoters])

  // Filter voters based on search query and selected booth
  const filteredVoters = voters.filter(voter => {
    // Booth filter
    if (selectedBooth !== 'all' && voter.boothNo !== selectedBooth) {
      return false
    }
    
    // Search filter
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      voter.name.toLowerCase().includes(query) ||
      voter.fatherHusband.toLowerCase().includes(query) ||
      voter.address.toLowerCase().includes(query) ||
      voter.idCardNo.toLowerCase().includes(query) ||
      voter.mobile.includes(query)
    )
  })

  const handleBack = () => {
    navigate('/cadre-survey-report')
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const handleCall = (voter) => {
    if (voter?.mobile && voter.mobile !== 'N/A' && voter.mobile !== '-') {
      window.location.href = `tel:${voter.mobile}`
    }
  }

  const handleCheck = (voter) => {
    console.log('Check action for:', voter)
    // Add your check logic here
  }

  const handleFamily = (voter) => {
    console.log('Family action for:', voter)
    // Add your family logic here
  }

  const handleBoothChange = (booth) => {
    setSelectedBooth(booth)
    setShowBoothDropdown(false)
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        {/* Header */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 shadow-md" style={{ backgroundColor: '#102463' }}>
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
              <h1 className="text-white text-base sm:text-lg font-semibold">स्थानांतरित</h1>
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
                onClick={handleClearSearch}
              />
            </div>
          </div>
        </div>

        {/* Summary Bar + Booth Filter */}
        <div className="px-2 sm:px-4 py-2 sm:py-3" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {filteredVoters.length}
              </span>
            </div>

            <div className="relative sm:w-auto">
              <button
                onClick={() => setShowBoothDropdown(!showBoothDropdown)}
                className="w-full sm:w-32 flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-left"
              >
                <span className="text-sm font-medium text-gray-700">
                  {selectedBooth === 'all' ? 'बूथ' : `बूथ: ${selectedBooth}`}
                </span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showBoothDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showBoothDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {boothOptions.map((booth) => (
                    <button
                      key={booth}
                      onClick={() => handleBoothChange(booth)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                        selectedBooth === booth ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {booth === 'all' ? 'सभी' : booth}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 pb-24 sm:pb-28">
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
                onClick={fetchTransferredVoters}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                style={{ backgroundColor: '#102463' }}
              >
                पुनः प्रयास करें
              </button>
            </div>
          </div>
        )}

        {/* Voter List */}
        {!loading && !error && (
          <>
            {filteredVoters.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-600 font-medium">
                  {searchQuery || selectedBooth !== 'all' ? 'कोई परिणाम नहीं मिला' : 'कोई डेटा नहीं मिला'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVoters.map((voter, index) => (
                  <div key={voter.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: '#ffffff' }}>
                    <div className="p-3 sm:p-4">
                      {/* Header */}
                      <div className="mb-3">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase">
                          {index + 1}. {voter.name}
                        </h2>
                      </div>

                      {/* Information Section */}
                      <div className="space-y-2 mb-3">
                        {/* पिता/पतिः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">पिता/पतिः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.fatherHusband || 'N/A'}</span>
                        </div>

                        {/* पता */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">पता:</span>
                          <div className="flex-1 flex items-start gap-1.5">
                            <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.address || 'N/A'}</span>
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>

                        {/* क्रमांकः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">क्रमांकः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.serialNumber || 'N/A'}</span>
                        </div>

                        {/* मोबाइल */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">मोबाइल:</span>
                          <div className="flex-1 flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm text-gray-900">{voter.mobile || '-'}</span>
                            <button
                              onClick={() => {
                                console.log('Edit mobile for:', voter.name)
                              }}
                              className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded flex items-center justify-center flex-shrink-0"
                            >
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* पहचान पत्र नं. */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">पहचान पत्र नं.:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.idCardNo || 'N/A'}</span>
                        </div>

                        {/* बूथ नं */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">बूथ नं:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.boothNo || 'N/A'}</span>
                        </div>

                        {/* घर नं: */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">घर नं:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.houseNo || 'N/A'}</span>
                        </div>

                        {/* मतदान स्थानः */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">मतदान स्थानः:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.pollingStation || 'N/A'}</span>
                        </div>

                        {/* दूसरा पता: */}
                        <div className="flex items-start">
                          <span className="text-xs sm:text-sm text-gray-700 font-medium w-28 sm:w-32 flex-shrink-0">दूसरा पता:</span>
                          <span className="text-xs sm:text-sm text-gray-900 flex-1">{voter.otherAddress || '-'}</span>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-gray-300 my-3"></div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-3 sm:gap-4 pt-1">
                        {/* Call Button */}
                        <button
                          onClick={() => handleCall(voter)}
                          className="flex flex-col items-center gap-0.5 group"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:shadow-lg group-active:scale-95" style={{ backgroundColor: '#3b82f6' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Call</span>
                        </button>

                        {/* Check Button */}
                        <button
                          onClick={() => handleCheck(voter)}
                          className="flex flex-col items-center gap-0.5 group"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:shadow-lg group-active:scale-95" style={{ backgroundColor: '#22c55e' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Check</span>
                        </button>

                        {/* Family Button */}
                        <button
                          onClick={() => handleFamily(voter)}
                          className="flex flex-col items-center gap-0.5 group"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all group-hover:shadow-lg group-active:scale-95" style={{ backgroundColor: '#f59e0b' }}>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-gray-900">Family</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TransferredSurvey

