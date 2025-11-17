import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { displayUserWiseSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import CheckButton from '../../common/CheckButton.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'

const PhonebookDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const categoryData = state?.categoryData || {}
  const [activeTab, setActiveTab] = useState('positive')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('मोबाइल नंबर नहीं मिला')

  const sanitizePhoneNumber = (phoneNumber) => (phoneNumber || '').toString().trim()

  const hasValidPhoneNumber = (phoneNumber) => {
    const sanitized = sanitizePhoneNumber(phoneNumber)
    return sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10
  }

  const handleCallAction = (phoneNumber) => {
    const sanitized = sanitizePhoneNumber(phoneNumber)
    if (hasValidPhoneNumber(phoneNumber)) {
      window.open(`tel:${sanitized}`, '_self')
    } else {
      setModalMessage('मोबाइल नंबर नहीं मिला')
      setShowModal(true)
    }
  }

  const getNumericId = (value) => {
    if (value === null || value === undefined) return null
    const trimmed = String(value).trim()
    if (!trimmed || !/^\d+$/.test(trimmed)) return null
    const parsed = Number.parseInt(trimmed, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  const candidateKeys = ['id', 'voter_id', 'voterId', 'voterid', 'voterID', 'master_id', 'main_admin_id']

  const handleFamilyNavigation = (voter) => {
    if (!voter) return

    const numericVoterId = candidateKeys
      .map((key) => getNumericId(voter[key]))
      .filter((value) => value !== null)[0]

    if (!numericVoterId) {
      console.warn('Unable to open family screen. Numeric voter id missing for voter:', voter)
      setModalMessage('परिवार की जानकारी उपलब्ध नहीं है')
      setShowModal(true)
      return
    }

    const voterName = `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.trim() || 'परिवार'
    sessionStorage.setItem('phonebookDetailActiveTab', activeTab)
    navigate('/family-screen', {
      voterId: numericVoterId,
      name: voterName
    })
  }

  useEffect(() => {
    const storedActiveTab = sessionStorage.getItem('phonebookDetailActiveTab')
    if (storedActiveTab) {
      setActiveTab(storedActiveTab)
      sessionStorage.removeItem('phonebookDetailActiveTab')
    }
  }, [])

  // Fetch voters from API
  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const adminId = categoryData.id || categoryData.admin_id || categoryData.adminId || categoryData.user_id
      
      console.log('Phonebook Detail Data:', categoryData)
      console.log('Admin ID (using):', adminId)
      
      if (!adminId) {
        console.error('Admin ID not found in:', categoryData)
        setError('Admin ID not found. Please check console for details.')
        setLoading(false)
        return
      }

      const panelApiUrl = localStorageManager.getApiUrl()
      console.log('Fetching voters for admin_id:', adminId, 'survey_from: ph', 'from:', panelApiUrl || 'default endpoint')
      
      const response = await displayUserWiseSurveyVoter(adminId, 'ph', panelApiUrl)
      
      console.log('API Response Type:', typeof response)
      console.log('API Response:', response)
      console.log('Is Array:', Array.isArray(response))
      
      if (response && Array.isArray(response)) {
        console.log('Voters fetched:', response.length)
        setVoters(response)
      } else if (response && typeof response === 'object') {
        const votersList = response.result || response.data || response.voters || []
        if (Array.isArray(votersList)) {
          console.log('Voters fetched from wrapped response:', votersList.length)
          setVoters(votersList)
        } else {
          console.warn('Unexpected response format:', response)
          setVoters([])
        }
      } else {
        console.warn('No voters found in response:', response)
        setVoters([])
      }
    } catch (err) {
      console.error('Error fetching user wise survey voters:', err)
      setError(err.message || 'Failed to fetch voter data')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [categoryData])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  // Filter voters based on active tab + search query
  const filteredVoters = useMemo(() => {
    if (!voters || voters.length === 0) return []
    
    return voters.filter(voter => {
      const rawStatus = voter.voter_status || voter.voter_status1 || voter.voterStatus
      const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''

      const matchesTab = (() => {
        switch(activeTab) {
          case 'positive':
            return status === 'p'
          case 'negative':
            return status === 'n'
          case 'doubtful':
            return status === 'd'
          case 'nothing':
            return status === 'c'
          default:
            return true
        }
      })()

      if (!matchesTab) return false

      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const name = `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.toLowerCase()
      const phone = (voter.contact_no || voter.mobile || voter.phone || '').toString().toLowerCase()
      return name.includes(query) || phone.includes(query)
    })
  }, [voters, activeTab, searchQuery])

  // Calculate counts for each tab
  const tabCounts = useMemo(() => {
    if (!voters || voters.length === 0) {
      return { positive: 0, negative: 0, doubtful: 0, nothing: 0 }
    }
    
    return {
      positive: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'p'
      }).length,
      negative: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'n'
      }).length,
      doubtful: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'd'
      }).length,
      nothing: voters.filter(v => {
        const rawStatus = v.voter_status || v.voter_status1 || v.voterStatus
        const status = rawStatus ? String(rawStatus).toLowerCase().trim() : ''
        return status === 'c'
      }).length
    }
  }, [voters])

  const totalVoters = filteredVoters.length

  const handleBack = () => {
    navigate('/phonebook-survey')
  }

  const handleLogNavigation = (voter) => {
    if (!voter) return
    sessionStorage.setItem('phonebookDetailActiveTab', activeTab)
    navigate('/voter-log', {
      voter,
      categoryData
    })
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <PageHeader
        title={categoryData.name || 'फोनबूक'}
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Summary Bar with Tabs */}
      <div className="px-2 sm:px-4 py-1.5 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 flex-wrap">
          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg inline-block">
            <span className="text-xs sm:text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {totalVoters || 0}
            </span>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 sm:space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('positive')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'positive' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              पॉजिटिव-{tabCounts.positive || categoryData.positive || 0}
            </button>
            <button
              onClick={() => setActiveTab('negative')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'negative' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              नेगेटिव-{tabCounts.negative || categoryData.negative || 0}
            </button>
            <button
              onClick={() => setActiveTab('doubtful')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'doubtful' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              डाउटफुल-{tabCounts.doubtful || categoryData.doubtful || 0}
            </button>
            <button
              onClick={() => setActiveTab('nothing')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'nothing' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              कुछ नहीं-{tabCounts.nothing || categoryData.nothing || 0}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-24 ">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
            <p className="mt-4 text-gray-600 text-xs sm:text-sm">डेटा लोड हो रहा है...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-red-700 text-base sm:text-lg font-semibold mb-4">{error}</p>
            <button
              onClick={fetchVoters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors	duration-200"
              style={{ backgroundColor: '#102463' }}
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : totalVoters > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            {filteredVoters.map((voter, index) => {
              const voterContact = voter.contact_no || voter.mobile || voter.phone || ''
              const hasValidContact = hasValidPhoneNumber(voterContact)
              const cardKey = voter.id || voter.voter_id || voter.admin_id || `${voter.idcard_no || ''}-${index}`

              return (
                <div key={cardKey} className="bg-white rounded-xl border border-gray-300 p-4 h-full flex flex-col relative">
              
              {/* Name */}
              <div className="text-base font-extrabold tracking-wide mb-3">
                {index + 1}.&nbsp;&nbsp;{(voter.eng_f_name || '') + ' ' + (voter.f_eng_surname || '')}
              </div>

              {/* Information Fields */}
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm flex-1">
                {/* पिता/पति */}
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.eng_m_name || '-'}</span>
                </div>

                {/* पता */}
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पता:</span>
                  <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-2">
                    <span className="text-gray-900 break-words flex-1">{voter.eng_localityid || '-'}</span>
                    {voter.lat_long && (
                      <button 
                        className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        onClick={() => {
                          const [lat, lng] = voter.lat_long.split(',')
                          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                        }}
                      >
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* क्रमांक */}
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">क्रमांक:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.slnoinpart || voter.serialNo || '-'}</span>
                </div>

                {/* मोबाइल */}
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
                  <div className="flex items-center min-w-0">
                    <span className="text-gray-900 truncate">{voterContact || '-'}</span>
                    {voterContact && (
                      <button className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0ल-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* पहचान पत्र नं. */}
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.idcard_no || '-'}</span>
                </div>

                {/* बूथ नं */}
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.part_no || voter.booth_no || '-'}</span>
                </div>

                {/* घर नं */}
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.eng_house_no || voter.houseNo || '-'}</span>
                </div>

                {/* मतदान स्थान */}
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.eng_polling_location || voter.pollingStation || '-'}</span>
                </div>

                {/* दूसरा पता */}
                <div className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">दूसरा पता:</span>
                  <span className="text-gray-900 break-words flex-1 min-w-0">{voter.add_add || voter.secondAddress || '-'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-100">
                {/* Call Button */}
                <button
                  onClick={() => handleCallAction(voterContact)}
                  className={`flex flex-col items-center space-y-0.5 sm:space-y-1 ${!hasValidContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                  type="button"
                  disabled={!hasValidContact}
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

                {/* Check Button */}
                <CheckButton
                  voter={voter}
                  onShowModal={() => {
                    setModalMessage('मोबाइल नंबर नहीं मिला')
                    setShowModal(true)
                  }}
                />

                {/* Family Button */}
                <button
                  className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                  type="button"
                  onClick={() => handleFamilyNavigation(voter)}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2z" />
                    </svg>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
                </button>
                {/* Log Button */}
                <button
                  className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                  type="button"
                  onClick={() => handleLogNavigation(voter)}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center transition-all hover:scale-105">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="white" opacity="0.2" />
                      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600">Log</span>
                </button>
              </div>
            </div>
          )
        })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-xs sm:text-sm">कोई डेटा उपलब्ध नहीं है</p>
          </div>
        )}

        {/* Background with Lotus Logo */}
        <div className="relative w-full flex items-center justify-center py-6" style={{ backgroundColor: '#e5e8ff', minHeight: '150px' }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <svg className="w-40 h-40 sm:w-48 sm:h-48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20 L120 60 L160 60 L130 90 L140 130 L100 110 L60 130 L70 90 L40 60 L80 60 Z" fill="#FFA500" opacity="0.4"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        okText="Ok"
      />
    </div>
  )
}

export default PhonebookDetailSlide

