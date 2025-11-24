import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../common/PageHeader.jsx'
import VoterCard from '../../common/VoterCard.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'
import { displayUserWiseCallCenterSurveyVoter } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage.js'

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  return []
}

const getSurveyStatusCode = (item) => {
  return (
    item.voter_status ||
    item.status ||
    item.survey_status ||
    item.call_status ||
    item.result ||
    item.s ||
    ''
  )
}

const statusMatchesFilter = (item, filterKey) => {
  if (!filterKey || filterKey === 'total') return true

  const raw = String(getSurveyStatusCode(item) || '').toUpperCase().trim()
  if (!raw) return false

  switch (filterKey) {
    case 'positive':
      return raw === 'P' || raw === 'POSITIVE'
    case 'negative':
      return raw === 'N' || raw === 'NEGATIVE'
    case 'doubtful':
      return raw === 'D' || raw === 'DOUBTFUL'
    case 'none':
      return raw === 'C' || raw === 'CANT_SAY' || raw === 'NONE'
    case 'received_not':
      return raw === 'NR' || raw === 'NOT_RECEIVED'
    case 'wrong_mobile':
      return raw === 'WM' || raw === 'WRONG_MOBILE'
    default:
      return true
  }
}

// Order like mobile screenshot: पॉजिटिव, नेगेटिव, डाउटफुल, कुछ नहीं, रिसीव नहीं हुई, ग़लत मोबाइल, टोटल सर्वे
const filterOptions = [
  { key: 'positive', label: 'पॉजिटिव' },
  { key: 'negative', label: 'नेगेटिव' },
  { key: 'doubtful', label: 'डाउटफुल' },
  { key: 'none', label: 'कुछ नहीं' },
  { key: 'received_not', label: 'रिसीव नहीं हुई' },
  { key: 'wrong_mobile', label: 'ग़लत मोबाइल' },
  { key: 'total', label: 'टोटल सर्वे' }
]

const UserWiseCallCenterVoterList = ({ navigation }) => {
  const { navigate, state } = navigation
  const userId = state?.userId || state?.admin_id
  const userName = state?.userName || state?.name || 'User'

  const [voters, setVoters] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('total')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [validationOpen, setValidationOpen] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  const fetchVoters = useCallback(async () => {
    if (!userId) {
      setError('यूजर आईडी उपलब्ध नहीं है')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await displayUserWiseCallCenterSurveyVoter(userId, panelApiUrl)
      const records = normalizeResponse(response)

      setVoters(records)
    } catch (err) {
      console.error('Error fetching call center voters for user:', userId, err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  const filteredVoters = useMemo(() => {
    let list = voters

    list = list.filter((item) => statusMatchesFilter(item, selectedFilter))

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((item) => {
        const name = (item.name || '').toLowerCase()
        const mobile = (item.mobile || item.contact_no || item.phone || '').toString().toLowerCase()
        const idCard = (item.idcard_no || item.id_card_no || '').toString().toLowerCase()
        const serial = (item.serial_no || item.slnoinpart || '').toString().toLowerCase()
        return (
          name.includes(q) ||
          mobile.includes(q) ||
          idCard.includes(q) ||
          serial.includes(q)
        )
      })
    }

    return list
  }, [voters, selectedFilter, searchQuery])

  const handleBack = () => {
    navigate(-1)
  }

  const handleCall = (contact) => {
    if (!contact || contact === '-') return
    window.location.href = `tel:${contact}`
  }

  const handleFamilyAction = (voter) => {
    if (!voter) {
      setValidationMessage('परिवार जानकारी के लिए वोटर जानकारी उपलब्ध नहीं है।')
      setValidationOpen(true)
      return
    }

    const voterId = voter.id || voter.voter_id || voter.idcard_no || voter.id_card_no || ''
    const name = voter.name || voter.eng_f_name || ''

    if (voterId) {
      navigate('/family-screen', {
        voterId,
        name,
        userId
      })
    } else {
      setValidationMessage('परिवार जानकारी के लिए वोटर आईडी उपलब्ध नहीं है।')
      setValidationOpen(true)
    }
  }

  const handleCheckModal = () => {
    setValidationMessage('मोबाइल नंबर उपलब्ध नहीं है।')
    setValidationOpen(true)
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title={userName}
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      <div className="px-4 py-2 flex-shrink-0 border-b border-gray-200" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {filteredVoters.length}
            </span>
          </div>

          <div className="relative sm:w-auto">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="w-full sm:w-40 flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-left"
            >
              <span className="text-sm font-medium text-gray-700">
                {filterOptions.find((f) => f.key === selectedFilter)?.label || 'सर्वे'}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(opt.key)
                      setShowFilterDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedFilter === opt.key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 sm:px-4 pb-20">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="mt-4 text-gray-600 text-sm">डेटा लोड हो रहा है...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-red-100 mt-4">
            <div className="text-red-500 text-3xl mb-2">⚠️</div>
            <p className="text-red-600 text-sm font-semibold mb-3">{error}</p>
            <button
              type="button"
              onClick={fetchVoters}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {!loading && !error && filteredVoters.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100 mt-4">
            <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredVoters.length > 0 && (
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            {filteredVoters.map((voter, index) => (
              <VoterCard
                key={voter.id || voter.idcard_no || `voter-${index}`}
                voter={voter}
                index={index}
                onCall={handleCall}
                onFamily={handleFamilyAction}
                onCheckModal={handleCheckModal}
                showLocationButton={false}
                showEditButton={false}
                showOtherAddress={false}
              />
            ))}
          </div>
        )}
      </div>
      <ValidationModal
        isOpen={validationOpen}
        message={validationMessage}
        onClose={() => setValidationOpen(false)}
      />
    </div>
  )
}

export default UserWiseCallCenterVoterList
