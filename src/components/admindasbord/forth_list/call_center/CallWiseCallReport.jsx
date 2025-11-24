import React, { useCallback, useEffect, useRef, useState } from 'react'
import PageHeader from '../../common/PageHeader.jsx'
import ContactActionModal from '../../modals/ContactActionModal.jsx'
import { displayUserWiseCallCenterSurveyDash } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage.js'

const UserCallCard = ({ user, onCallIcon, onOpen }) => {
  const total = user.total ?? 0
  const nr = user.nr ?? 0
  const wm = user.wm ?? 0
  const p = user.p ?? 0
  const n = user.n ?? 0
  const d = user.d ?? 0
  const c = user.c ?? 0

  return (
    <div
      className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onOpen && onOpen(user)}
    >
      {/* Header row with name and call icon */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[70%]">
          {user.name || 'N/A'}
        </div>

        {user.mobile_no && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCallIcon && onCallIcon(user)
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

      {/* Stats grid */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-t">
      <div className="p-2 sm:p-4 border-r text-center">
        <div className="text-lg sm:text-2xl font-bold">{total}</div>
        <div className="text-xs sm:text-sm text-blue-700 mt-1">कुल कॉल</div>
      </div>
      <div className="p-2 sm:p-4 border-r text-center">
        <div className="text-lg sm:text-2xl font-bold">{nr}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">रिसीव नहीं हुई</div>
      </div>
      <div className="p-2 sm:p-4 text-center">
        <div className="text-lg sm:text-2xl font-bold">{wm}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">ग़लत मोबाइल</div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-0 border border-t-0 border-gray-200 rounded-b">
      <div className="p-2 sm:p-3 text-center border-r">
        <div className="text-base sm:text-xl font-bold text-green-700">{p}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">पॉजिटिव</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r">
        <div className="text-base sm:text-xl font-bold text-red-600">{n}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">नेगेटिव</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r sm:border-r">
        <div className="text-base sm:text-xl font-bold text-yellow-500">{d}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">डाउटफुल</div>
      </div>
      <div className="p-2 sm:p-3 text-center">
        <div className="text-base sm:text-xl font-bold text-blue-800">{c}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">कुछ नहीं</div>
      </div>
    </div>
      </div>
    </div>
  )
}

const CallWiseCallReport = ({ navigation }) => {
  const { navigate } = navigation || {}
  const containerRef = useRef(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalUser, setModalUser] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDate, setTempDate] = useState('')

  const fetchData = useCallback(async (date = '') => {
    try {
      setLoading(true)
      setError(null)

      const panelApiUrl = localStorageManager.getApiUrl && localStorageManager.getApiUrl()
      const response = await displayUserWiseCallCenterSurveyDash(date || '', panelApiUrl)

      let dataList = []
      if (Array.isArray(response)) {
        dataList = response
      } else if (response && typeof response === 'object') {
        dataList = response.result || response.data || []
      }

      const mapped = (dataList || []).map((item) => {
        const nr = item.nr ?? item.NR ?? 0
        const wm = item.wm ?? item.WM ?? 0
        const p = item.p ?? item.P ?? 0
        const n = item.n ?? item.N ?? 0
        const c = item.c ?? item.C ?? 0
        const d = item.d ?? item.D ?? 0
        const total = item.total ?? (nr + wm + p + n + c + d)

        return {
          admin_id: item.admin_id,
          name: item.name || '',
          mobile_no: item.mobile_no || '',
          nr,
          wm,
          p,
          n,
          c,
          d,
          total
        }
      })

      setUsers(mapped)
    } catch (err) {
      console.error('Error fetching user wise call center survey data:', err)
      setError(err.message || 'Failed to fetch data')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    fetchData(selectedDate)
  }, [fetchData, selectedDate])

  const handleBack = () => {
    if (navigate) navigate(-1)
  }

  // Modal open logic for call icon
  const handleCallIcon = (user) => {
    setModalUser(user)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalUser(null)
  }

  const handleModalSelect = (actionType) => {
    if (!modalUser) return
    const phone = modalUser.mobile_no
    if (actionType === 'call') {
      window.location.href = `tel:${phone}`
    } else if (actionType === 'whatsapp') {
      window.open(`https://wa.me/${phone}`, '_blank')
    } else if (actionType === 'sms') {
      window.location.href = `sms:${phone}`
    }
    handleModalClose()
  }

  const handleOpenUser = (user) => {
    if (!navigate) return
    navigate('/user-wise-call-center-voters', {
      userId: user.admin_id,
      userName: user.name,
      mobile: user.mobile_no
    })
  }

  // Filter users by search query (name, mobile, or any stat)
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(query) ||
      u.mobile_no.toLowerCase().includes(query) ||
      String(u.total).toLowerCase().includes(query) ||
      String(u.nr).toLowerCase().includes(query) ||
      String(u.wm).toLowerCase().includes(query) ||
      String(u.p).toLowerCase().includes(query) ||
      String(u.n).toLowerCase().includes(query) ||
      String(u.c).toLowerCase().includes(query) ||
      String(u.d).toLowerCase().includes(query)
    )
  })

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <ContactActionModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSelect={handleModalSelect}
      />
      <div className="sticky top-0 z-20">
        <PageHeader
          title="कॉल सेंटर सर्वे"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

        <div className="px-2 sm:px-4 py-2 sm:py-3" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {filteredUsers.length}
              </span>
            </div>
            {/* Date selector button */}
            <div>
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  const iso = today.toISOString().split('T')[0]
                  setTempDate(selectedDate || iso)
                  setShowDatePicker(true)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700"
              >
                <span>तारीख चुनें</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      {showDatePicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">तारीख चुनें</div>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="text-blue-700"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(tempDate)
                  setShowDatePicker(false)
                  fetchData(tempDate)
                }}
                className="text-blue-700 font-semibold"
              >
                ठीक है
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-20 space-y-3 sm:space-y-4 mb-7 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          <div className="text-center py-8 col-span-full">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-base sm:text-lg text-gray-500 mt-4">डेटा लोड हो रहा है...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 col-span-full">
            <p className="text-base sm:text-lg">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 col-span-full">
            <p className="text-base sm:text-lg">कोई परिणाम नहीं मिला</p>
          </div>
        ) : (
          filteredUsers.map((u, index) => {
            const key = u.admin_id || u.mobile_no || `user-${index}`
            return (
              <UserCallCard
                key={key}
                user={u}
                onCallIcon={handleCallIcon}
                onOpen={handleOpenUser}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

export default CallWiseCallReport
