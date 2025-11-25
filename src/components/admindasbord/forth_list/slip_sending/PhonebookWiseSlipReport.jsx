import React, { useRef, useState, useEffect, useCallback } from 'react'
import PageHeader from '../../common/PageHeader'
import { dis_phonebook_wise_slip_send_dash } from '../../../../apidata.jsx'
import ContactActionModal from '../../modals/ContactActionModal.jsx'
import localStorageManager from '../../../../utils/localStorage.js'

// Small Avatar component that prefers image but falls back to initials on error
const Avatar = ({ src, alt, sizeClass = 'w-12 h-12', initials = 'A' }) => {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-white shadow-sm`}>
        <span className="text-white text-sm font-bold">{initials}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm`}
      onError={() => setErrored(true)}
    />
  )
}

const PhonebookWiseSlipReport = ({ navigation }) => {
  const { navigate } = navigation
  const containerRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [phonebookData, setPhonebookData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionContact, setActionContact] = useState(null)

  const fetchPhonebookData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await dis_phonebook_wise_slip_send_dash(panelApiUrl)
      
      console.log('Phonebook wise slip send dash response:', response)
      console.log('Response type:', typeof response)
      console.log('Is array:', Array.isArray(response))
      
      // Normalize response
      let records = []
      if (Array.isArray(response)) {
        records = response
      } else if (response?.result && Array.isArray(response.result)) {
        records = response.result
      } else if (response?.data && Array.isArray(response.data)) {
        records = response.data
      } else if (response && typeof response === 'object') {
        console.log('Response is object, keys:', Object.keys(response))
        if (response.Success === "1" && response.result && Array.isArray(response.result)) {
          records = response.result
        } else if (response.Success === "1" && response.result && !Array.isArray(response.result)) {
          records = [response.result]
        }
      }
      
      console.log('Normalized phonebook records:', records)
      console.log('Records count:', records.length)
      if (records.length > 0) {
        console.log('First record:', records[0])
      }
      
      // Map API response to component structure
      const mappedData = records.map((item, index) => {
        const total = Number(item.total) || 0
        const sent = Number(item.send) || 0
        const notSent = total - sent
        
        // Determine role based on type and sub_type
        let role = 'ऐडमिन'
        if (item.type === 'BP' || item.sub_type === 'BP') {
          role = 'बूथ प्रमुख'
        } else if (item.type === 'AP' || item.sub_type === 'AP') {
          role = 'बिल्डिंग प्रमुख'
        } else if (item.type === 'SP' || item.sub_type === 'SP') {
          role = 'शक्ति केन्द्र प्रमुख'
        }
        
        // Format phone number
        const mobileNo = item.mobile_no || item.mobileNo || item.mobile || ''
        const phone = mobileNo ? (mobileNo.startsWith('+91') ? mobileNo : `+91 ${mobileNo}`) : ''
        
        return {
          id: item.admin_id || item.id || index + 1,
          name: item.name || 'Unknown',
          role: role,
          phone: phone,
          photo: item.photo_path || item.photo || '',
          total: total,
          sent: sent,
          notSent: notSent
        }
      })
      
      console.log('Mapped data:', mappedData)
      setPhonebookData(mappedData)
    } catch (err) {
      console.error('Error fetching phonebook wise slip data:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setPhonebookData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhonebookData()
  }, [fetchPhonebookData])

  const handleBack = () => {
    navigate(-1)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
  }

  const handleOpenActions = (contact, event) => {
    event.stopPropagation()
    if (!contact?.phone || contact.phone === '-') return
    setActionContact(contact)
    setShowActionModal(true)
  }

  const handleActionSelect = (actionType) => {
    if (!actionContact?.phone) return
    const phone = actionContact.phone.replace(/[^0-9+]/g, '')
    if (actionType === 'call') {
      window.open(`tel:${phone}`, '_self')
    } else if (actionType === 'whatsapp') {
      const phoneNumber = phone.startsWith('+') ? phone : `+91${phone}`
      window.open(`https://wa.me/${phoneNumber}`, '_blank')
    } else if (actionType === 'sms') {
      window.open(`sms:${phone}`, '_self')
    }
    setShowActionModal(false)
  }

  const handleCloseActionModal = () => {
    setShowActionModal(false)
    setActionContact(null)
  }

  const renderProfileImage = (item, size = 'w-12 h-12') => {
    // Prefer explicit photo fields from API
    const photoCandidates = [item.photo, item.photo_path, item.photoUrl, item.photo_url, item.image, item.photoPath]
    const rawPhoto = photoCandidates.find((p) => p !== undefined && p !== null) || ''
    const photo = String(rawPhoto || '').trim()

    // Build initials: prefer up to 3 initials (for 3-word names),
    // otherwise 2 initials for two-word names, or first two letters for single-word names.
    const nameParts = String(item.name || 'A').trim().split(/\s+/).filter(Boolean)
    let initials = ''
    if (nameParts.length >= 3) {
      initials = nameParts.slice(0, 3).map((w) => w[0] || '').join('')
    } else if (nameParts.length === 2) {
      initials = nameParts.map((w) => w[0] || '').join('')
    } else if (nameParts.length === 1) {
      initials = (nameParts[0].slice(0, 2) || nameParts[0].slice(0, 1))
    } else {
      initials = 'A'
    }
    initials = initials.toUpperCase()

    const isLikelyValidUrl = (url) => {
      if (!url) return false
      const lowered = url.toLowerCase()
      if (lowered === 'null' || lowered === 'na' || lowered === 'n/a' || lowered === '-') return false
      // Allow absolute http(s), data URIs, or root-relative paths
      return /^(https?:\/\/|data:|\/)\S+/i.test(url)
    }

    // Use Avatar which will fallback to initials if image fails to load
    return (
      <Avatar
        src={isLikelyValidUrl(photo) ? photo : ''}
        alt={item.name || initials || 'A'}
        sizeClass={size}
        initials={initials}
      />
    )
  }

  // Smooth scroll to top on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Filter data based on search query
  const filteredData = phonebookData.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query) ||
      item.phone.includes(query)
    )
  })

  const totalCount = filteredData.length

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-20">
        <PageHeader
          title="फोनबूक अनुसार"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          uppercase={false}
        />

        {/* Summary Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-20 mb-7">
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
              onClick={fetchPhonebookData}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg sm:rounded-xl shadow-md w-full overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow duration-200 active:scale-[0.98]"
                onClick={() => navigate('/phonebook-wise-slip-voters', { userId: item.id, name: item.name })}
              >
                {/* Left border indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2" style={{ backgroundColor: '#102463' }}></div>

                <div className="pl-2 sm:pl-5 pr-2 sm:pr-4 py-2 sm:py-4">
                  {/* Top Section */}
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    {/* Left: User Icon and Info */}
                    <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                      {/* User Icon */}
                      <div className="relative flex-shrink-0">
                        {renderProfileImage(item, 'w-10 h-10 sm:w-14 sm:h-14')}
                      </div>

                      {/* Name and Role */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-lg md:text-xl font-bold text-gray-900 mb-0 sm:mb-1">
                          {item.name}
                        </div>
                        <div className="text-xs sm:text-base text-gray-600 mt-0 sm:mt-0.5">
                          {item.role}
                        </div>
                      </div>
                    </div>

                    {/* Right: Call Icon */}
                    {item.phone && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleOpenActions(item, event)
                        }}
                        className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
                        style={{
                          backgroundColor: '#E3F2FD',
                          color: '#102463'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#BBDEFB'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#E3F2FD'
                        }}
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
                      </button>
                    )}
                  </div>

                  {/* Bottom Section: Metrics */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                    {/* टोटल */}
                    <div className="text-center">
                      <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">टोटल</div>
                      <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: '#2563eb' }}>
                        {item.total}
                      </div>
                    </div>

                    {/* भेज दिया */}
                    <div className="text-center border-l border-r border-gray-200">
                      <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">भेज दिया</div>
                      <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: '#16a34a' }}>
                        {item.sent}
                      </div>
                    </div>

                    {/* नहीं भेजा */}
                    <div className="text-center">
                      <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">नहीं भेजा</div>
                      <div className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: '#dc2626' }}>
                        {item.notSent}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

export default PhonebookWiseSlipReport

