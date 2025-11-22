import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import PageHeader from '../../common/PageHeader.jsx'
import VoterCard from '../../common/VoterCard.jsx'
import ValidationModal from '../../modals/ValidationModal.jsx'
import { polling_location_wise_slip_sending_voter } from '../../../../apidata.jsx'
import localStorageManager from '../../../../utils/localStorage.js'

const buildFullName = (voter) => {
  const firstName = voter.eng_f_name || ''
  const surname = voter.f_eng_surname || ''
  if (firstName && surname) {
    return `${firstName} ${surname}`.trim()
  }
  return voter.name || 'मतदाता'
}

const PollingLocationWiseSlipVoterList = ({ navigation }) => {
  const { navigate, state } = navigation
  const containerRef = useRef(null)
  const [voters, setVoters] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const pollingLocation = state?.pollingLocation || ''

  const fetchVoters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!pollingLocation) {
        throw new Error('मतदान स्थल नहीं मिला')
      }

      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await polling_location_wise_slip_sending_voter(pollingLocation, panelApiUrl)

      let records = []
      if (Array.isArray(response)) {
        records = response
      } else if (response?.result && Array.isArray(response.result)) {
        records = response.result
      } else if (response?.data && Array.isArray(response.data)) {
        records = response.data
      } else if (response && typeof response === 'object') {
        if (response.Success === '1' && response.result && Array.isArray(response.result)) {
          records = response.result
        } else if (response.Success === '1' && response.result && !Array.isArray(response.result)) {
          records = [response.result]
        }
      }

      const normalizedRecords = records.map((item) => ({
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
        pollingStation: item.eng_polling_location || item.polling_location || '-',
        eng_polling_location: item.eng_polling_location || item.polling_location || '',
        sendDate: item.send_date || '',
        send_date: item.send_date || '',
        slipSend: Number(item.slip_send) || 0,
        slip_send: Number(item.slip_send) || 0,
        slipCount: Number(item.slip_count) || 0,
        slip_count: Number(item.slip_count) || 0
      }))

      setVoters(normalizedRecords)
    } catch (err) {
      console.error('Error fetching polling location slip voters:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setVoters([])
    } finally {
      setLoading(false)
    }
  }, [pollingLocation])

  useEffect(() => {
    fetchVoters()
  }, [fetchVoters])

  const filteredVoters = useMemo(() => {
    let filtered = voters

    if (statusFilter === 'sent') {
      filtered = filtered.filter(v => Number(v.slip_send) === 1)
    } else if (statusFilter === 'unavailable') {
      filtered = filtered.filter(v => !v.mobile || v.mobile === '-' || v.mobile === '')
    } else if (statusFilter === 'notSent') {
      filtered = filtered.filter(v => Number(v.slip_send) === 0)
    }

    if (!searchQuery.trim()) return filtered
    const query = searchQuery.toLowerCase()
    return filtered.filter((voter) => {
      const name = buildFullName(voter).toLowerCase()
      const mobile = (voter.mobile || voter.contact_no || '').toString().toLowerCase()
      const idCard = (voter.idCardNo || voter.idcard_no || '').toString().toLowerCase()
      return name.includes(query) || mobile.includes(query) || idCard.includes(query)
    })
  }, [voters, searchQuery, statusFilter])

  const totalCount = voters.length
  const sentCount = voters.filter(v => Number(v.slip_send) === 1).length
  const unavailableCount = voters.filter(v => !v.mobile || v.mobile === '-' || v.mobile === '').length
  const notSentCount = voters.filter(v => Number(v.slip_send) === 0).length

  const handleBack = () => {
    navigate(-1)
  }

  const handleCall = (contact) => {
    if (!contact || contact === '-') {
      setValidationMessage('मोबाइल नंबर नहीं मिला')
      setShowValidationModal(true)
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

  const handleEditMobile = (voter, newMobile) => {
    setVoters(prevVoters => 
      prevVoters.map(v => 
        v.id === voter.id 
          ? { ...v, mobile: newMobile, contact_no: newMobile }
          : v
      )
    )
    console.log('Mobile updated for voter:', voter.id, 'New mobile:', newMobile)
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        <PageHeader
          title={pollingLocation || 'मतदान स्थल अनुसार पर्ची रिपोर्ट'}
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
          uppercase={false}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 pb-20 sm:pb-24 md:pb-28">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
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
          <div className="mt-3 bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
            <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredVoters.length > 0 && (
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredVoters.map((voter, index) => (
              <VoterCard
                key={voter.id || `voter-${index}`}
                voter={voter}
                index={index}
                onCall={(contact) => handleCall(contact)}
                onFamily={handleFamily}
                onCheckModal={handleCheckModal}
                onEditMobile={handleEditMobile}
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

export default PollingLocationWiseSlipVoterList
