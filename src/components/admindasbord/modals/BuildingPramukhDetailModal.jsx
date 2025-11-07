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

  const handleWhatsApp = (buildingData) => {
    if (!buildingData.phoneNumber) {
      alert('Phone number not available')
      return
    }

    let phoneNumber = buildingData.phoneNumber.replace(/\D/g, '')
    phoneNumber = phoneNumber.replace(/^0+/, '')

    if (phoneNumber.startsWith('91')) {
      const actualNumber = phoneNumber.substring(2)
      if (actualNumber.length === 10) {
        window.open(`https://wa.me/${phoneNumber}`, '_blank')
        return
      }
    }

    if (phoneNumber.length === 10) {
      const formattedNumber = '91' + phoneNumber
      window.open(`https://wa.me/${formattedNumber}`, '_blank')
      return
    }

    if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
      window.open(`https://wa.me/${phoneNumber}`, '_blank')
      return
    }

    alert('Invalid phone number format. Please ensure it is a valid 10-digit Indian number.')
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
                building.status === 'active' || (building.last_login && building.last_login.trim() !== '')
                  ? 'bg-green-500/20 text-green-100' 
                  : 'bg-red-500/20 text-red-100'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  building.status === 'active' || (building.last_login && building.last_login.trim() !== '') ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {building.status === 'active' || (building.last_login && building.last_login.trim() !== '') ? 'Active' : 'Inactive'}
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
                  {building.status === 'active' || (building.last_login && building.last_login.trim() !== '') ? 'Active' : 'Inactive'}
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
              {building.phoneNumber && (
                <button
                  onClick={() => handleWhatsApp(building)}
                  className="w-12 h-12 font-semibold rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 bg-green-500 hover:bg-green-600 text-white"
                  title="WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

