import React from 'react'

const CheckButton = ({ voter, onShowModal }) => {
  const handleCheckAction = () => {
    console.log('Check voter:', voter)
    
    // Get mobile number from voter data (support mobileNumber, mobile, and contact_no fields)
    const mobileNumber = voter.mobileNumber || voter.mobile || voter.contact_no || ''
    const sanitizedMobile = mobileNumber.toString().trim()
    
    // Check if mobile number exists and is valid (not empty, not '-', not 'N/A')
    if (sanitizedMobile && sanitizedMobile !== '-' && sanitizedMobile !== 'N/A' && sanitizedMobile.length >= 10) {
      // Remove any non-digit characters except + for international numbers
      const cleanMobile = sanitizedMobile.replace(/[^\d+]/g, '')
      
      // Redirect to WhatsApp
      // Format: https://wa.me/{countrycode}{number} (without + or 0)
      let whatsappNumber = cleanMobile
      if (whatsappNumber.startsWith('+')) {
        whatsappNumber = whatsappNumber.substring(1)
      } else if (whatsappNumber.startsWith('0')) {
        // If starts with 0, assume Indian number and replace with 91
        whatsappNumber = '91' + whatsappNumber.substring(1)
      } else if (whatsappNumber.length === 10) {
        // If 10 digits, assume Indian number and add 91
        whatsappNumber = '91' + whatsappNumber
      }
      
      window.open(`https://wa.me/${whatsappNumber}`, '_blank')
    } else {
      // Show modal if mobile number not found
      if (onShowModal) {
        onShowModal()
      }
    }
  }

  return (
    <button
      onClick={handleCheckAction}
      className="flex flex-col items-center space-y-0.5 sm:space-y-1"
      type="button"
    >
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>
      <span className="text-[10px] sm:text-xs text-gray-600">Check</span>
    </button>
  )
}

export default CheckButton

