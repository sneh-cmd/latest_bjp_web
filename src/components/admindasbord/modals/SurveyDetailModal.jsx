import React from 'react'

const InfoRow = ({ label, value, highlight, wrap }) => (
  <div className={`flex ${wrap ? 'items-start' : 'items-center'} text-xs sm:text-sm text-gray-700 gap-2`}>
    <span className="font-semibold text-gray-600 w-28 sm:w-32 flex-shrink-0 whitespace-nowrap">{label}</span>
    <span
      className={`${highlight ? 'text-[#102463] font-semibold' : 'text-gray-900'} flex-1 ${
        wrap ? 'text-left whitespace-pre-line break-words' : 'text-right sm:text-left'
      }`}
    >
      {value || '—'}
    </span>
  </div>
)

const SurveyDetailModal = ({ isOpen, onClose, detail, statusInfo, loading, error, fallbackLog }) => {
  if (!isOpen) return null

  const displayData = detail || {}
  const fallback = fallbackLog || {}

  const name = displayData.name || fallback.name || '—'
  const mobile = displayData.mobile_no || displayData.contact_no || fallback.mobile_no || fallback.contact_no || '-'
  const surveyDate = displayData.survey_date || fallback.survey_date || '-'
  const visitLocation = displayData.visit_location || fallback.visit_location || '-'
  const secondaryAddress = displayData.add || displayData.second_address || fallback.address || '-'
  const rationCardColor = displayData.ration_card_color || displayData.ration_card || '-'
  const schemeName = displayData.scheme || displayData.scheme_name || '-'

  const handleOpenMap = () => {
    const latLng = displayData.lat_long || fallback.lat_long
    if (!latLng) return
    const [lat, lng] = latLng.split(',')
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat.trim()},${lng.trim()}`, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100"
          style={{ backgroundColor: '#102463' }}
        >
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold text-white">सर्वे देखिये</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4" style={{ backgroundColor: '#e5e8ff' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <div className="w-8 h-8 border-2 border-[#102463] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs sm:text-sm text-gray-600">सर्वे विवरण लोड हो रहा है...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-red-700 text-sm font-semibold mb-2">{error}</p>
              <p className="text-xs text-red-500">कृपया बाद में पुनः प्रयास करें</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">{name}</p>
                  <p className="text-xs sm:text-sm text-indigo-600">{mobile}</p>
                </div>
                <span className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo?.badgeClass || 'bg-gray-500 text-white'}`}>
                  {statusInfo?.label || 'कुछ नहीं'}
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm space-y-2.5">
                <p className="text-sm sm:text-base font-semibold text-gray-900">व्यक्तिगत जानकारी</p>
                <InfoRow label="सर्वे तारीख" value={surveyDate} />
                <InfoRow label="दूसरा पता" value={secondaryAddress} />
                <InfoRow label="मोबाइल" value={mobile} highlight />
                <div className="space-y-1.5">
                  <InfoRow label="मुलाकात स्थान" value={visitLocation} wrap />
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm space-y-2.5">
                <p className="text-sm sm:text-base font-semibold text-gray-900">अन्य जानकारी</p>
                <div className="grid grid-cols-1 gap-2">
                  <InfoRow label="राशन कार्ड रंग" value={rationCardColor} />
                  <InfoRow label="योजना का नाम" value={schemeName} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SurveyDetailModal

