import React from 'react'
import bjpLogo from '../../../assets/image/ic_app_logo.png'

const StarKaryakartaDetailModal = ({ isOpen, onClose, person }) => {
  if (!isOpen || !person) return null

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
  }

  const handleShare = () => {
    // Handle share functionality
    console.log('Share:', person)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      {/* <div className="absolute inset-0 bg-black bg-opacity-50"></div> */}
      
      <div 
        className="relative bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-sm md:max-w-lg w-full max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with BJP Logo Pattern */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-2 md:px-6 md:py-4 rounded-t-xl md:rounded-t-2xl relative">
          <h2 className="text-white text-sm md:text-xl font-bold text-center">
            स्टार कार्यकर्ता - भारतीय जनता पार्टी
          </h2>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-1 right-1 md:top-4 md:right-4 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 md:p-6">
          {/* Crown Icons */}
          <div className="flex justify-center items-center gap-4 md:gap-8 mb-2 md:mb-0">
            <div className="w-10 h-10 md:w-16 md:h-16">
              <img src="https://img.icons8.com/emoji/96/crown-emoji.png" alt="crown" className="w-full h-full object-contain" />
            </div>
            
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-16 h-16 md:w-28 md:h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-200 to-orange-300 text-orange-700 font-bold text-xl md:text-3xl shadow-lg">
                {getInitials(person.name)}
              </div>
            </div>

            <div className="w-10 h-10 md:w-16 md:h-16">
              <img src="https://img.icons8.com/emoji/96/crown-emoji.png" alt="crown" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Name */}
          <h3 className="text-lg md:text-2xl font-bold text-center text-orange-600 mb-0.5 md:mb-0">
            {person.name}
          </h3>

          {/* Role */}
          <p className="text-center text-sm md:text-lg text-gray-800 font-semibold mb-0.5 md:mb-0">
            {person.role}
          </p>

          {/* Phone Number */}
          <p className="text-center text-blue-900 text-sm md:text-lg font-semibold mb-2 md:mb-0">
            {person.phone || '9909345328'}
          </p>

          {/* Stats Grid Container */}
          <div className="border-2 border-blue-900 rounded-lg overflow-hidden mb-2">
            {/* Total Points Bar */}
            <div className="bg-blue-900 px-2 py-1.5 md:px-4 md:py-3 border-b-2 border-white">
              <p className="text-white text-center text-sm md:text-lg font-bold" style={{ color: '#fbbf24' }}>
                टोटल पोईन्ट : {person.points}
              </p>
            </div>

            {/* Row 1: सर्वे and स्लीप */}
            <div className="grid grid-cols-2">
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-r border-b border-white">
                <p className="text-xs md:text-base font-semibold mb-0.5">सर्वे</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.survey || 1}</p>
              </div>
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-b border-white">
                <p className="text-xs md:text-base font-semibold mb-0.5">स्लीप</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.slip || 13}</p>
              </div>
            </div>

            {/* Row 2: मेसेज, फोटो, कॉन्टेक्ट अपडेट */}
            <div className="grid grid-cols-3">
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-r border-b border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">मेसेज</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.message || 0}</p>
              </div>
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-r border-b border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">फोटो</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.photo || 1}</p>
              </div>
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-b border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">कॉन्टेक्ट अपडेट</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.contactUpdate || 1}</p>
              </div>
            </div>

            {/* Row 3: ऑडियो, वीडियो, सेल्फी */}
            <div className="grid grid-cols-3">
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-r border-b border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">ऑडियो</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.audio || 0}</p>
              </div>
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-r border-b border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">वीडियो</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.video || 0}</p>
              </div>
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-b border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">सेल्फी</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.selfie || 0}</p>
              </div>
            </div>

            {/* Row 4: कॉल, एस.एम.एस., प्रिन्ट */}
            <div className="grid grid-cols-3">
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-r border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">कॉल</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.call || 3}</p>
              </div>
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center border-r border-white">
                <p className="text-xs md:text-sm font-semibold mb-0.5">एस.एम.एस.</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.sms || 2}</p>
              </div>
              <div className="bg-blue-900 text-white p-1.5 md:p-2 text-center">
                <p className="text-xs md:text-sm font-semibold mb-0.5">प्रिन्ट</p>
                <p className="text-sm md:text-md font-bold">{person.stats?.print || 0}</p>
              </div>
            </div>
          </div>

          {/* Panel Info */}
          <div className="bg-white border-2 border-orange-400 rounded-lg p-2 md:p-3 mb-2 flex items-center gap-2 md:gap-3">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={bjpLogo} alt="BJP Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-orange-600 font-bold text-sm md:text-lg">{person.panel?.name || 'ठाणे महानगरपालिका'}</p>
              <p className="text-gray-600 text-xs md:text-sm">{person.panel?.number || 'Panel 2'}</p>
            </div>
          </div>

          {/* Share Button */}
         {/*  <button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 md:py-3 rounded-lg font-bold text-sm md:text-lg flex items-center justify-center gap-2 shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            SHARE
          </button> */}
        </div>
      </div>
    </div>
  )
}

export default StarKaryakartaDetailModal
