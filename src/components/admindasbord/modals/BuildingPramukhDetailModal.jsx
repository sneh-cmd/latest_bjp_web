import React from 'react'

const BuildingPramukhDetailModal = ({ 
  building, 
  onClose, 
  onCall,
  onEdit,
  onDelete
}) => {
  if (!building) return null

  const renderProfileImage = (buildingData, size = 'w-12 h-12') => {
    if (buildingData.profileImage) {
      return (
        <img
          src={buildingData.profileImage}
          alt={buildingData.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    } else {
      // Generate initials from name
      const initials = buildingData.name ? buildingData.name.charAt(0).toUpperCase() : 'B'
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-sm font-bold">
            {initials}
          </span>
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
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
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-sm">
              {renderProfileImage(building, 'w-8 h-8 sm:w-12 sm:h-12')}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">{building.name}</h2>
              <p className="text-blue-100 text-xs sm:text-sm">Building Pramukh</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 shadow-sm ${
                building.last_login && building.last_login.trim() !== ''
                  ? 'bg-green-500/20 text-green-100' 
                  : 'bg-red-500/20 text-red-100'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  building.last_login && building.last_login.trim() !== '' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {building.last_login && building.last_login.trim() !== '' ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Building Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Name:</span>
                <span className="font-semibold text-sm truncate ml-2">{building.name}</span>
              </div>
              {building.phoneNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Phone:</span>
                  <span className="font-semibold text-sm truncate ml-2">{building.phoneNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Address Count:</span>
                <span className="font-semibold text-sm">{building.addressCount || building.addresses?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Voters:</span>
                <span className="font-semibold text-sm">{building.voters || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Status:</span>
                <span className="font-semibold text-sm capitalize">
                  {building.last_login && building.last_login.trim() !== '' ? 'Active' : 'inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses List */}
          {building.addresses && building.addresses.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Addresses</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {building.addresses.map((address, index) => (
                  <div key={index} className="text-sm text-gray-700 bg-white/50 rounded-lg p-2">
                    {address}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            {/* Actions Row */}
            <div className="flex flex-row space-x-3">
              {building.phoneNumber && (
                <button
                  onClick={() => onCall(building)}
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
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(building)}
                  className="w-12 h-12 font-semibold rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 bg-blue-500 hover:bg-blue-600 text-white"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(building)}
                  className="w-12 h-12 font-semibold rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 bg-red-500 hover:bg-red-600 text-white"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuildingPramukhDetailModal

