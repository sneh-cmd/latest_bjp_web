import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../common/PageHeader.jsx'
import ValidationModal from '../modals/ValidationModal.jsx'
import VoterCard from '../common/VoterCard.jsx'
import { displayPhonebookMember } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const candidateVoterKeys = ['voter_id', 'voterId', 'master_id', 'id', 'main_admin_id']
const mobileKeys = ['mobile', 'mobile_no', 'contact_no', 'phone', 'phone_no', 'mobileNo']

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload?.members && Array.isArray(payload.members)) return payload.members
  return []
}

const pickValue = (payload, keys = []) => {
  if (!payload) return ''
  for (const key of keys) {
    const value = payload[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return ''
}

const sanitizePhoneNumber = (value) => (value || '').toString().replace(/\s+/g, '').trim()
const hasValidPhoneNumber = (value) => {
  const sanitized = sanitizePhoneNumber(value)
  return sanitized.length >= 10
}

const getNumericId = (value) => {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  if (!trimmed || !/^\d+$/.test(trimmed)) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const buildFullName = (member) => {
  const directName = pickValue(member, ['name', 'full_name', 'member_name', 'eng_name'])
  if (directName) return directName

  const englishParts = [
    member.eng_f_name,
    member.eng_m_name,
    member.eng_l_name,
    member.eng_s_name,
    member.f_eng_surname
  ].filter(Boolean)

  if (englishParts.length > 0) {
    return englishParts.join(' ').replace(/\s+/g, ' ').trim()
  }

  return pickValue(member, ['hindi_name', 'name_in_marathi']) || 'सदस्य'
}

const formatAddress = (member) => {
  const addressParts = [
    member.address,
    member.address_line1,
    member.address_line2,
    member.locality,
    member.area,
    member.city,
    member.district,
    member.state
  ]
    .map((part) => (part || '').toString().trim())
    .filter(Boolean)

  return addressParts.join(', ')
}

const calculateStats = (members = []) => {
  if (!Array.isArray(members) || members.length === 0) {
    return { total: 0, visits: 0, unavailable: 0, remaining: 0 }
  }

  let visits = 0
  let unavailable = 0
  let remaining = 0

  members.forEach((member) => {
    const availabilityValue = pickValue(member, [
      'voter_available',
      'visit_available',
      'mulakat_status',
      'meeting_status',
      'available_status'
    ])

    const normalizedAvailability =
      typeof availabilityValue === 'string'
        ? availabilityValue.trim().toLowerCase()
        : availabilityValue

    const notAvailableStatus = (pickValue(member, ['not_available_status', 'notAvailableStatus']) || '')
      .toString()
      .trim()

    if (normalizedAvailability === 1 || normalizedAvailability === '1' || normalizedAvailability === 'yes') {
      visits += 1
      return
    }

    if (normalizedAvailability === 0 || normalizedAvailability === '0') {
      if (notAvailableStatus !== '') {
        unavailable += 1
      } else {
        remaining += 1
      }
      return
    }

    if (!availabilityValue) {
      if (notAvailableStatus !== '') {
        unavailable += 1
      } else {
        remaining += 1
      }
    }
  })

  const total = members.length
  const fallbackRemaining = Math.max(0, total - visits - unavailable)
  if (remaining === 0 && fallbackRemaining > 0) {
    remaining = fallbackRemaining
  }

  return { total, visits, unavailable, remaining }
}

const KaryakartaPhonebookMembers = ({ navigation }) => {
  const { navigate, state } = navigation
  const adminData = state?.admin || {}
  const adminId = adminData?.adminId || adminData?.admin_id || adminData?.id

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visitFilter, setVisitFilter] = useState('all') // 'all' | 'visited' | 'unavailable' | 'remaining'
  const [infoModal, setInfoModal] = useState({ open: false, message: '' })

  const fetchMembers = useCallback(async () => {
    if (!adminId) {
      setError('एडमिन जानकारी उपलब्ध नहीं है')
      setLoading(false)
      return
    }

    // Convert adminId to number if it's a string
    const numericAdminId = Number(adminId)
    if (isNaN(numericAdminId) || numericAdminId <= 0) {
      setError('अमान्य एडमिन ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching phonebook members for admin_id:', numericAdminId)
      const panelApiUrl = localStorageManager.getApiUrl()
      console.log('Panel API URL:', panelApiUrl)
      
      const response = await displayPhonebookMember(numericAdminId, panelApiUrl)
      console.log('Phonebook member response:', response)
      
      const records = normalizeResponse(response)
      console.log('Normalized records:', records)
      setMembers(records)
    } catch (err) {
      console.error('Error fetching phonebook members:', err)
      console.error('Admin ID used:', numericAdminId)
      console.error('Admin data:', adminData)
      setError(err.message || 'डेटा लोड करने में समस्या')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [adminId, adminData])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const stats = useMemo(() => calculateStats(members), [members])

  // Helper function to check if member is visited (voter_available === 1)
  const isMemberVisited = (member) => {
    const availabilityValue = pickValue(member, [
      'voter_available',
      'visit_available',
      'mulakat_status',
      'meeting_status',
      'available_status'
    ])
    return availabilityValue === 1 || availabilityValue === '1' || availabilityValue === 'yes'
  }

  // Helper function to check if member is unavailable
  // Unavailable: voter_available === 0 and not_available_status is not empty
  const isMemberUnavailable = (member) => {
    const availabilityValue = pickValue(member, [
      'voter_available',
      'visit_available',
      'mulakat_status',
      'meeting_status',
      'available_status'
    ])
    const notAvailableStatus = (pickValue(member, ['not_available_status', 'notAvailableStatus']) || '')
      .toString()
      .trim()
    
    const isNotVisited = availabilityValue === 0 || availabilityValue === '0' || !availabilityValue
    return isNotVisited && notAvailableStatus !== ''
  }

  // Helper function to check if member visit is remaining
  // Remaining: voter_available is 0, null, undefined, or empty AND not_available_status is empty
  const isMemberRemaining = (member) => {
    const availabilityValue = pickValue(member, [
      'voter_available',
      'visit_available',
      'mulakat_status',
      'meeting_status',
      'available_status'
    ])
    const notAvailableStatus = (pickValue(member, ['not_available_status', 'notAvailableStatus']) || '')
      .toString()
      .trim()
    
    // If visited, not remaining
    if (availabilityValue === 1 || availabilityValue === '1' || availabilityValue === 'yes') {
      return false
    }
    // If unavailable, not remaining
    if (notAvailableStatus !== '') {
      return false
    }
    // Otherwise, it's remaining
    return true
  }

  const filteredMembers = useMemo(() => {
    let filtered = members

    // Apply visit filter
    if (visitFilter === 'visited') {
      filtered = filtered.filter((member) => isMemberVisited(member))
    } else if (visitFilter === 'unavailable') {
      filtered = filtered.filter((member) => isMemberUnavailable(member))
    } else if (visitFilter === 'remaining') {
      filtered = filtered.filter((member) => isMemberRemaining(member))
    }
    // If visitFilter === 'all', no filtering needed

    // Apply search query filter
    if (!searchQuery.trim()) return filtered
    const query = searchQuery.toLowerCase()
    return filtered.filter((member) => {
      // Use eng_f_name and f_eng_surname for name search
      const firstName = (member.eng_f_name || '').toString().toLowerCase()
      const surname = (member.f_eng_surname || '').toString().toLowerCase()
      const fullName = `${firstName} ${surname}`.trim().toLowerCase()
      const name = fullName || buildFullName(member).toLowerCase()
      const mobile = mobileKeys
        .map((key) => (member[key] || '').toString().toLowerCase())
        .find((val) => val.includes(query))
      return name.includes(query) || Boolean(mobile)
    })
  }, [members, searchQuery, visitFilter])

  const openInfoModal = (message) => {
    setInfoModal({ open: true, message })
  }

  const closeInfoModal = () => setInfoModal({ open: false, message: '' })

  const handleBack = () => {
    navigate(-1)
  }

  const handleCall = (contact, member) => {
    let mobile = contact
    if (!hasValidPhoneNumber(mobile)) {
      mobile = mobileKeys.map((key) => member[key]).find((value) => hasValidPhoneNumber(value))
    }
    if (!mobile) {
      openInfoModal('मोबाइल नंबर उपलब्ध नहीं है')
      return
    }
    window.open(`tel:${sanitizePhoneNumber(mobile)}`, '_self')
  }

  const handleCheck = () => {
    openInfoModal('यह सुविधा जल्द उपलब्ध होगी')
  }

  const handleFamily = (member) => {
    const numericId = candidateVoterKeys
      .map((key) => getNumericId(member[key]))
      .find((value) => value !== null)

    if (!numericId) {
      openInfoModal('परिवार की जानकारी उपलब्ध नहीं है')
      return
    }

    const displayName = buildFullName(member)
    navigate('/family-screen', {
      voterId: numericId,
      name: displayName
    })
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title={adminData?.name || 'फोनबुक सदस्य'}
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      <div className="px-3 sm:px-4 py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-2 sm:mb-3">
          <button 
            onClick={() => setVisitFilter('all')} 
            className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'all' ? 'ring-2 ring-blue-900' : ''}`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-gray-800">टोटल</div>
            <div className="text-sm sm:text-lg font-bold text-gray-900">{stats.total}</div>
          </button>
          <button 
            onClick={() => setVisitFilter('visited')} 
            className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'visited' ? 'ring-2 ring-blue-900' : ''}`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-gray-800">मुलाकात</div>
            <div className="text-sm sm:text-lg font-bold text-gray-900">{stats.visits}</div>
          </button>
          <button 
            onClick={() => setVisitFilter('unavailable')} 
            className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'unavailable' ? 'ring-2 ring-blue-900' : ''}`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-gray-800">अनुपलब्ध</div>
            <div className="text-sm sm:text-lg font-bold text-gray-900">{stats.unavailable}</div>
          </button>
          <button 
            onClick={() => setVisitFilter('remaining')} 
            className={`bg-white rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 text-center transition-colors ${visitFilter === 'remaining' ? 'ring-2 ring-blue-900' : ''}`}
          >
            <div className="text-[10px] sm:text-xs font-bold text-gray-800">मुलाकात बाकी</div>
            <div className="text-sm sm:text-lg font-bold text-gray-900">{stats.remaining}</div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 sm:py-4 pb-24 sm:pb-28">
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

        {!loading && !error && (
          <>
            {filteredMembers.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
                <p className="text-gray-600 text-sm">कोई सदस्य नहीं मिला</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                {filteredMembers.map((member, index) => {
                  // Construct name from eng_f_name and f_eng_surname
                  const firstName = member.eng_f_name || ''
                  const surname = member.f_eng_surname || ''
                  const fullName = `${firstName} ${surname}`.trim() || buildFullName(member)
                  
                  return (
                    <VoterCard
                      key={`${member.id || member.voter_id || index}`}
                      voter={{
                        ...member,
                        name: fullName,
                        eng_f_name: firstName,
                        f_eng_surname: surname,
                        address: formatAddress(member)
                      }}
                      index={index}
                      onCall={(contact) => handleCall(contact, member)}
                      onFamily={handleFamily}
                      onCheckModal={handleCheck}
                      showLocationButton
                      showOtherAddress
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ValidationModal
        isOpen={infoModal.open}
        message={infoModal.message}
        onClose={closeInfoModal}
      />
    </div>
  )
}

export default KaryakartaPhonebookMembers

