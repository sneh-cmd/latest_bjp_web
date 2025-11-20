import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../common/PageHeader.jsx'
import VoterCard from '../common/VoterCard.jsx'
import ValidationModal from '../modals/ValidationModal.jsx'
import { display_surname_group_sp } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  return []
}

const buildFullName = (item) => {
  const firstName = item.eng_f_name || ''
  const surname = item.f_eng_surname || ''
  if (firstName && surname) {
    return `${firstName} ${surname}`.trim()
  }
  return item.name || 'सदस्य'
}

const SurnameGroupMemberList = ({ navigation }) => {
  const { navigate, state } = navigation
  const adminId = state?.adminId || state?.admin?.adminId || state?.admin?.admin_id || state?.admin?.id
  const adminName = state?.admin?.name || state?.adminName || ''
  const [members, setMembers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [showBoothDropdown, setShowBoothDropdown] = useState(false)
  const [selectedBooth, setSelectedBooth] = useState('all')

  const fetchMembers = useCallback(async () => {
    if (!adminId) {
      setError('Admin ID उपलब्ध नहीं है')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await display_surname_group_sp(adminId, panelApiUrl)
      const records = normalizeResponse(response).map((item) => ({
        id: item.id || item.idcard_no,
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
        mobile: item.contact_no || item.mobile || item.mobile_no || '-',
        contact_no: item.contact_no || '',
        idCardNo: item.idcard_no || item.id || '',
        idcard_no: item.idcard_no || item.id || '',
        boothNo: item.part_no || item.booth_no || '-',
        part_no: item.part_no || '',
        houseNo: item.eng_house_no || item.house_no || '-',
        eng_house_no: item.eng_house_no || '',
        pollingStation: item.eng_polling_location || item.polling_station || '-',
        eng_polling_location: item.eng_polling_location || ''
      }))
      setMembers(records)
    } catch (err) {
      console.error('Error fetching surname group members:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [adminId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Get unique booth numbers
  const uniqueBooths = useMemo(() => {
    const booths = new Set()
    members.forEach((member) => {
      if (member.boothNo && member.boothNo !== '-') {
        booths.add(member.boothNo)
      }
    })
    return Array.from(booths).sort()
  }, [members])


  const filteredMembers = useMemo(() => {
    let filtered = members

    // Filter by booth if selected (skip if 'all')
    if (selectedBooth && selectedBooth !== 'all') {
      filtered = filtered.filter((member) => member.boothNo === selectedBooth)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((member) => {
        const name = buildFullName(member).toLowerCase()
        const mobile = (member.mobile || member.contact_no || '').toString().toLowerCase()
        const idCard = (member.idCardNo || member.idcard_no || '').toString().toLowerCase()
        const serialNo = (member.serialNumber || '').toString().toLowerCase()
        return (
          name.includes(query) ||
          mobile.includes(query) ||
          idCard.includes(query) ||
          serialNo.includes(query)
        )
      })
    }

    return filtered
  }, [members, searchQuery, selectedBooth])

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

  const handleBoothChange = (boothNo) => {
    setSelectedBooth(boothNo)
    setShowBoothDropdown(false)
  }

  const boothOptions = ['all', ...uniqueBooths.filter(Boolean)]

  const handleFamily = (voter) => {
    const candidateVoterKeys = ['voter_id', 'voterId', 'master_id', 'id', 'main_admin_id']
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

  const handleMobileEdit = (voter, newMobileNumber) => {
    if (!voter || !newMobileNumber) return
    
    // Update the member's mobile number in the state
    setMembers((prev) =>
      prev.map((m) => {
        // Match member by id, voter_id, or admin_id
        const isMatch = 
          (m.id && voter.id && m.id === voter.id) ||
          (m.voter_id && voter.voter_id && m.voter_id === voter.voter_id) ||
          (m.admin_id && voter.admin_id && m.admin_id === voter.admin_id)
        
        if (isMatch) {
          return {
            ...m,
            mobile: newMobileNumber,
            contact_no: newMobileNumber,
            phone: newMobileNumber,
            mobile_no: newMobileNumber
          }
        }
        return m
      })
    )
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title="सरनेम के अनुसार"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Booth Selector */}
      <div className="px-4 py-2 flex-shrink-0 border-b border-gray-200" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {filteredMembers.length}
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
                    {booth === 'all' ? 'All' : booth}
                  </button>
                ))}
              </div>
            )}
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
              onClick={fetchMembers}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {!loading && !error && filteredMembers.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
            <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredMembers.length > 0 && (
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            {filteredMembers.map((member, index) => (
              <VoterCard
                key={member.id || `member-${index}`}
                voter={member}
                index={index}
                onCall={(contact) => handleCall(contact)}
                onFamily={handleFamily}
                onCheckModal={handleCheckModal}
                onEditMobile={handleMobileEdit}
                showLocationButton={true}
                showEditButton={true}
                showOtherAddress={false}
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

export default SurnameGroupMemberList

