import React, { useState, useEffect } from 'react'
import { displayMatchLadkiBehnoSp } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import ValidationModal from '../modals/ValidationModal.jsx'
import PageHeader from '../common/PageHeader.jsx'
import VoterCard from '../common/VoterCard.jsx'

const LadkiBahenoVoterList = ({ navigation }) => {
  const { navigate, params, state } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [voterData, setVoterData] = useState([])
  const [loading, setLoading] = useState(true)
  const [boothNumber, setBoothNumber] = useState(1)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Get booth number from state (navigation params) or default
    const boothNum = state?.boothNumber || params?.boothNumber || 1
    console.log('LadkiBahenoVoterList: Navigation state:', state)
    console.log('LadkiBahenoVoterList: Booth number from state:', state?.boothNumber, 'from params:', params?.boothNumber, 'Using:', boothNum)
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
        console.log('LadkiBahenoVoterList: Fetching voter data for booth number:', boothNum)

        // Get panel API URL from localStorage
        const apiUrl = localStorageManager.getApiUrl()

        // Fetch matched Ladki Baheno voters
        const apiData = await displayMatchLadkiBehnoSp(boothNum, apiUrl)
        
        console.log('LadkiBahenoVoterList: API response received:', apiData)
        
        if (Array.isArray(apiData) && apiData.length > 0) {
          // Transform API response to component's expected format
          const transformedData = apiData.map((voter, index) => ({
            id: voter.id || index + 1,
            serialNumber: voter.slnoinpart || voter.serialNumber || (index + 1),
            name: voter.name || `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.trim(),
            fatherHusbandName: voter.fatherHusbandName || voter.eng_m_name || '',
            address: voter.address || voter.eng_localityid || '',
            mobileNumber: voter.mobileNumber || voter.contact_no || '',
            idCardNumber: voter.idCardNumber || voter.idcard_no || voter.voter_idcard || '',
            boothNumber: boothNum,
            houseNumber: voter.houseNumber || voter.eng_house_no || '',
            pollingStation: voter.pollingStation || voter.eng_polling_location || '',
            otherAddress: voter.otherAddress || voter.add_add || '-',
            sex: voter.sex || '',
            age: voter.age || '',
            notAvailableStatus: voter.not_available_status || '',
            surveyBy: voter.survey_by || ''
          }))
          
          console.log('LadkiBahenoVoterList: Transformed voter data:', transformedData)
          setVoterData(transformedData)
        } else {
          console.log('LadkiBahenoVoterList: No voters found or invalid response')
          setVoterData([])
        }
      } catch (err) {
        console.error('Error fetching Ladki Baheno voter data:', err)
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
      navigate('/ladki-baheno')
    }, 300)
  }

  const handleMobileEdit = (voter, newMobileNumber) => {
    if (!voter || !newMobileNumber) return
    
    setVoterData(prev => prev.map(v => 
      v.id === voter.id 
        ? { ...v, mobileNumber: newMobileNumber }
        : v
    ))
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
      return true
    }
    
    const query = searchQuery.toLowerCase().trim()
    return (
      (voter.name && voter.name.toLowerCase().includes(query)) ||
      (voter.fatherHusbandName && voter.fatherHusbandName.toLowerCase().includes(query)) ||
      (voter.idCardNumber && voter.idCardNumber.toLowerCase().includes(query))
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">लोड हो रहा है...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">त्रुटि</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            पुनः प्रयास करें
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
        <PageHeader
          title={`बूथ नं : ${currentBoothNum}`}
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

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
            {filteredVoters.map((voter, idx) => {
              // Map voter data to VoterCard expected format
              const voterForCard = {
                ...voter,
                name: voter.name,
                fatherHusband: voter.fatherHusbandName,
                address: voter.address,
                mobile: voter.mobileNumber,
                contact_no: voter.mobileNumber,
                serialNumber: voter.serialNumber,
                idCardNo: voter.idCardNumber,
                idcard_no: voter.idCardNumber,
                boothNo: voter.boothNumber,
                houseNo: voter.houseNumber,
                pollingStation: voter.pollingStation,
                otherAddress: voter.otherAddress,
                add_add: voter.otherAddress
              }
              
              return (
                <VoterCard
                  key={voter.id}
                  voter={voterForCard}
                  index={idx}
                  onCall={handleCallAction}
                  onFamily={handleFamilyAction}
                  onCheckModal={() => setShowModal(true)}
                  showEditButton={false}
                  onEditMobile={handleMobileEdit}
                  showLocationButton={false}
                  showOtherAddress={true}
                />
              )
            })}

            {filteredVoters.length === 0 && (
              <div className="col-span-1 lg:col-span-2 text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">कोई मतदाता नहीं मिला</h3>
                <p className="text-gray-600">कृपया अपने खोज मानदंड को समायोजित करें</p>
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

export default LadkiBahenoVoterList
