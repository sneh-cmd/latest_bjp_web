import React from 'react'

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, admin }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 text-white" style={{backgroundColor: '#dc2626'}}>
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
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Delete User</h2>
              <p className="text-red-100 text-xs sm:text-sm">Confirm deletion</p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-gray-700 text-sm sm:text-base">
            Are you sure you want to delete <span className="font-semibold">{admin?.name || 'this user'}</span>? This action cannot be undone.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal

