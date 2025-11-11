import React from 'react'

const ValidationModal = ({ isOpen, message, onClose, okText = 'Ok' }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs sm:max-w-sm p-6 text-center">
        <p className="text-gray-800 text-sm sm:text-base font-medium leading-relaxed">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold text-sm sm:text-base"
          style={{ backgroundColor: '#102463' }}
        >
          {okText}
        </button>
      </div>
    </div>
  )
}

export default ValidationModal
