import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../common/PageHeader.jsx'
import VoterCard from '../../common/VoterCard.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'
import { disMySlipSendingVoter } from '../../../../apidata.jsx'
import localStorageManager from '../../../../utils/localStorage.js'

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  return []
}

const buildFullName = (voter) => {
  const firstName = voter.eng_f_name || ''
  const surname = voter.f_eng_surname || ''
  if (firstName && surname) {
    return `${firstName} ${surname}`.trim()
  }
  return voter.name || 'मतदाता'
}

const VolunteerSlipVoters = ({ navigation }) => {
  const { navigate, state } = navigation
  const adminId = state?.adminId || state?.userId || ''
  const adminName = state?.name || ''
  const [voters, setVoters] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  const fetchVoters = useCallback(async () => {
    if (!adminId) {
      setError('Admin ID उपलब्ध नहीं है')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      const response = await disMySlipSendingVoter(adminId, panelApiUrl)
      const records = normalizeResponse(response).map((item) => ({
        id: item.id || item.idcard_no || item.idCardNo,
        name: buildFullName(item),
        eng_f_name: item.eng_f_name || '',
        f_eng_surname: item.f_eng_surname || '',
        eng_m_name: item.eng_m_name || '',
        eng_surname: item.eng_surname || '',
        fatherHusband: item.eng_m_name || item.eng_surname || '-',
        address: item.eng_localityid || '-',
        eng_localityid: item.eng_localityid || '',
        serialNumber: item.slnoinpart || item.serial_no || '-',
        slnoinpart: item.slnoinpart || '',
        mobile: item.contact_no || item.mobile || item.mobile_no || '',
        contact_no: item.contact_no || '',
        idCardNo: item.idcard_no || item.id || '',
        idcard_no: item.idcard_no || item.id || '',
        boothNo: item.part_no || item.booth_no || '-',
        part_no: item.part_no || '',
        houseNo: item.eng_house_no || item.house_no || '-',
        eng_house_no: item.eng_house_no || '',
        pollingStation: item.eng_polling_location || item.polling_station || '-',
        eng_polling_location: item.eng_polling_location || '',
        sendDate: item.send_date || '',
        send_date: item.send_date || '',
        slipCount: Number(item.slip_count) || 0,
        slip_count: Number(item.slip_count) || 0
      }))
      setVoters(records)
    } catch (err) {
      console.error('Error fetching slip voters:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  const filteredVoters = useMemo(() => {
    return voters.filter((voter) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const name = buildFullName(voter).toLowerCase()
      const mobile = (voter.mobile || voter.contact_no || '').toString().toLowerCase()
      const idCard = (voter.idCardNo || voter.idcard_no || '').toString().toLowerCase()
      return name.includes(query) || mobile.includes(query) || idCard.includes(query)
    })
  }, [voters, searchQuery])

  const handleBack = () => {
    navigate(-1)
  }

  const handleCall = (contact) => {
    if (!contact || contact === '-') {
      return
    }
    window.location.href = `tel:${contact}`
  }

  const handleCheckModal = () => {
    setValidationMessage('मोबाइल नंबर नहीं मिला')
    setShowValidationModal(true)
  }

  const handleCloseValidationModal = () => {
    setShowValidationModal(false)
    setValidationMessage('')
  }

  const handleFamily = (voter) => {
    // Extract numeric ID from voter
    const candidateVoterKeys = ['voter_id', 'voterId', 'master_id', 'id', 'main_admin_id', 'idcard_no', 'idCardNo']
    const getNumericId = (value) => {
      if (value === null || value === undefined) return null
      const trimmed = String(value).trim()
      if (!trimmed || !/^\d+$/.test(trimmed)) return null
      const parsed = Number.parseInt(trimmed, 10)
      return Number.isNaN(parsed) ? null : parsed
    }

    const numericId = candidateVoterKeys
      .map((key) => getNumericId(voter[key]))
      .find((value) => value !== null)

    if (!numericId) {
      setValidationMessage('परिवार की जानकारी उपलब्ध नहीं है')
      setShowValidationModal(true)
      return
    }

    const displayName = buildFullName(voter)
    navigate('/family-screen', {
      voterId: numericId,
      name: displayName
    })
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title={adminName || 'स्लिप प्राप्तकर्ता'}
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Summary Bar */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {filteredVoters.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 sm:px-4 pb-20">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 text-sm">डेटा लोड हो रहा है...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-red-100">
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
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
            <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredVoters.length > 0 && (
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            {filteredVoters.map((voter, index) => (
              <VoterCard
                key={voter.id || `voter-${index}`}
                voter={voter}
                index={index}
                onCall={(contact) => handleCall(contact)}
                onFamily={handleFamily}
                onCheckModal={handleCheckModal}
                showLocationButton={true}
                showEditButton={true}
                showOtherAddress={false}
                topBadge={
                  voter.slipCount > 0 ? (
                    <div 
                      className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold shadow-md whitespace-nowrap" 
                      style={{ 
                        backgroundColor: '#ffa500', 
                        color: '#ffffff',
                      }}
                    >
                      {voter.slipCount} बार स्लिप भेजी
                    </div>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </div>

      <ValidationModal
        isOpen={showValidationModal}
        message={validationMessage}
        onClose={handleCloseValidationModal}
        okText="Ok"
      />
    </div>
  )
}

export default VolunteerSlipVoters

