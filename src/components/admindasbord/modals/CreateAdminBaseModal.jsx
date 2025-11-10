import React, { useState, useEffect } from 'react'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'
import DuplicateMobileModal from './DuplicateMobileModal.jsx'

const CreateAdminBaseModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editData = null, 
  mode = 'create',
  // Customization props
  title = { edit: 'संपादित करें', create: 'नया' },
  subtitle = { edit: 'Edit', create: 'Create New' },
  submitButtonText = { edit: 'अपडेट करें', create: 'बनाएं' },
  inputId = 'photo-upload',
  namePlaceholder = 'Enter name',
  mobilePlaceholder = 'Enter mobile number',
  extraPayload = {}, // Additional payload fields for create and edit mode
  existingMobiles = [],
  duplicateContextLabel = 'सिस्टम',
  duplicateMessage = ''
}) => {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, mobile: '', message: '' })

  // Update form when editData changes
  useEffect(() => {
    if (editData && mode === 'edit') {
      setName(editData.name || '')
      setMobile(editData.phoneNumber || editData.mobile || editData.mobileNo || '')
      setPhoto(null) // Reset photo, user can upload new one if needed
      // Load existing photo if available
      const existingPhoto = editData.profileImage || editData.photoPath || editData.photo
      // Check if it's a valid photo URL (starts with http or /, or contains image extensions)
      const isValidPhotoUrl = existingPhoto && 
                              existingPhoto.trim() !== '' && 
                              (existingPhoto.startsWith('http') || 
                               existingPhoto.startsWith('/') || 
                               existingPhoto.includes('.jpg') || 
                               existingPhoto.includes('.jpeg') || 
                               existingPhoto.includes('.png') ||
                               existingPhoto.includes('.gif'))
      
      if (isValidPhotoUrl) {
        setExistingPhotoUrl(existingPhoto)
        setPhotoPreview(existingPhoto)
      } else {
        setExistingPhotoUrl(null)
        setPhotoPreview(null)
      }
      setPhotoRemoved(false)
    } else {
      // Reset form for create mode
      setName('')
      setMobile('')
      setPhoto(null)
      setPhotoPreview(null)
      setExistingPhotoUrl(null)
      setPhotoRemoved(false)
    }
  }, [editData, mode, isOpen])

  // Cleanup photo preview URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      // Only revoke blob URLs (created from file uploads), not server URLs
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  if (!isOpen) return null

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Clean up old preview URL if exists (only blob URLs)
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
      setPhoto(file)
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
    setPhoto(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setPhotoRemoved(true)
    // Reset file input
    const fileInput = document.getElementById(inputId)
    if (fileInput) {
      fileInput.value = ''
    }
    setShowRemoveConfirm(false)
  }

  const handleRemovePhotoCancel = () => {
    setShowRemoveConfirm(false)
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digits
    if (value.length <= 10) {
      setMobile(value)
    }
  }

  const normalizeMobileNumber = (value) => {
    if (!value) return ''
    const digits = value.toString().replace(/\D/g, '')
    if (digits.length > 10) {
      return digits.slice(-10)
    }
    return digits
  }

  const validateMobile = (mobileNumber) => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      return false
    }
    const firstDigit = mobileNumber.charAt(0)
    return firstDigit === '6' || firstDigit === '9'
  }

  const handleSubmit = async () => {
    if (duplicateModal.isOpen) {
      setDuplicateModal({ isOpen: false, mobile: '', message: '' })
    }

    // Validate name first
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    
    // Validate mobile number exists
    if (!mobile.trim()) {
      alert('Mobile number is required')
      return
    }
    
    // Validate mobile number format
    if (!validateMobile(mobile)) {
      alert('Invalid mobile number')
      return
    }

    const normalizedMobile = normalizeMobileNumber(mobile)
    const sanitizedExistingMobiles = Array.isArray(existingMobiles)
      ? existingMobiles.map(normalizeMobileNumber).filter(Boolean)
      : []
    const originalMobile = mode === 'edit'
      ? normalizeMobileNumber(
          editData?.phoneNumber ||
          editData?.mobile ||
          editData?.mobileNo ||
          editData?.mobile_no ||
          editData?.phone
        )
      : ''

    const isDuplicateMobile = normalizedMobile &&
      sanitizedExistingMobiles.includes(normalizedMobile) &&
      !(mode === 'edit' && normalizedMobile === originalMobile)

    if (isDuplicateMobile) {
      const messageToShow = duplicateMessage || `यह मोबाइल नंबर पहले से ही ${duplicateContextLabel} में उपयोग किया जा चुका है।`
      setDuplicateModal({
        isOpen: true,
        mobile: normalizedMobile,
        message: messageToShow
      })
      return
    }

    // Convert photo to base64 if present
    let photoBase64 = ''
    let photoName = ''
    
    // If photo was removed in edit mode, send empty strings
    if (photoRemoved && mode === 'edit') {
      photoBase64 = ''
      photoName = ''
    } 
    // If new photo is uploaded, convert it to base64
    else if (photo) {
      try {
        const base64String = await convertFileToBase64(photo)
        // Remove data URL prefix if present (data:image/...;base64,)
        photoBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
        photoName = photo.name
      } catch (error) {
        console.error('Error converting photo to base64:', error)
        alert('Failed to process photo. Please try again.')
        return
      }
    }
    // If in edit mode and no new photo uploaded and photo not removed, keep existing photo
    else if (mode === 'edit' && existingPhotoUrl && !photoRemoved) {
      // Keep existing photo - don't send base64, server will keep existing
      photoName = editData.photo || ''
      photoBase64 = '' // Empty base64 means keep existing photo on server
    }

    const payload = { 
      name, 
      mobile,
      mobile_no: mobile, // Also include mobile_no for API compatibility
      photo: photoName,
      base64: photoBase64,
      photoRemoved: photoRemoved && mode === 'edit', // Flag to indicate photo was removed
      ...(mode === 'create' ? extraPayload : {}),
      ...(mode === 'edit' ? extraPayload : {}), // Support extraPayload in edit mode too (for Karyakarta)
      ...(mode === 'edit' && editData ? { adminId: editData.adminId, id: editData.id, admin_id: editData.adminId } : {})
    }
    if (onSubmit) onSubmit(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-2.5 sm:p-6 text-white" style={{backgroundColor: '#103a94'}}>
          <button
            onClick={onClose}
            className="absolute top-1.5 right-1.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div>
              <h2 className="text-base sm:text-xl font-bold">
                {mode === 'edit' ? title.edit : title.create}
              </h2>
              <p className="text-blue-100 text-[10px] sm:text-sm">
                {mode === 'edit' ? subtitle.edit : subtitle.create}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-2.5 sm:p-6 space-y-3 sm:space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              नाम
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-xs sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
            />
          </div>

          {/* Mobile Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              मोबाइल नं.
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              placeholder={mobilePlaceholder}
              maxLength={10}
              className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-xs sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
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
                onChange={handlePhotoUpload}
                className="hidden"
                id={inputId}
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor={inputId}
                    className="block w-full h-24 sm:h-40 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer transition-all hover:bg-gray-100"
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
                    className="mt-1.5 sm:mt-2 text-red-600 text-[10px] sm:text-sm hover:text-red-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Remove Photo</span>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={inputId}
                  className="w-full h-20 sm:h-32 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                  style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e6f0ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f4ff'}
                >
                  <div className="text-center">
                    <svg className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#103a94'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-[10px] sm:text-sm" style={{color: '#103a94'}}>Click to upload photo</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-1.5 sm:pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-1.5 sm:py-3 px-2.5 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-xs sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 text-white font-semibold py-1.5 sm:py-3 px-2.5 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-xs sm:text-base"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
            >
              {mode === 'edit' ? submitButtonText.edit : submitButtonText.create}
            </button>
          </div>
        </div>
      </div>

      {/* Remove Photo Confirmation Modal */}
      <RemovePhotoConfirmModal
        isOpen={showRemoveConfirm}
        onConfirm={handleRemovePhotoConfirm}
        onCancel={handleRemovePhotoCancel}
      />
      <DuplicateMobileModal
        isOpen={duplicateModal.isOpen}
        mobileNumber={duplicateModal.mobile}
        message={duplicateModal.message}
        onClose={() => setDuplicateModal({ isOpen: false, mobile: '', message: '' })}
      />
    </div>
  )
}

export default CreateAdminBaseModal

