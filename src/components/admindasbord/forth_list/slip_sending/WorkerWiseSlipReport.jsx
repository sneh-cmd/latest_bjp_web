import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../common/PageHeader.jsx'
import { disUserWiseSlipDistribution } from '../../../../apidata.jsx'
import ContactActionModal from '../../modals/ContactActionModal.jsx'
import localStorageManager from '../../../../utils/localStorage.js'

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  if (payload && typeof payload === 'object') {
    if (payload.Success === "1" && payload.result && Array.isArray(payload.result)) {
      return payload.result
    } else if (payload.Success === "1" && payload.result && !Array.isArray(payload.result)) {
      return [payload.result]
    }
  }
  return []
}

const WorkerWiseSlipReport = ({ navigation }) => {
  const { navigate } = navigation
  const [workerData, setWorkerData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionContact, setActionContact] = useState(null)

  const fetchWorkerData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await disUserWiseSlipDistribution(panelApiUrl)
      
      console.log('User wise slip distribution response:', response)
      
      const records = normalizeResponse(response).map((item, index) => ({
        id: item.admin_id || index + 1,
        adminId: item.admin_id,
        name: item.name || 'N/A',
        mobile: item.mobile_no || '-',
        photo: item.photo_path || '',
        designation: item.designation || item.sub_type || 'एडमिन',
        sentCount: Number(item.total) || 0
      }))
      
      console.log('Mapped worker data:', records)
      setWorkerData(records)
    } catch (err) {
      console.error('Error fetching worker slip data:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setWorkerData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkerData()
  }, [fetchWorkerData])

  const filteredData = useMemo(() => {
    return workerData.filter((item) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(query) ||
        item.designation.toLowerCase().includes(query) ||
        item.mobile.toLowerCase().includes(query)
      )
    })
  }, [workerData, searchQuery])

  const totalCount = filteredData.length

  const handleBack = () => {
    navigate(-1)
  }

  const handleOpenActions = (contact, event) => {
    event.stopPropagation()
    if (!contact?.mobile || contact.mobile === '-') return
    setActionContact(contact)
    setShowActionModal(true)
  }

  const handleActionSelect = (actionType) => {
    if (!actionContact?.mobile) return
    const mobile = actionContact.mobile
    if (actionType === 'call') {
      window.open(`tel:${mobile}`, '_self')
    } else if (actionType === 'whatsapp') {
      const phone = mobile.startsWith('+') ? mobile : `+91${mobile}`
      window.open(`https://wa.me/${phone.replace(/[^0-9+]/g, '')}`, '_blank')
    } else if (actionType === 'sms') {
      window.open(`sms:${mobile}`, '_self')
    }
    setShowActionModal(false)
  }

  const handleCloseActionModal = () => {
    setShowActionModal(false)
    setActionContact(null)
  }

  const renderProfileImage = (item, size = 'w-12 h-12') => {
    if (item.photo) {
      return (
        <img
          src={item.photo}
          alt={item.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
        />
      )
    }

    const initials = (item.name || 'A')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()

    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}
      >
        <span className="text-white text-sm font-bold">{initials || 'A'}</span>
      </div>
    )
  }

  const renderCard = (item, index) => {
    const handleCardClick = () => {
      navigate('/worker-wise-slip-voters', {
        adminId: item.adminId,
        name: item.name
      })
    }

    return (
      <div
        key={`${item.id}-${index}`}
        className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            {renderProfileImage(item, 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate leading-tight">
              {index + 1}. {item.name}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-2 sm:gap-4 mt-2">
              <span className="text-[11px] sm:text-xs text-gray-600">
                {item.designation}
              </span>
              <div className="text-[11px] sm:text-xs text-gray-600 text-right">
                भेज दिया : {item.sentCount}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {item.mobile && item.mobile !== '-' && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleOpenActions(item, event)
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title="कार्यकर्ता अनुसार"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Totals Section */}
      <div className="px-4 py-2 flex-shrink-0 border-b border-gray-200" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4 flex-nowrap overflow-visible">
          <div className="px-2 py-1 rounded-lg inline-block flex-shrink-0">
            <span className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#102463' }}>
              टोटल : {totalCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 sm:px-4 pb-6 space-y-3 sm:space-y-4">
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
              onClick={fetchWorkerData}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {!loading && !error && filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-base sm:text-lg">कोई परिणाम नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredData.map((item, index) => renderCard(item, index))}
          </div>
        )}
      </div>

      <ContactActionModal
        isOpen={showActionModal}
        onClose={handleCloseActionModal}
        onSelect={handleActionSelect}
      />
    </div>
  )
}

export default WorkerWiseSlipReport

