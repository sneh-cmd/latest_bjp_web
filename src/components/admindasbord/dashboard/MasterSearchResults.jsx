import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MasterSearchModal from '../modals/MasterSearchModal'
import CheckButton from '../common/CheckButton.jsx'
import ValidationModal from '../modals/ValidationModal.jsx'
import PageHeader from '../common/PageHeader.jsx'

const MasterSearchResults = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state || {}

  const results = Array.isArray(locationState.results) ? locationState.results : []
  const total = typeof locationState.total === 'number' ? locationState.total : results.length
  const success = typeof locationState.success === 'boolean' ? locationState.success : results.length > 0
  const error = locationState.error || null

  const [resultSearchQuery, setResultSearchQuery] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const filteredResults = useMemo(() => {
    if (!resultSearchQuery.trim()) return results

    const query = resultSearchQuery.trim().toLowerCase()
    return results.filter((result) => [
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
  }, [resultSearchQuery, results])

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

  const handleBack = () => navigate('/admin')

  const handleNewSearch = () => {
    setIsSearchModalOpen(true)
  }

  const hasResults = results.length > 0
  const hasFilteredResults = filteredResults.length > 0

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
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 font-medium mb-2">Error loading search results</p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <button
                  onClick={handleNewSearch}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  वापस जाएं
                </button>
              </div>
            </div>
          ) : !success && !hasResults ? (
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
              {filteredResults.map((voter, idx) => (
                <div key={`${voter.id}-${idx}`} className="bg-white rounded-xl border border-gray-300 p-4 h-full flex flex-col">
                  <div className="text-base font-extrabold tracking-wide mb-3">{idx + 1}.&nbsp;&nbsp;{voter.name || '-'}</div>

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
                        <button className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0">
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
                      onClick={() => handleCall(voter.mobileNumber)}
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
                      onClick={() => handleFamily(voter)}
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
            </div>
          )}
        </div>
      </div>
      <MasterSearchModal
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

export default MasterSearchResults
