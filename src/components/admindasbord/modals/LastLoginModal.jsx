import React from 'react'

const LastLoginModal = ({ 
  userName, 
  lastLogin, 
  onClose 
}) => {
  if (!lastLogin || lastLogin.trim() === '') return null

  // Format last login date to match image format: "31 Oct, 2025 01:33 PM"
  const formatLastLogin = (lastLoginString) => {
    if (!lastLoginString || lastLoginString.trim() === '') return null
    
    try {
      // Try to parse the date string - handle various formats
      let date = new Date(lastLoginString)
      
      // If parsing fails, try common formats
      if (isNaN(date.getTime())) {
        // Try parsing with different formats
        date = new Date(lastLoginString.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'))
      }
      
      if (isNaN(date.getTime())) {
        return null
      }
      
      // Format: "31 Oct, 2025 01:33 PM"
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const day = date.getDate()
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      
      // Format time
      let hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12 // the hour '0' should be '12'
      const minutesStr = minutes < 10 ? '0' + minutes : minutes
      
      return `${day} ${month}, ${year} ${hours}:${minutesStr} ${ampm}`
    } catch (error) {
      console.error('Error formatting last login:', error)
      return null
    }
  }

  const formattedDate = formatLastLogin(lastLogin)
  if (!formattedDate) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          <div className="text-center">
            <p className="text-gray-800 text-sm sm:text-base leading-relaxed mb-2">
              <span className="font-semibold">{userName || 'User'}</span> ने आखिरी बार{' '}
              <span className="font-bold text-gray-900">{formattedDate}</span> को BJP Wings का इस्तेमाल किया था।
            </p>
            <p className="text-gray-600 text-xs sm:text-sm text-center italic mb-6">
              {userName || 'User'} last used BJP Wings on <span className="font-semibold">{formattedDate}</span>.
            </p>
          </div>
          
          {/* Ok Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LastLoginModal

