import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const BoothPramukhListModal = ({ isOpen, onClose, boothNumber, onShowCadre }) => {
  const [boothHeads, setBoothHeads] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && boothNumber) {
      fetchBoothHeads()
    } else {
      setBoothHeads([])
    }
  }, [isOpen, boothNumber])

  const fetchBoothHeads = async () => {
    try {
      setLoading(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Get booth pramukh cadre
      const boothPramukhCadre = await apiService.displayBoothPramukhCadre(boothNumber, panelApiUrl)
      
      if (boothPramukhCadre && Array.isArray(boothPramukhCadre)) {
        // Filter by type='BP' and sub_type='BP' OR designation='बुथ प्रमुख' for Booth Head
        const transformedBoothHeadData = boothPramukhCadre
          .filter(cadre => {
            const subType = cadre.sub_type || cadre.subType || ''
            const type = cadre.type || ''
            const designation = cadre.designation || cadre.role || ''
            
            // Booth Head: type='BP' and (sub_type='BP' OR sub_type is empty/null)
            const isBoothHeadByType = type === 'BP' && (subType === 'BP' || !subType || subType === '')
            
            // Check by designation/role
            const isBoothHeadByRole = designation === 'बुथ प्रमुख' || designation === 'Booth Pramukh' || 
                                    designation === 'बूथ प्रमुख' || cadre.role === 'बुथ प्रमुख'
            
            // Explicitly exclude Co Incharge
            const isNotCoIncharge = subType !== 'BS' && 
                                   designation !== 'बुथ सह इनचार्ज' && 
                                   designation !== 'Co Incharge' &&
                                   cadre.role !== 'बुथ सह इनचार्ज'
            
            return (isBoothHeadByType || isBoothHeadByRole) && isNotCoIncharge
          })
          .map(cadre => ({
            id: cadre.id || cadre.admin_id || cadre.adminId || cadre.cadre_id,
            name: cadre.name || cadre.full_name,
            phone: cadre.phone || cadre.mobile || cadre.mobile_no || cadre.mobileNo || cadre.phoneNumber,
            role: cadre.role || cadre.designation || 'बुथ प्रमुख',
            status: cadre.status || (cadre.lastLogin || cadre.last_login ? 'active' : 'inactive'),
            profileImage: cadre.profileImage || cadre.photo_path || cadre.photoPath,
            lastLogin: cadre.lastLogin || cadre.last_login || '',
            last_login: cadre.lastLogin || cadre.last_login || ''
          }))
        
        setBoothHeads(transformedBoothHeadData)
      } else {
        setBoothHeads([])
      }
    } catch (error) {
      console.error('Error fetching booth heads:', error)
      setBoothHeads([])
    } finally {
      setLoading(false)
    }
  }

  const handleCall = (phone) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self')
    }
  }

  const handleWhatsApp = (phone) => {
    if (!phone) {
      alert('Phone number not available')
      return
    }

    // Remove all non-digit characters
    let phoneNumber = phone.replace(/\D/g, '')
    
    // Remove leading zeros
    phoneNumber = phoneNumber.replace(/^0+/, '')
    
    // If number already starts with country code 91, use it as is
    if (phoneNumber.startsWith('91')) {
      const actualNumber = phoneNumber.substring(2)
      if (actualNumber.length === 10) {
        window.open(`https://wa.me/${phoneNumber}`, '_blank')
        return
      }
    }
    
    // If number is exactly 10 digits, add country code 91
    if (phoneNumber.length === 10) {
      const formattedNumber = '91' + phoneNumber
      window.open(`https://wa.me/${formattedNumber}`, '_blank')
      return
    }
    
    // If number is 12 digits and starts with 91, use as is
    if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
      window.open(`https://wa.me/${phoneNumber}`, '_blank')
      return
    }
    
    alert('Invalid phone number format. Please ensure it is a valid 10-digit Indian number.')
  }

  const renderProfileImage = (head, size = 'w-12 h-12') => {
    if (head.profileImage) {
      return (
        <img
          src={head.profileImage}
          alt={head.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
          onError={(e) => {
            e.target.style.display = 'none'
            const fallback = e.target.nextElementSibling
            if (fallback) fallback.style.display = 'flex'
          }}
        />
      )
    }
    
    const initials = head.name ? head.name.charAt(0).toUpperCase() : 'B'
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200 ${head.profileImage ? 'hidden' : ''}`}>
        <span className="text-white text-sm font-bold">
          {initials}
        </span>
      </div>
    )
  }

  const isActive = (head) => {
    return head.lastLogin && head.lastLogin.toString().trim() !== '' || 
           head.last_login && head.last_login.toString().trim() !== ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">बूथ प्रमुख</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : boothHeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>कोई बूथ प्रमुख नहीं मिला</p>
            </div>
          ) : (
            <div className="space-y-3">
              {boothHeads.map((head) => (
                <div key={head.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {/* Profile Image with Status Indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="relative">
                      {renderProfileImage(head, 'w-12 h-12')}
                      {head.profileImage && (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200 hidden absolute inset-0">
                          <span className="text-white text-sm font-bold">
                            {head.name ? head.name.charAt(0).toUpperCase() : 'B'}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Status Indicator */}
                    <div className="absolute -top-1 -right-1">
                      {isActive(head) ? (
                        <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and Phone */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold text-sm sm:text-base truncate">
                      {head.name}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">
                      {head.phone || 'Phone not available'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleCall(head.phone)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleWhatsApp(head.phone)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Button */}
        {boothHeads.length > 0 && (
          <div className="p-4 border-t">
            <button
              onClick={() => {
                if (onShowCadre) {
                  onShowCadre()
                }
                onClose()
              }}
              className="w-full bg-blue-800 text-white font-medium py-3 rounded-lg hover:bg-blue-900 transition-colors"
            >
              Show Booth Cadre
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BoothPramukhListModal

