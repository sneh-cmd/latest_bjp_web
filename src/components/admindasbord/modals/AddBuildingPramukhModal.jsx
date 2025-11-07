import React, { useState, useEffect } from 'react'
import { apiService } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'

const AddBuildingPramukhModal = ({ isOpen, onClose, onSave, building = null, onSuccess = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photo: null
  })

  const isEditMode = !!building
  
  const [selectedAddresses, setSelectedAddresses] = useState([])
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [addressSearch, setAddressSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [addressOptions, setAddressOptions] = useState([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  // Initialize form with building data when modal opens (edit mode)
  useEffect(() => {
    if (isOpen && building && isEditMode) {
      setFormData({
        name: building.name || '',
        phone: building.phoneNumber || building.mobileNo || building.phone || '',
        photo: null
      })
      // Set addresses from building.addresses array
      setSelectedAddresses(building.addresses || [])
      // Set photo preview if available
      const existingPhoto = building.profileImage || building.photoPath || building.photo
      if (existingPhoto && existingPhoto.trim() !== '') {
        let photoUrl = existingPhoto.trim()
        // If it's not a full URL and not starting with / or data:, try to construct proper URL
        if (!photoUrl.startsWith('http') && !photoUrl.startsWith('/') && !photoUrl.startsWith('data:')) {
          if (photoUrl.includes('.jpg') || photoUrl.includes('.jpeg') || 
              photoUrl.includes('.png') || photoUrl.includes('.gif') ||
              photoUrl.includes('.JPG') || photoUrl.includes('.JPEG') ||
              photoUrl.includes('.PNG') || photoUrl.includes('.GIF')) {
            photoUrl = '/' + photoUrl
          } else if (building.isPhoto) {
            photoUrl = '/' + photoUrl
          }
        }
        setExistingPhotoUrl(building.photoPath)
        setPhotoPreview(building.photoPath)
      } else {
        setExistingPhotoUrl(null)
        setPhotoPreview(null)
      }
      setPhotoRemoved(false)
    } else if (isOpen && !building) {
      // Reset form for create mode
      setFormData({ name: '', phone: '', photo: null })
      setSelectedAddresses([])
      setPhotoPreview(null)
      setExistingPhotoUrl(null)
      setPhotoRemoved(false)
    }
  }, [isOpen, building, isEditMode])

  // Cleanup photo preview URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      // Only revoke blob URLs (created from file uploads), not server URLs
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  // Fetch addresses from API when modal opens
  useEffect(() => {
    if (isOpen && addressOptions.length === 0 && !addressLoading) {
      fetchAddresses()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAddressPicker && !e.target.closest('.address-picker-container')) {
        setShowAddressPicker(false)
      }
    }
    if (showAddressPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddressPicker])

  const fetchAddresses = async () => {
    setAddressLoading(true)
    setAddressError(null)
    try {
      // Use the API endpoint - handle dev/prod cases
      const endpoint = import.meta.env.DEV 
        ? '/panel-api/webservice.asmx' 
        : 'http://ntmc2.mhbjplok.com/webservice.asmx'
      const soapBody = '<dis_all_address xmlns="http://tempuri.org/" />'
      
      const response = await apiService.makeRequest(
        endpoint,
        'POST',
        'dis_all_address',
        soapBody,
        true // use admin auth
      )

      // Extract addresses from response
      // Response structure: { Success: "1", result: [{ eng_localityid: "address" }, ...] }
      if (response && Array.isArray(response)) {
        const addresses = response
          .map(item => item.eng_localityid)
          .filter(addr => addr && addr.trim())
        setAddressOptions(addresses)
      } else if (response && response.result && Array.isArray(response.result)) {
        const addresses = response.result
          .map(item => item.eng_localityid)
          .filter(addr => addr && addr.trim())
        setAddressOptions(addresses)
      } else {
        throw new Error('Invalid response format from API')
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setAddressError('पते लोड करने में त्रुटि: ' + error.message)
      // Keep empty array on error
      setAddressOptions([])
    } finally {
      setAddressLoading(false)
    }
  }

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      // Only allow digits and max 10 digits
      const digitsOnly = value.replace(/\D/g, '')
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validateMobile = (mobileNumber) => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      return false
    }
    const firstDigit = mobileNumber.charAt(0)
    return firstDigit === '6' || firstDigit === '9'
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      // Clean up old preview URL if exists (only blob URLs)
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
      setFormData(prev => ({ ...prev, photo: file }))
      setPhotoRemoved(false) // Reset photoRemoved when new photo is uploaded
      setExistingPhotoUrl(null) // Clear existing photo URL when new one is uploaded
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
    }
  }

  const handleRemovePhotoClick = () => {
    setShowRemoveConfirm(true)
  }

  const handleRemovePhotoConfirm = () => {
    // Clean up object URL if it was created from file upload
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setFormData(prev => ({ ...prev, photo: null }))
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setPhotoRemoved(true)
    // Reset file input
    const fileInput = document.getElementById(isEditMode ? 'edit-building-photo-input' : 'building-photo-input')
    if (fileInput) {
      fileInput.value = ''
    }
    setShowRemoveConfirm(false)
  }

  const handleRemovePhotoCancel = () => {
    setShowRemoveConfirm(false)
  }

  const handlePhotoButtonClick = () => {
    document.getElementById(isEditMode ? 'edit-building-photo-input' : 'building-photo-input').click()
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const sanitizeFileName = (fileName = '') => {
    if (!fileName) return ''
    const timestamp = Date.now()
    const dotIndex = fileName.lastIndexOf('.')
    const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName
    const ext = dotIndex > 0 ? fileName.slice(dotIndex).toLowerCase() : ''
    const safeBase = base
      .toString()
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase() || 'photo'
    return `building_${timestamp}_${safeBase}${ext}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate name first
    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }
    
    // Validate mobile number exists
    if (!formData.phone.trim()) {
      alert('Mobile number is required')
      return
    }
    
    // Validate mobile number format
    if (!validateMobile(formData.phone)) {
      alert('Invalid mobile number')
      return
    }
    if (selectedAddresses.length === 0) {
      alert('कृपया कम से कम एक पता चुनें')
      return
    }
    
    setLoading(true)
    try {
      // Prepare address string - join with % and end with %
      const addressString = selectedAddresses.join('%') + '%'
      
      // Get or fallback to default API URL
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      // Get login ID (admin ID) from user data
      const loginId = userData?.admin?.adminId || userData?.admin?.id || '1'
      
      // Prepare photo data
      let photoBase64 = ''
      let photoName = ''
      
      // If photo was removed in edit mode, send empty strings
      if (photoRemoved && isEditMode) {
        photoBase64 = ''
        photoName = ''
      } 
      // If new photo is uploaded, convert it to base64
      else if (formData.photo) {
        try {
          const base64String = await convertFileToBase64(formData.photo)
          // Remove data URL prefix if present (data:image/...;base64,)
          photoBase64 = base64String.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
          photoName = sanitizeFileName(formData.photo.name)
        } catch (error) {
          console.error('Error converting photo to base64:', error)
          alert('फोटो प्रोसेस करने में त्रुटि. कृपया पुनः प्रयास करें.')
          setLoading(false)
          return
        }
      }
      // If in edit mode and no new photo uploaded and photo not removed, keep existing photo
      else if (isEditMode && existingPhotoUrl && !photoRemoved) {
        // Keep existing photo - don't send base64, server will keep existing
        photoName = building.photoPath || building.profileImage || building.photo || ''
        photoBase64 = '' // Empty base64 means keep existing photo on server
      }

      if (isEditMode && building) {
        // Update mode - use updateAdmin API
        const updateData = {
          admin_id: building.id || building.adminId,
          type: 'AP',
          sub_type: 'AP',
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: photoRemoved ? '' : (photoName || building.photoPath || building.profileImage || building.photo || ''),
          base64: photoBase64 || '',
          idcard_no: '',
          booth_javabdari: '0',
          page_javabdari: '',
          add: addressString,
          modify_by: loginId
        }

        console.log('📤 Updating building pramukh data:', updateData)

        // Call the update_admin API
        const response = await apiService.updateAdmin(updateData, panelApiUrl)
        
        // Check for successful response
        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          // Success - call the provided onSuccess callback
          if (onSuccess) {
            onSuccess()
          } else if (onSave) {
            onSave({ ...formData, addresses: selectedAddresses, apiResponse: response })
          }
          onClose && onClose()
        } else {
          console.error('Update building pramukh unexpected response:', response)
          throw new Error('Failed to update building pramukh')
        }
      } else {
        // Create mode - use insertAdmin API
        const adminData = {
          type: 'AP', // Building Pramukh
          sub_type: 'AP',
          main_admin_id: '0',
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: photoName || '',
          base64: photoBase64 || '',
          idcard_no: '', // Empty string as per API example
          booth_javabdari: '0',
          page_javabdari: '', // Empty string as per API example
          add: addressString,
          create_by: loginId // Use login ID instead of hardcoded '1'
        }

        console.log('📤 Submitting building pramukh data:', adminData)

        // Call the insert_admin API
        const response = await apiService.insertAdmin(adminData, panelApiUrl)
        
        // Check for successful response
        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          // Success - call the provided onSave callback
          onSave && onSave({ ...formData, addresses: selectedAddresses, apiResponse: response })
          
          // Reset form
          setFormData({ name: '', phone: '', photo: null })
          setSelectedAddresses([])
          setPhotoPreview(null)
          setExistingPhotoUrl(null)
          setPhotoRemoved(false)
          onClose && onClose()
        } else {
          console.error('Insert building pramukh unexpected response:', response)
          throw new Error('Failed to save building pramukh')
        }
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'saving'} building pramukh:`, error)
      alert(`बिल्डिंग प्रमुख ${isEditMode ? 'अपडेट' : 'सेव'} करने में विफल. कृपया पुन: प्रयास करें.`)
    } finally {
      setLoading(false)
    }
  }

  const toggleAddress = (addr) => {
    setSelectedAddresses(prev => {
      if (prev.includes(addr)) return prev.filter(a => a !== addr)
      return [...prev, addr]
    })
  }

  const removeAddress = (addr) => {
    setSelectedAddresses(prev => prev.filter(a => a !== addr))
  }

  const filteredAddresses = addressOptions.filter(a => {
    if (a == null) return false
    const addressStr = String(a)
    return addressStr.toLowerCase().includes(addressSearch.toLowerCase())
  })

  return (
    <>
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-3 sm:p-5 text-white" style={{backgroundColor: '#103a94'}}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {isEditMode ? 'बिल्डिंग प्रमुख संपादित करें' : 'बिल्डिंग प्रमुख'}
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                {isEditMode ? 'Edit Building Pramukh' : 'Create New Building Pramukh'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4" style={{backgroundColor:'#f4f6ff'}} noValidate>
          {/* Address Multi-select */}
          <div className="relative address-picker-container">
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>पता</label>
            <button
              type="button"
              onClick={() => setShowAddressPicker(!showAddressPicker)}
              className="flex w-full items-center justify-between rounded-lg border px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-left transition-all text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onMouseEnter={(e) => e.target.style.borderColor = '#0d2f7a'}
              onMouseLeave={(e) => e.target.style.borderColor = '#103a94'}
            >
              <span className="text-gray-800">
                {selectedAddresses.length > 0 ? `${selectedAddresses.length} पता` : 'चुनें'}
              </span>
              <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {showAddressPicker && (
              <div className="absolute left-0 right-0 z-[200] mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    placeholder="सर्च दर्ज करें"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:text-base"
                    disabled={addressLoading}
                  />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {addressLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-600">पते लोड हो रहे हैं...</div>
                    </div>
                  ) : addressError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-red-600">{addressError}</div>
                    </div>
                  ) : filteredAddresses.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-600">कोई पता नहीं मिला</div>
                    </div>
                  ) : (
                    filteredAddresses.map((addr, idx) => {
                      const checked = selectedAddresses.includes(addr)
                      return (
                        <label key={`${addr}-${idx}`} className="flex cursor-pointer items-center space-x-3 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddress(addr)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-800">{addr}</span>
                        </label>
                      )
                    })
                  )}
                </div>
                <div className="p-2" style={{ backgroundColor: '#103a94' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(false)}
                    className="w-full rounded-md py-2 text-center text-white font-semibold text-sm sm:text-base"
                  >
                    ठीक है
                  </button>
                </div>
              </div>
            )}

            {/* Selected list display */}
            {selectedAddresses.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-gray-200 rounded-lg border border-gray-200">
                {selectedAddresses.map((addr, i) => (
                  <div key={`${addr}-${i}`} className="flex items-start justify-between p-3">
                    <div className="pr-3 text-sm text-gray-800">{addr}</div>
                    <button type="button" onClick={() => removeAddress(addr)} className="text-gray-500 hover:text-gray-700">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              नाम
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter name"
            />
          </div>

          {/* Mobile Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              मोबाइल नं.
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              className="w-full px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter mobile number"
            />
          </div>

          {/* Photo Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              फोटो
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id={isEditMode ? 'edit-building-photo-input' : 'building-photo-input'}
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor={isEditMode ? 'edit-building-photo-input' : 'building-photo-input'}
                    className="block w-full h-28 sm:h-32 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer transition-all hover:bg-gray-100"
                    style={{borderColor: '#103a94'}}
                    onMouseEnter={(e) => e.target.style.borderColor = '#0d2f7a'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#103a94'}
                  >
                    <img
                      src={photoPreview}
                      alt="Photo preview - Click to change"
                      className="max-w-full max-h-full object-contain"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePhotoClick}
                    className="mt-1.5 text-red-600 text-xs sm:text-sm hover:text-red-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Remove Photo</span>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={isEditMode ? 'edit-building-photo-input' : 'building-photo-input'}
                  className="w-full h-20 sm:h-28 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                  style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e6f0ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f4ff'}
                >
                  <div className="text-center">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#103a94'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-xs sm:text-sm" style={{color: '#103a94'}}>Click to upload photo</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base disabled:opacity-60"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0d2f7a')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#103a94')}
            >
              {loading 
                ? (isEditMode ? 'अपडेट हो रहा है...' : 'सेव हो रहा है...') 
                : (isEditMode ? 'बिल्डिंग प्रमुख अपडेट करें' : 'बिल्डिंग प्रमुख बनाएं')}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Remove Photo Confirmation Modal */}
    <RemovePhotoConfirmModal
      isOpen={showRemoveConfirm}
      onConfirm={handleRemovePhotoConfirm}
      onCancel={handleRemovePhotoCancel}
      zIndex={70}
    />
    </>
  )
}

export default AddBuildingPramukhModal


