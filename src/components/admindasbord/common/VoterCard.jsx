import React from 'react'
import CheckButton from './CheckButton.jsx'

const VoterCard = ({
  voter,
  index,
  onCall,
  onFamily,
  onLog,
  onCheckModal,
  onEditMobile,
  showLocationButton = false,
  showEditButton = false,
  showOtherAddress = true,
  topBadge = null,
  cardBgColor = 'white' // 'white' or 'sky'
}) => {
  // Extract voter contact with fallbacks
  const voterContact = voter.mobile || voter.contact_no || voter.phone || ''
  
  // Extract voter name with fallbacks
  const voterName = voter.name || 
    (voter.eng_f_name && voter.f_eng_surname ? `${voter.eng_f_name} ${voter.f_eng_surname}`.trim() : '') ||
    voter.firstName || voter.eng_f_name || 'N/A'
  
  // Extract father/husband name with fallbacks
  const fatherHusband = voter.fatherHusband || voter.eng_m_name || voter.father_name || voter.m_name || '-'
  
  // Extract address with fallbacks
  const address = voter.address || voter.eng_localityid || voter.full_address || voter.locality || '-'
  
  // Extract serial number with fallbacks
  const serialNumber = voter.serialNumber || voter.slnoinpart || voter.serial_no || voter.kramank || 'N/A'
  
  // Extract ID card number with fallbacks
  const idCardNo = voter.idCardNo || voter.idcard_no || voter.id_card_no || voter.epic_no || voter.epic || '-'
  
  // Extract booth number with fallbacks
  const boothNo = voter.boothNo || voter.partNo || voter.part_no || voter.booth_no || voter.booth_number || '-'
  
  // Extract house number with fallbacks
  const houseNo = voter.houseNo || voter.eng_house_no || voter.house_no || voter.house_number || '-'
  
  // Extract polling station with fallbacks
  const pollingStation = voter.pollingStation || voter.eng_polling_location || voter.polling_station || voter.polling_location || '-'
  
  // Extract other address with fallbacks
  const otherAddress = voter.otherAddress || voter.other_address || voter.dusra_pata || voter.add_add || voter.secondAddress || '-'

  // Get card key for React
  const cardKey = voter.id || voter.voter_id || voter.admin_id || `${idCardNo || ''}-${index}`
/* 
  const handleLocationClick = () => {
    const latLongValue = voter.latLong || voter.lat_long || ''
    if (latLongValue) {
      const [lat, lng] = latLongValue.split(',')
      if (lat && lng) {
        window.open(`https://www.google.com/maps?q=${lat.trim()},${lng.trim()}`, '_blank')
      }
    }
  } */

  const handleMobileEdit = () => {
    if (!onEditMobile) return
    
    const currentMobile = voterContact || ''
    const newMobile = prompt('Enter mobile number:', currentMobile !== '-' ? currentMobile : '')
    
    if (newMobile !== null && newMobile !== undefined) {
      // Call the callback with the voter and new mobile number
      onEditMobile(voter, newMobile.trim())
    }
  }

  // Determine card background color
  const cardBgClass = cardBgColor === 'white' 
    ? 'bg-white' 
    : 'bg-sky-50' // sky color for remaining visits

  return (
    <div key={cardKey} className={`${cardBgClass} rounded-xl border border-gray-300 p-4 h-full flex flex-col relative overflow-visible`}>
      {/* Top Badge */}
      {topBadge && (
        <div className="absolute top-2 left-2 z-20">
          {topBadge}
        </div>
      )}
      {/* Name - add padding-top when badge is present to avoid overlap */}
      <div
        className={`text-base font-semibold tracking-wide mb-3 ${topBadge ? 'pt-8' : ''} 
          sm:text-base sm:mb-3
          text-sm mb-2
        `}
        style={{
          lineHeight: '1.2',
          wordBreak: 'break-word'
        }}
      >
        <span className="sm:inline block">{index + 1}.&nbsp;&nbsp;{voterName}</span>
      </div>

      {/* Information Fields */}
      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm flex-1">
        {/* पिता/पति */}
        <div className="flex flex-wrap gap-x-2">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
          <span className="text-gray-900 break-words flex-1 min-w-0">{fatherHusband}</span>
        </div>

        {/* पता */}
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पता:</span>
          <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-2">
            <span className="text-gray-900 break-words flex-1">{address}</span>
            {/* {showLocationButton && (
              <button
                className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                onClick={handleLocationClick}
                type="button"
                disabled={!(voter.latLong || voter.lat_long)}
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </button>
            )} */}
          </div>
        </div>

        {/* क्रमांक */}
        <div className="flex flex-wrap gap-x-2">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">क्रमांक:</span>
          <span className="text-gray-900 break-words flex-1 min-w-0">{serialNumber}</span>
        </div>

        {/* मोबाइल */}
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
          <div className="flex items-center min-w-0">
            <span className="text-gray-900 truncate">{voterContact || '-'}</span>
            {/* {showEditButton && (
              <button
                className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0"
                onClick={handleMobileEdit}
                type="button"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
            )} */}
          </div>
        </div>

        {/* पहचान पत्र नं. */}
        <div className="flex flex-wrap gap-x-2">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</span>
          <span className="text-gray-900 break-words flex-1 min-w-0">{idCardNo}</span>
        </div>

        {/* बूथ नं */}
        <div className="flex flex-wrap gap-x-2">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
          <span className="text-gray-900 break-words flex-1 min-w-0">{boothNo}</span>
        </div>

        {/* घर नं */}
        <div className="flex flex-wrap gap-x-2">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
          <span className="text-gray-900 break-words flex-1 min-w-0">{houseNo}</span>
        </div>

        {/* मतदान स्थान */}
        <div className="flex flex-wrap gap-x-2">
          <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
          <span className="text-gray-900 break-words flex-1 min-w-0">{pollingStation}</span>
        </div>

        {/* दूसरा पता */}
        {showOtherAddress && (
          <div className="flex flex-wrap gap-x-2">
            <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">दूसरा पता:</span>
            <span className="text-gray-900 break-words flex-1 min-w-0">{otherAddress}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-100">
        {/* Call Button */}
        {onCall && (
          <button
            onClick={() => onCall(voterContact)}
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
        )}

        {/* Check Button */}
     {/*    {onCheckModal && (
          <CheckButton
            voter={voter}
            onShowModal={onCheckModal}
          />
        )} */}

        {/* Family Button */}
        {onFamily && (
          <button
            className="flex flex-col items-center space-y-0.5 sm:space-y-1"
            type="button"
            onClick={() => onFamily(voter)}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2z" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
          </button>
        )}

        {/* Log Button */}
        {onLog && (
          <button
            className="flex flex-col items-center space-y-0.5 sm:space-y-1"
            type="button"
            onClick={() => onLog(voter)}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center transition-all hover:scale-105">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="white" opacity="0.2" />
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-600">Log</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default VoterCard

