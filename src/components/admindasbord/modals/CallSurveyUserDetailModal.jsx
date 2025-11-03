import React from 'react'

const CallSurveyUserDetailModal = ({ 
  user, 
  onClose, 
  onCall,
  onEdit,
  onDelete
}) => {
  if (!user) return null

  const renderProfileImage = (userData, size = 'w-12 h-12') => {
    // Check if we have a photo URL (either direct photo or photo_path)
    const photoUrl = userData.photoPath || userData.profileImage
    
    if (userData.isPhoto && photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={userData.name}
          className={`${size} rounded-full object-cover border-2 border-blue-200`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    } else {
      // Generate initials from name
      const initials = userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CL'
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-200`}>
          <span className="text-white text-xs font-bold text-center leading-tight">
            {initials}
          </span>
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 text-white" style={{backgroundColor: '#103a94'}}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-sm">
              {renderProfileImage(user, 'w-6 h-6 sm:w-8 sm:h-8')}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">{user.name || 'Unknown User'}</h2>
              <p className="text-blue-100 text-xs sm:text-sm">Call Survey User</p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              Phone Number
            </label>
            <p className="text-gray-800 text-sm sm:text-lg font-medium">{user.phoneNumber || user.phone || user.mobile_no || 'N/A'}</p>
          </div>

          {user.lastLogin && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2" style={{color: '#103a94'}}>
                Last Login
              </label>
              <p className="text-gray-800 text-xs sm:text-sm font-medium">{user.lastLogin}</p>
            </div>
          )}

          {user.boothNumbers && user.boothNumbers.length > 0 && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2" style={{color: '#103a94'}}>
                Booth Numbers
              </label>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {user.boothNumbers.map((boothNumber, idx) => (
                  <span
                    key={idx}
                    className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 text-xs sm:text-sm rounded-full font-medium"
                  >
                    {boothNumber}
                    {idx < user.boothNumbers.length - 1 && ','}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            {/* Actions Row */}
            <div className="flex flex-row space-x-3">
              <button
                onClick={() => {
                  onCall(user)
                  onClose()
                }}
                className="w-12 h-12 text-white font-semibold rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105"
                style={{backgroundColor: '#103a94'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                title="Call Now"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={onEdit}
                className="w-12 h-12 font-semibold rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 bg-blue-500 hover:bg-blue-600 text-white"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (onDelete) {
                    onDelete()
                  }
                }}
                className="w-12 h-12 font-semibold rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 bg-red-500 hover:bg-red-600 text-white"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallSurveyUserDetailModal

