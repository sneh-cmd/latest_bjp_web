import React from 'react'

const DuplicateMobileModal = ({
  isOpen,
  mobileNumber = '',
  message = '',
  onClose
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs sm:max-w-sm bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        <div className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
          {mobileNumber && (
            <div className="text-lg sm:text-2xl font-bold text-red-600 tracking-widest">
              {mobileNumber}
            </div>
          )}
          <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
            {message || 'यह मोबाइल नंबर पहले से ही उपयोग किया जा चुका है।'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-w-[120px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-white text-xs sm:text-sm transition-all shadow-sm hover:shadow-md"
              style={{ backgroundColor: '#103a94' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0d2f7a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#103a94' }}
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DuplicateMobileModal


