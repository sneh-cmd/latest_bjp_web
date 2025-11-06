import React from 'react'

const RemovePhotoConfirmModal = ({ isOpen, onConfirm, onCancel, zIndex = 60 }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm" style={{ zIndex: zIndex }}>
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">पुष्टीकरण</h2>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6">
          <p className="text-gray-700 text-sm sm:text-base mb-4">
            क्या आप वाकई इन्हें रद करना चाहते हैं?
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center text-sm sm:text-base"
            >
              नहीं
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center text-sm sm:text-base"
            >
              हाँ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemovePhotoConfirmModal

