import React from 'react'

const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#102463' }}>
            लॉग आउट
          </h2>
          <p className="mt-3 text-gray-700 text-sm sm:text-base">
            क्या आप लॉग आउट करना चाहते हैं?
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#102463] hover:bg-[#0b1a4d] text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-200"
          >
            ठीक है
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-[#102463] text-[#102463] font-semibold py-3 rounded-xl hover:bg-[#f3f4ff] transition-all duration-200"
          >
            रद्द करे
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutConfirmationModal


