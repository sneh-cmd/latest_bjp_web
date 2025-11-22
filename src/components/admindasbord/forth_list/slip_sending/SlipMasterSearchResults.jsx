import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SlipMasterSearchModal from '../../modals/SlipMasterSearchModal'
import ValidationModal from '../../modals/ValidationModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'
import VoterCard from '../../common/VoterCard.jsx'

const SlipMasterSearchResults = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state || {}

  const results = Array.isArray(locationState.results) ? locationState.results : []
  const [displayResults, setDisplayResults] = useState(results)
  const total = typeof locationState.total === 'number' ? locationState.total : displayResults.length
  const error = locationState.error || null

  const [resultSearchQuery, setResultSearchQuery] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setDisplayResults(results)
  }, [results])

  const filteredResults = useMemo(() => {
    if (!resultSearchQuery.trim()) return displayResults

    const query = resultSearchQuery.trim().toLowerCase()
    return displayResults.filter((result) => [
      result.name,
      result.fatherHusbandName,
      result.address,
      result.serialNumber,
      result.mobileNumber,
      result.idCardNumber,
      result.boothNumber,
      result.houseNumber,
      result.pollingStation
    ]
      .filter(Boolean)
      .some((value) => value.toString().toLowerCase().includes(query)))
  }, [resultSearchQuery, displayResults])

  const handleCall = (phoneNumber) => {
    const sanitized = (phoneNumber || '').toString().trim()
    
    // Check if mobile number exists and is valid (not empty, not '-', not 'N/A', and length >= 10)
    if (sanitized && sanitized !== '-' && sanitized !== 'N/A' && sanitized.length >= 10) {
      window.open(`tel:${sanitized}`, '_self')
    } else {
      // Show modal if mobile number not found or invalid
      setShowModal(true)
    }
  }

  const handleFamily = (voter) => {
    if (!voter) return
    const voterId = voter.id || voter.idCardNumber || null
    if (!voterId) return

    const name = voter.name || ''
    const boothNumber = voter.boothNumber || ''

    const params = new URLSearchParams()
    if (voterId) params.set('voterId', voterId)
    if (name) params.set('name', name)
    if (boothNumber) params.set('boothNumber', boothNumber)

    navigate(`/family-screen${params.toString() ? `?${params.toString()}` : ''}`, {
      state: {
        voterId,
        name,
        boothNumber
      }
    })
  }

  const handleBack = () => navigate(-1)

  const handleNewSearch = () => {
    setIsSearchModalOpen(true)
  }

  const hasResults = displayResults.length > 0
  const hasFilteredResults = filteredResults.length > 0

  const handleMobileEdit = (voter, newMobileNumber) => {
    if (!voter || !newMobileNumber) return
    
    setDisplayResults((prev) =>
      prev.map((v) => {
        // Match voter by id, idCardNumber, or name + fatherHusbandName combination
        const isMatch = 
          (v.id && voter.id && v.id === voter.id) ||
          (v.idCardNumber && voter.idCardNumber && v.idCardNumber === voter.idCardNumber) ||
          (v.name === voter.name && v.fatherHusbandName === voter.fatherHusbandName)
        
        return isMatch
          ? {
              ...v,
              mobileNumber: newMobileNumber,
              mobile: newMobileNumber,
              contact_no: newMobileNumber
            }
          : v
      })
    )
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="bg-white w-full h-full overflow-hidden flex flex-col">
        <PageHeader
          title="मास्टर सर्च"
          onBack={handleBack}
          searchQuery={resultSearchQuery}
          onSearchChange={setResultSearchQuery}
          onSearchClear={() => setResultSearchQuery('')}
        />

        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {total}
              </span>
            </div>
            <button
              onClick={handleNewSearch}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-white font-semibold rounded-lg sm:rounded-xl shadow-sm transition-all text-xs sm:text-sm"
              style={{ backgroundColor: '#0f276d' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0c2059')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f276d')}
            >
              फिर से सर्च कीजिए
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#e5e8ff' }}>
          {error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-4">कोई डेटा उपलब्ध नहीं है</p>
                <p className="text-gray-600 text-sm mb-4">No data available</p>
              </div>
            </div>
          ) : !hasResults ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <p className="text-gray-600 font-medium">कोई परिणाम उपलब्ध नहीं है</p>
                <p className="text-gray-500 text-sm">कृपया खोज मानदंड बदलें और पुनः प्रयास करें</p>
              </div>
            </div>
          ) : hasResults && !hasFilteredResults ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-400 text-5xl mb-4">🔄</div>
                <p className="text-gray-600 font-medium">फ़िल्टर किए गए परिणामों में कोई मिलान नहीं</p>
                <p className="text-gray-500 text-sm">रीसेट या अलग सर्च शब्द का प्रयोग करें</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredResults.map((voter, idx) => {
                // Map voter data to VoterCard expected format
                const voterForCard = {
                  ...voter,
                  name: voter.name || `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.trim() || 'N/A',
                  fatherHusband: voter.fatherHusbandName || `${voter.eng_m_name || ''} ${voter.f_eng_surname || ''}`.trim() || '-',
                  address: voter.address || voter.eng_localityid || '-',
                  mobile: voter.mobileNumber || voter.contact_no || '-',
                  contact_no: voter.mobileNumber || voter.contact_no || '-',
                  serialNumber: voter.serialNumber || voter.slnoinpart || '-',
                  idCardNo: voter.idCardNumber || voter.idcard_no || '-',
                  idcard_no: voter.idCardNumber || voter.idcard_no || '-',
                  boothNo: voter.boothNumber || voter.part_no || '-',
                  part_no: voter.boothNumber || voter.part_no || '-',
                  houseNo: voter.houseNumber || voter.eng_house_no || '-',
                  eng_house_no: voter.houseNumber || voter.eng_house_no || '-',
                  pollingStation: voter.pollingStation || voter.eng_polling_location || '-',
                  eng_polling_location: voter.pollingStation || voter.eng_polling_location || '-'
                }
                
                return (
                  <VoterCard
                    key={`${voter.id}-${idx}`}
                    voter={voterForCard}
                    index={idx}
                    onCall={handleCall}
                    onFamily={handleFamily}
                    onCheckModal={() => setShowModal(true)}
                    onEditMobile={handleMobileEdit}
                    showLocationButton={false}
                    showEditButton={false}
                    showOtherAddress={false}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <SlipMasterSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Validation Modal */}
      <ValidationModal
        isOpen={showModal}
        message="मोबाइल नंबर नहीं मिला"
        onClose={() => setShowModal(false)}
        okText="Ok"
      />
    </div>
  )
}

export default SlipMasterSearchResults

